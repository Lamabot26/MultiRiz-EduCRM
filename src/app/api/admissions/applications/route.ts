import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { applicationCreateSchema } from '@/lib/validation';
import { nextNumberTx } from '@/lib/sequences';

// =====================================================================
// /api/admissions/applications — GET list + POST create (manual entry).
// =====================================================================

export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  const school = await db.school.findFirst();
  if (!school) return fail('School not configured yet', 503);

  const url = new URL(req.url);
  const statusRaw = url.searchParams.get('status') ?? '';
  const status = statusRaw && statusRaw !== 'all' ? statusRaw : '';
  const q = url.searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));

  const where = {
    schoolId: school.id,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { studentName: { contains: q } },
            { applicationNumber: { contains: q } },
            { guardianName: { contains: q } },
            { mobile: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, apps, statRows] = await Promise.all([
    db.admissionApplication.count({ where }),
    db.admissionApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        documents: { select: { isVerified: true } },
        lead: { select: { id: true, leadNumber: true } },
      },
    }),
    db.admissionApplication.groupBy({ by: ['status'], where: { schoolId: school.id }, _count: true }),
  ]);

  const stats: Record<string, number> = {};
  for (const r of statRows) stats[r.status] = r._count;

  const items = apps.map((a) => ({
    ...a,
    docsTotal: a.documents.length,
    docsVerified: a.documents.filter((d) => d.isVerified).length,
    documents: undefined,
  }));

  return ok({ items, total, page, pageSize, stats });
});

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => applicationCreateSchema.parse(j));

    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    const session = await db.academicSession.findFirst({
      where: { id: body.academicSessionId, schoolId: school.id },
    });
    if (!session) throw new ApiError('Academic session not found', 422);

    // Optional lead link must exist in this school
    if (body.leadId) {
      const lead = await db.admissionLead.findFirst({ where: { id: body.leadId, schoolId: school.id } });
      if (!lead) throw new ApiError('Linked lead not found', 422);
    }

    const status = body.status ?? 'SUBMITTED';
    const application = await db.$transaction(async (tx) => {
      const applicationNumber = await nextNumberTx(tx, school.id, 'APPLICATION', session.name, 'APP');
      return tx.admissionApplication.create({
        data: {
          schoolId: school.id,
          applicationNumber,
          leadId: body.leadId ?? null,
          academicSessionId: session.id,
          classApplyingFor: body.classApplyingFor,
          studentName: body.studentName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender ?? null,
          guardianName: body.guardianName,
          mobile: body.mobile,
          email: body.email ?? null,
          address: body.address ?? null,
          previousSchool: body.previousSchool ?? null,
          status,
          submittedAt: status === 'DRAFT' ? null : new Date(),
          createdById: user.id,
        },
      });
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'APPLICATION_CREATE',
      entityType: 'application',
      entityId: application.id,
      after: {
        applicationNumber: application.applicationNumber,
        studentName: application.studentName,
        status: application.status,
      },
    });

    return ok({ id: application.id, applicationNumber: application.applicationNumber }, { status: 201 });
  },
  {
    permission: PERMISSIONS.APPLICATIONS_MANAGE,
    rateLimit: { key: 'application-create', limit: 60, windowMs: 60_000 },
  },
);
