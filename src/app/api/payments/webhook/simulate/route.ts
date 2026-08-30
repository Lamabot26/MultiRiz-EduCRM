import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { getPaymentProvider } from '@/lib/payments/provider';
import { allocatePayment } from '@/lib/fees';
import { nextNumberTx } from '@/lib/sequences';
import { PERMISSIONS } from '@/lib/rbac';

// POST /api/payments/webhook/simulate — DEV/DEMO ONLY.
// Allowed ONLY while the real gateway is unconfigured so the online flow
// can be demonstrated end-to-end. Uses the exact same transactional path
// as the real webhook (immutable payment + allocation + receipt + audit).
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const provider = getPaymentProvider();
    if (provider.isConfigured()) {
      return fail('Simulation is disabled: a real payment gateway is configured', 403);
    }
    const body = (await req.json()) as { orderId?: string };
    if (!body.orderId?.startsWith('order_local_')) throw new ApiError('Invalid demo order', 422);

    const orderEvent = await db.paymentGatewayEvent.findFirst({
      where: { orderId: body.orderId, eventType: 'ORDER_CREATED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!orderEvent?.payload) throw new ApiError('Order not found', 404);
    const { invoiceId } = JSON.parse(orderEvent.payload) as { invoiceId: string };

    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new ApiError('Invoice not found', 404);
      if (invoice.status === 'CANCELLED') throw new ApiError('Invoice cancelled', 400);
      if (invoice.balance <= 0) throw new ApiError('Invoice already settled', 400);

      const gatewayPaymentId = `pay_demo_${Date.now().toString(36)}`;
      const eventId = `${provider.name}:${gatewayPaymentId}`;
      const existing = await tx.paymentGatewayEvent.findUnique({ where: { eventId } });
      if (existing) throw new ApiError('Duplicate simulation ignored', 409);

      const school = await tx.school.findUnique({ where: { id: invoice.schoolId } });
      if (!school) throw new ApiError('School missing', 500);
      const session = await tx.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });

      const payment = await tx.payment.create({
        data: {
          schoolId: school.id, invoiceId: invoice.id, studentId: invoice.studentId,
          amount: invoice.balance, mode: 'ONLINE', status: 'CONFIRMED',
          gatewayOrderId: body.orderId, gatewayPaymentId,
          paidAt: new Date(), verifiedBy: 'demo-simulation', verifiedAt: new Date(),
          notes: 'Simulated gateway payment (demo mode — no real gateway configured)',
        },
      });
      const receiptNumber = await nextNumberTx(tx, school.id, 'RECEIPT', session?.name ?? 'SESSION', 'RCP');
      await tx.receipt.create({
        data: {
          schoolId: school.id, receiptNumber, paymentId: payment.id,
          studentId: payment.studentId, invoiceId: payment.invoiceId,
          amount: payment.amount, issuedBy: user.name,
        },
      });
      await tx.paymentGatewayEvent.create({
        data: {
          provider: provider.name, eventId, eventType: 'payment.captured (simulated)',
          orderId: body.orderId ?? null, gatewayPaymentId,
          payload: JSON.stringify({ simulated: true, invoiceId }),
          signatureValid: true, status: 'PROCESSED', processedAt: new Date(),
        },
      });
      return { paymentId: payment.id, receiptNumber };
    });

    const allocation = await allocatePayment(result.paymentId, user.id).catch(() => ({ allocated: 0 }));
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'PAYMENT_SIMULATE',
      entityType: 'payment',
      entityId: result.paymentId,
      after: { orderId: body.orderId, receiptNumber: result.receiptNumber, allocatedPaise: allocation.allocated },
    });
    return ok({ ...result, allocated: allocation.allocated });
  },
  { permission: PERMISSIONS.FEES_ONLINE_PAY },
);
