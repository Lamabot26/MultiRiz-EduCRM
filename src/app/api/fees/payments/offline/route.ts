import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { offlinePaymentSchema } from '@/lib/validation';
import { recordOfflinePayment, allocatePayment } from '@/lib/fees';

// POST /api/fees/payments/offline — record cash/cheque/transfer/UPI payment.
// Transactional: payment + receipt; then allocation across outstanding invoices.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);

    const body = await parseBody(req, offlinePaymentSchema);
    const student = await db.student.findFirst({
      where: { id: body.studentId, schoolId: school.id, deletedAt: null },
    });
    if (!student) throw new ApiError('Student not found', 404);

    if (body.invoiceId) {
      const invoice = await db.invoice.findFirst({ where: { id: body.invoiceId, schoolId: school.id } });
      if (!invoice) throw new ApiError('Invoice not found', 404);
      if (['CANCELLED', 'PAID'].includes(invoice.status)) {
        throw new ApiError('Invoice is not payable (cancelled or already paid)', 400);
      }
    }

    const { payment, receipt } = await recordOfflinePayment({
      schoolId: school.id,
      studentId: body.studentId,
      invoiceId: body.invoiceId ?? null,
      amount: body.amount,
      mode: body.mode,
      referenceNumber: body.referenceNumber ?? null,
      chequeNumber: body.chequeNumber ?? null,
      chequeDate: body.chequeDate ? new Date(body.chequeDate) : null,
      bankName: body.bankName ?? null,
      notes: body.notes ?? null,
      receivedBy: user.id,
    });

    // allocate across outstanding invoices (oldest first)
    const allocation = await allocatePayment(payment.id, user.id).catch(() => ({ allocated: 0, remaining: 0 }));

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'PAYMENT_OFFLINE',
      entityType: 'payment',
      entityId: payment.id,
      after: {
        receiptNumber: receipt.receiptNumber,
        amountPaise: payment.amount,
        mode: payment.mode,
        studentId: payment.studentId,
        allocatedPaise: allocation.allocated,
      },
    });
    return ok({ paymentId: payment.id, receiptNumber: receipt.receiptNumber, allocated: allocation.allocated });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_OFFLINE },
);
