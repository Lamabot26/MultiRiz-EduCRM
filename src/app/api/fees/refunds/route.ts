import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { refundSchema } from '@/lib/validation';

// GET /api/fees/refunds?status= — list refunds.
export const GET = withApi(
  async (req) => {
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const status = new URL(req.url).searchParams.get('status');
    const refunds = await db.refund.findMany({
      where: { schoolId: school.id, ...(status ? { status } : {}) },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        payment: { select: { amount: true, mode: true, referenceNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok({ items: refunds });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);

// POST /api/fees/refunds — request refund against a confirmed payment.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const body = await parseBody(req, refundSchema);

    const payment = await db.payment.findFirst({
      where: { id: body.paymentId, schoolId: school.id },
      include: { refunds: { where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSED'] } } } },
    });
    if (!payment) throw new ApiError('Payment not found', 404);
    if (payment.status !== 'CONFIRMED') throw new ApiError('Only confirmed payments can be refunded', 400);
    const alreadyRefundable = payment.amount - payment.refunds.reduce((s, r) => s + r.amount, 0);
    if (body.amount > alreadyRefundable) {
      throw new ApiError(`Refund exceeds refundable balance (${alreadyRefundable / 100} INR)`, 400);
    }

    const refund = await db.refund.create({
      data: {
        schoolId: school.id, paymentId: payment.id, studentId: payment.studentId,
        amount: body.amount, reason: body.reason, status: 'PENDING', requestedBy: user.id,
      },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'REFUND_CREATE',
      entityType: 'refund',
      entityId: refund.id,
      after: { paymentId: payment.id, amountPaise: refund.amount, reason: refund.reason },
    });
    return ok({ refund });
  },
  { permission: PERMISSIONS.FEES_REFUND_REQUEST },
);
