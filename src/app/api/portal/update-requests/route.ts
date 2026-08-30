import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { profileUpdateRequestSchema } from '@/lib/validation';

// POST /api/portal/update-requests — parent/student profile change request.
// Logged for office verification; the office updates the record + audits.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured', 503);
    const body = await parseBody(req, profileUpdateRequestSchema);

    const log = await db.communicationLog.create({
      data: {
        schoolId: school.id,
        channel: 'IN_PERSON',
        direction: 'INBOUND',
        subject: `[Profile Update Request] ${body.field} — ${user.name}`,
        content: `Requested by: ${user.name} <${user.email}>\nField: ${body.field}\nCurrent: ${body.currentValue ?? '—'}\nRequested: ${body.requestedValue}\nReason: ${body.reason ?? '—'}`,
        relatedUserId: user.id,
        status: 'RECEIVED',
      },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'PROFILE_UPDATE_REQUEST',
      entityType: 'communication_log',
      entityId: log.id,
      after: { field: body.field, requestedBy: user.id },
    });
    return ok({ message: 'Request submitted. The school office will verify and update the record.' });
  },
  { permission: PERMISSIONS.PROFILE_UPDATE_REQUEST, rateLimit: { key: 'profile-request', limit: 5, windowMs: 60 * 60 * 1000 } },
);
