import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { bulkAssignSchema } from '@/lib/validation';

// =====================================================================
// /api/admissions/leads/bulk-assign — reassign many leads at once
// (permission leads.assign).
// =====================================================================

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => bulkAssignSchema.parse(j));

    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    const assignee = await db.user.findFirst({ where: { id: body.assignedTo, isActive: true } });
    if (!assignee) return fail('Counsellor not found', 422);

    const result = await db.admissionLead.updateMany({
      where: { id: { in: body.leadIds }, schoolId: school.id },
      data: { assignedTo: assignee.id, lastActivityAt: new Date() },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LEAD_BULK_ASSIGN',
      entityType: 'lead',
      entityId: null,
      after: { count: result.count, assignedTo: assignee.id, assignedToName: assignee.name },
    });

    return ok({ updated: result.count });
  },
  { permission: PERMISSIONS.LEADS_ASSIGN },
);
