import { z } from 'zod';
import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';

// =====================================================================
// /api/admissions/applications/[id]/decision — record OFFER / REJECT /
// WAITLIST decisions: creates an AdmissionDecision row and updates the
// application status.
// =====================================================================

const decisionSchema = z.object({
  decision: z.enum(['OFFER', 'REJECT', 'WAITLIST']),
  remarks: z.string().max(1000).optional().nullable(),
});

const STATUS_FOR: Record<string, string> = {
  OFFER: 'OFFER_MADE',
  REJECT: 'REJECTED',
  WAITLIST: 'WAITLISTED',
};

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('applications');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => decisionSchema.parse(j));

    const id = idFromUrl(req);
    if (!id) throw new ApiError('Application id missing', 400);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured yet', 503);
    const app = await db.admissionApplication.findUnique({ where: { id } });
    if (!app || app.schoolId !== school.id) throw new ApiError('Application not found', 404);
    if (app.status === 'ACCEPTED' || app.status === 'WITHDRAWN') {
      throw new ApiError(`Application is already ${APPLICATION_STATUS_LABELS[app.status] ?? app.status}`, 422);
    }

    const nextStatus = STATUS_FOR[body.decision];

    const decision = await db.$transaction(async (tx) => {
      const row = await tx.admissionDecision.create({
        data: {
          applicationId: app.id,
          decision: body.decision,
          remarks: body.remarks ?? null,
          decidedBy: user.id,
        },
      });
      await tx.admissionApplication.update({
        where: { id: app.id },
        data: { status: nextStatus },
      });
      return row;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'ADMISSION_DECISION',
      entityType: 'application',
      entityId: app.id,
      before: { status: app.status },
      after: { decision: body.decision, status: nextStatus, remarks: body.remarks ?? null, decisionId: decision.id },
    });

    return ok({ id: decision.id, decision: decision.decision, status: nextStatus }, { status: 201 });
  },
  { permission: PERMISSIONS.APPLICATIONS_MANAGE },
);
