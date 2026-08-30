import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { refundDecisionSchema } from '@/lib/validation';

// POST /api/fees/refunds/[id]/decision — approve / reject / mark processed.
// PROCESSED flips the payment to REFUNDED (immutable-status transition).
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const id = parts[parts.indexOf('refunds') + 1] ?? '';
    const body = await parseBody(req, refundDecisionSchema);

    const result = await db.$transaction(async (tx) => {
      const refund = await tx.refund.findFirst({ where: { id, schoolId: school.id }, include: { payment: true } });
      if (!refund) throw new ApiError('Refund not found', 404);

      if (body.status === 'APPROVED') {
        if (refund.status !== 'PENDING') throw new ApiError('Refund already decided', 400);
        return tx.refund.update({
          where: { id },
          data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), remarks: body.remarks ?? null },
        });
      }
      if (body.status === 'REJECTED') {
        if (!['PENDING', 'APPROVED'].includes(refund.status)) throw new ApiError('Refund already decided', 400);
        return tx.refund.update({
          where: { id },
          data: { status: 'REJECTED', approvedBy: user.id, approvedAt: new Date(), remarks: body.remarks ?? null },
        });
      }
      // PROCESSED
      if (refund.status !== 'APPROVED') throw new ApiError('Refund must be approved before processing', 400);
      const updated = await tx.refund.update({
        where: { id },
        data: {
          status: 'PROCESSED', processedAt: new Date(),
          referenceNumber: body.referenceNumber ?? refund.referenceNumber,
          remarks: body.remarks ?? refund.remarks,
        },
      });
      await tx.payment.update({ where: { id: refund.paymentId }, data: { status: 'REFUNDED' } });
      return updated;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'REFUND_DECISION',
      entityType: 'refund',
      entityId: id,
      after: { status: result.status, referenceNumber: result.referenceNumber },
    });
    return ok({ refund: result });
  },
  { permission: PERMISSIONS.FEES_REFUND_APPROVE },
);
