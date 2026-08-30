import { z } from 'zod';
import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { hasPermission } from '@/lib/auth-guard';
import { COMMUNICATION_CHANNELS } from '@/lib/constants';

// =====================================================================
// /api/admissions/leads/communicate — bulk queue WhatsApp/Email/SMS to
// selected leads. Creates QUEUED CommunicationLog rows (integration with
// a real gateway is future work) + audit trail.
// =====================================================================

const communicateSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(200),
  channel: z.enum(COMMUNICATION_CHANNELS),
  subject: z.string().max(200).optional().nullable(),
  content: z.string().min(2).max(4000),
});

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => communicateSchema.parse(j));

    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    // Scope: without leads.read.all only leads the user owns may be messaged.
    const scoped = hasPermission(user, PERMISSIONS.LEADS_READ_ALL)
      ? { schoolId: school.id, id: { in: body.leadIds } }
      : {
          schoolId: school.id,
          id: { in: body.leadIds },
          OR: [{ assignedTo: user.id }, { createdById: user.id }],
        };
    const leads = await db.admissionLead.findMany({ where: scoped, select: { id: true } });
    if (leads.length === 0) return fail('No matching leads to communicate with', 422);

    const result = await db.communicationLog.createMany({
      data: leads.map((l) => ({
        schoolId: school.id,
        channel: body.channel,
        direction: 'OUTBOUND',
        subject: body.subject ?? null,
        content: body.content,
        relatedLeadId: l.id,
        sentBy: user.id,
        status: 'QUEUED',
      })),
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'COMMUNICATION_QUEUED',
      entityType: 'lead',
      entityId: null,
      after: { channel: body.channel, queued: result.count, leadIds: leads.slice(0, 20).map((l) => l.id) },
    });

    return ok({ queued: result.count });
  },
  { permission: PERMISSIONS.LEADS_WRITE, rateLimit: { key: 'lead-communicate', limit: 30, windowMs: 60_000 } },
);
