import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { activityCreateSchema } from '@/lib/validation';

// =====================================================================
// /api/admissions/leads/[id]/activities — POST add note/call/email/whatsapp.
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('leads');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => activityCreateSchema.parse(j));

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

    const activity = await db.$transaction(async (tx) => {
      const row = await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: body.type,
          title: body.title,
          content: body.content ?? null,
          outcome: body.outcome ?? null,
          performedBy: user.id,
        },
      });
      await tx.admissionLead.update({
        where: { id: lead.id },
        data: { lastActivityAt: new Date() },
      });
      return row;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LEAD_ACTIVITY_CREATE',
      entityType: 'lead',
      entityId: lead.id,
      after: { activityId: activity.id, type: activity.type, title: activity.title },
    });

    return ok({ id: activity.id }, { status: 201 });
  },
  { permission: PERMISSIONS.LEADS_WRITE, rateLimit: { key: 'lead-activity', limit: 120, windowMs: 60_000 } },
);
