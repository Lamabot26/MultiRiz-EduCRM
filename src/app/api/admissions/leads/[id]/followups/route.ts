import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { followupCreateSchema } from '@/lib/validation';

// =====================================================================
// /api/admissions/leads/[id]/followups — POST create, PATCH complete.
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

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => followupCreateSchema.parse(j));
    const lead = await loadScopedLead(req, user);
    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new ApiError('Invalid due date', 422);

    const followup = await db.leadFollowup.create({
      data: {
        leadId: lead.id,
        dueDate,
        note: body.note ?? null,
        status: 'PENDING',
        createdById: user.id,
      },
    });
    // Keep the lead's next-follow-up pointer in sync when this is the earliest.
    const shouldSet =
      !lead.nextFollowUpDate || dueDate < lead.nextFollowUpDate || lead.nextFollowUpDate < new Date();
    if (shouldSet) {
      await db.admissionLead.update({
        where: { id: lead.id },
        data: { nextFollowUpDate: dueDate, lastActivityAt: new Date() },
      });
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FOLLOWUP_CREATE',
      entityType: 'lead',
      entityId: lead.id,
      after: { followupId: followup.id, dueDate, note: body.note ?? null },
    });

    return ok({ id: followup.id, dueDate: followup.dueDate }, { status: 201 });
  },
  { permission: PERMISSIONS.LEADS_WRITE },
);

export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const raw = (await req.json().catch(() => null)) as {
      followupId?: string; status?: string; note?: string;
    } | null;
    if (!raw?.followupId) throw new ApiError('followupId is required', 422);
    if (!['DONE', 'CANCELLED'].includes(raw.status ?? '')) {
      throw new ApiError('status must be DONE or CANCELLED', 422);
    }
    const lead = await loadScopedLead(req, user);

    const existing = await db.leadFollowup.findFirst({
      where: { id: raw.followupId, leadId: lead.id },
    });
    if (!existing) throw new ApiError('Follow-up not found', 404);

    const done = raw.status === 'DONE';
    const followup = await db.leadFollowup.update({
      where: { id: existing.id },
      data: {
        status: raw.status,
        note: raw.note !== undefined ? raw.note : existing.note,
        completedAt: done ? new Date() : existing.completedAt,
        completedBy: done ? user.id : existing.completedBy,
      },
    });
    await db.admissionLead.update({
      where: { id: lead.id },
      data: { lastActivityAt: new Date() },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FOLLOWUP_UPDATE',
      entityType: 'lead',
      entityId: lead.id,
      before: { followupId: existing.id, status: existing.status },
      after: { followupId: followup.id, status: followup.status },
    });

    return ok({ id: followup.id, status: followup.status });
  },
  { permission: PERMISSIONS.LEADS_WRITE },
);
