import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { visitCreateSchema } from '@/lib/validation';

// =====================================================================
// /api/admissions/leads/[id]/visits — POST schedule, PATCH status.
// Scheduling on a NEW-ish lead auto-moves it to VISIT_SCHEDULED.
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('leads');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

async function loadScopedLead(req: Request, user: AuthUser) {
  const id = idFromUrl(req);
  if (!id) throw new ApiError('Lead id missing', 400);
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured yet', 503);
  const lead = await db.admissionLead.findUnique({ where: { id } });
  if (!lead || lead.schoolId !== school.id) throw new ApiError('Lead not found', 404);
  if (
    !hasPermission(user, PERMISSIONS.LEADS_READ_ALL) &&
    lead.assignedTo !== user.id &&
    lead.createdById !== user.id
  ) {
    throw new ApiError('You do not have permission to modify this lead', 403);
  }
  return lead;
}

const NEWISH = ['NEW', 'CONTACTED', 'FOLLOW_UP'];

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => visitCreateSchema.parse(j));
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new ApiError('Invalid visit date', 422);
    const lead = await loadScopedLead(req, user);

    const result = await db.$transaction(async (tx) => {
      const visit = await tx.campusVisit.create({
        data: {
          leadId: lead.id,
          scheduledAt,
          status: 'SCHEDULED',
          visitorName: body.visitorName ?? lead.guardianName,
          visitorMobile: body.visitorMobile ?? lead.mobile,
          notes: body.notes ?? null,
          createdById: user.id,
        },
      });
      const moved = NEWISH.includes(lead.status);
      if (moved) {
        await tx.admissionLead.update({
          where: { id: lead.id },
          data: { status: 'VISIT_SCHEDULED', lastActivityAt: new Date() },
        });
      }
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'VISIT',
          title: 'Campus visit scheduled',
          content: `Visit on ${scheduledAt.toLocaleString('en-IN')}${moved ? ' — lead moved to Visit Scheduled.' : ''}`,
          performedBy: user.id,
        },
      });
      return { visit, moved };
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'VISIT_SCHEDULE',
      entityType: 'lead',
      entityId: lead.id,
      after: { visitId: result.visit.id, scheduledAt, status: 'SCHEDULED' },
    });

    return ok({ id: result.visit.id, leadStatusMoved: result.moved }, { status: 201 });
  },
  { permission: PERMISSIONS.LEADS_WRITE },
);

export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const raw = (await req.json().catch(() => null)) as { visitId?: string; status?: string } | null;
    if (!raw?.visitId || !raw.status) throw new ApiError('visitId and status are required', 422);
    if (!['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(raw.status)) {
      throw new ApiError('status must be COMPLETED, NO_SHOW or CANCELLED', 422);
    }
    const lead = await loadScopedLead(req, user);

    const existing = await db.campusVisit.findFirst({ where: { id: raw.visitId, leadId: lead.id } });
    if (!existing) throw new ApiError('Visit not found', 404);

    const visit = await db.campusVisit.update({
      where: { id: existing.id },
      data: { status: raw.status, attendedBy: raw.status === 'COMPLETED' ? user.id : existing.attendedBy },
    });
    await db.admissionLead.update({ where: { id: lead.id }, data: { lastActivityAt: new Date() } });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'VISIT_UPDATE',
      entityType: 'lead',
      entityId: lead.id,
      before: { visitId: existing.id, status: existing.status },
      after: { visitId: visit.id, status: visit.status },
    });

    return ok({ id: visit.id, status: visit.status });
  },
  { permission: PERMISSIONS.LEADS_WRITE },
);
