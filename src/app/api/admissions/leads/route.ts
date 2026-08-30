import { db } from '@/lib/db';
import {
  withApi, ok, fail, writeAudit, auditFrom, ApiError,
} from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { leadCreateSchema } from '@/lib/validation';
import { nextNumberTx } from '@/lib/sequences';
import type { Prisma } from '@prisma/client';

// =====================================================================
// /api/admissions/leads — list (GET) + create (POST).
// Read access: leads.read.all OR leads.read.assigned OR leads.write.
// Without read.all the result set is forced to the caller's own leads
// (assigned to them or created by them).
// =====================================================================

function leadReadScope(user: AuthUser, schoolId: string): Record<string, unknown> {
  if (hasPermission(user, PERMISSIONS.LEADS_READ_ALL)) return { schoolId };
  return { schoolId, OR: [{ assignedTo: user.id }, { createdById: user.id }] };
}

// ---------------------------------------------------------------------
// GET /api/admissions/leads
// ---------------------------------------------------------------------
export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  const allowed = canAny(user.roles, [
    PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_READ_ASSIGNED, PERMISSIONS.LEADS_WRITE,
  ]);
  if (!allowed) return fail('You do not have permission to perform this action', 403);

  const school = await db.school.findFirst();
  if (!school) return fail('School not configured yet', 503);

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const priority = url.searchParams.get('priority') ?? '';
  const assignedToParam = url.searchParams.get('assignedTo') ?? '';
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));

  const scope = leadReadScope(user, school.id);
  // read.assigned-only users are always forced onto their own leads.
  const effectiveAssignedTo = hasPermission(user, PERMISSIONS.LEADS_READ_ALL)
    ? assignedToParam
    : user.id;

  const where: Prisma.AdmissionLeadWhereInput = {
    ...scope,
    ...(status ? { status } : {}),
    ...(source ? { leadSource: { name: source } } : {}),
    ...(priority ? { priority } : {}),
    ...(effectiveAssignedTo ? { assignedTo: effectiveAssignedTo } : {}),
    ...(q
      ? {
          OR: [
            { studentName: { contains: q } },
            { guardianName: { contains: q } },
            { mobile: { contains: q } },
            { email: { contains: q } },
            { leadNumber: { contains: q } },
          ],
        }
      : {}),
  };

  const statsWhere: Prisma.AdmissionLeadWhereInput = { ...where };
  delete statsWhere.status;

  const [total, leads, statRows] = await Promise.all([
    db.admissionLead.count({ where }),
    db.admissionLead.findMany({
      where,
      orderBy: { lastActivityAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        leadSource: { select: { name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    db.admissionLead.groupBy({ by: ['status'], where: statsWhere, _count: true }),
  ]);

  const stats: Record<string, number> = {};
  for (const row of statRows) stats[row.status] = row._count;

  return ok({
    items: leads,
    total,
    page,
    pageSize,
    stats,
  });
});

// ---------------------------------------------------------------------
// POST /api/admissions/leads — create (permission leads.write)
// Duplicate detection: same mobile OR email in the last 90 days → 409
// with { existing } unless force=true.
// ---------------------------------------------------------------------
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw) throw new ApiError('Invalid JSON body', 400);
    const force = raw.force === true;
    const body = leadCreateSchema.parse(raw);

    // Duplicate detection (mobile OR email, last 90 days)
    if (!force) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
      const dup = await db.admissionLead.findFirst({
        where: {
          schoolId: school.id,
          createdAt: { gte: ninetyDaysAgo },
          OR: [
            { mobile: body.mobile },
            ...(body.email ? [{ email: body.email }] : []),
          ],
        },
        select: { id: true, leadNumber: true, studentName: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dup) {
        return fail('A similar enquiry already exists', 409, {
          existing: { id: dup.id, leadNumber: dup.leadNumber, studentName: dup.studentName },
        });
      }
    }

    // Resolve FK-ish references safely
    const session = body.academicSessionId
      ? await db.academicSession.findFirst({ where: { id: body.academicSessionId, schoolId: school.id } })
      : await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });
    const sessionLabel = session?.name ?? 'SESSION';

    let leadSourceId: string | null = null;
    if (body.leadSourceId) {
      const src = await db.leadSource.findFirst({ where: { id: body.leadSourceId, schoolId: school.id } });
      leadSourceId = src?.id ?? null;
    }
    let assignedTo: string | null = null;
    if (body.assignedTo) {
      const assignee = await db.user.findFirst({ where: { id: body.assignedTo, isActive: true } });
      assignedTo = assignee?.id ?? null;
    }

    const created = await db.$transaction(async (tx) => {
      const leadNumber = await nextNumberTx(tx, school.id, 'LEAD', sessionLabel, 'LEAD');
      const lead = await tx.admissionLead.create({
        data: {
          schoolId: school.id,
          leadNumber,
          studentName: body.studentName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender ?? null,
          classApplyingFor: body.classApplyingFor ?? null,
          academicSessionId: session?.id ?? null,
          guardianName: body.guardianName,
          mobile: body.mobile,
          altMobile: body.altMobile ?? null,
          email: body.email ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          previousSchool: body.previousSchool ?? null,
          leadSourceId,
          sourceNotes: body.sourceNotes ?? null,
          assignedTo,
          status: body.status ?? 'NEW',
          priority: body.priority ?? 'MEDIUM',
          notes: body.notes ?? null,
          nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
          createdById: user.id,
          lastActivityAt: new Date(),
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE',
          title: 'Lead created',
          content: `Enquiry captured via staff dashboard${leadSourceId ? '' : ' (no source set)'}.`,
          performedBy: user.id,
        },
      });
      return lead;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LEAD_CREATE',
      entityType: 'lead',
      entityId: created.id,
      after: { leadNumber: created.leadNumber, studentName: created.studentName, mobile: created.mobile, status: created.status },
    });

    return ok({ id: created.id, leadNumber: created.leadNumber }, { status: 201 });
  },
  {
    permission: PERMISSIONS.LEADS_WRITE,
    rateLimit: { key: 'lead-create', limit: 60, windowMs: 60_000 },
  },
);
