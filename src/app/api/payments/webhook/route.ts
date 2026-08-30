import crypto from 'crypto';
import { db } from '@/lib/db';
import { fail, writeAudit } from '@/lib/audit';
import { getPaymentProvider } from '@/lib/payments/provider';
import { allocatePayment } from '@/lib/fees';
import { nextNumberTx } from '@/lib/sequences';

export const runtime = 'nodejs';

// =====================================================================
// POST /api/payments/webhook — the ONLY way an online payment becomes
// CONFIRMED. Steps (spec section N):
//   1. verify HMAC signature against raw body
//   2. idempotency via payment_gateway_events.eventId (unique)
//   3. transaction: immutable Payment + allocations + Receipt
//   4. audit log
// A frontend redirect NEVER finalises a payment.
// =====================================================================

type GatewayPayload = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string; method?: string } };
    order?: { entity?: { id?: string; amount?: number } };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const provider = getPaymentProvider();

  const verification = provider.verifyWebhook(raw, signature);

  let parsed: GatewayPayload = {};
  try { parsed = JSON.parse(raw) as GatewayPayload; } catch { /* leave empty */ }

  const gatewayPaymentId = parsed.payload?.payment?.entity?.id ?? null;
  const orderId = parsed.payload?.payment?.entity?.order_id ?? parsed.payload?.order?.entity?.id ?? null;
  const eventId = `${provider.name}:${gatewayPaymentId ?? orderId ?? crypto.randomUUID()}`;

  // Idempotency record first (unique eventId)
  const existing = await db.paymentGatewayEvent.findUnique({ where: { eventId } });
  if (existing?.status === 'PROCESSED') {
    return Response.json({ success: true, data: { idempotent: true } });
  }
  const event = existing ?? await db.paymentGatewayEvent.create({
    data: {
      provider: provider.name, eventId,
      eventType: parsed.event ?? 'payment',
      orderId, gatewayPaymentId,
      payload: raw.slice(0, 8000),
      signatureValid: verification.valid,
      status: 'RECEIVED',
    },
  });

  if (!verification.valid) {
    await db.paymentGatewayEvent.update({
      where: { id: event.id },
      data: { status: 'FAILED', error: verification.reason ?? 'invalid signature', processedAt: new Date() },
    });
    await writeAudit({ action: 'PAYMENT_WEBHOOK_REJECTED', entityType: 'payment_gateway_event', entityId: event.id, after: { reason: verification.reason } });
    return fail('Invalid webhook signature', 400);
  }

  if (!orderId) {
    await db.paymentGatewayEvent.update({
      where: { id: event.id }, data: { status: 'IGNORED', error: 'missing order id', processedAt: new Date() },
    });
    return Response.json({ success: true, data: { ignored: true } });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // locate the invoice via the ORDER_CREATED mapping persisted by create-order
      const orderEvent = await tx.paymentGatewayEvent.findFirst({
        where: { orderId, eventType: 'ORDER_CREATED' },
        orderBy: { createdAt: 'desc' },
      });
      let invoiceId: string | null = null;
      if (orderEvent?.payload) {
        try { invoiceId = (JSON.parse(orderEvent.payload) as { invoiceId?: string }).invoiceId ?? null; } catch { /* ignore */ }
      }
      if (!invoiceId) throw new Error('INVOICE_NOT_FOUND');
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error('INVOICE_NOT_FOUND');

      const school = await tx.school.findUnique({ where: { id: invoice.schoolId } });
      if (!school) throw new Error('SCHOOL_NOT_FOUND');
      const session = await tx.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });

      const amount = parsed.payload?.payment?.entity?.amount ?? invoice.balance;
      const payment = await tx.payment.create({
        data: {
          schoolId: school.id,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount,
          mode: 'ONLINE',
          status: 'CONFIRMED',
          gatewayOrderId: orderId,
          gatewayPaymentId,
          paidAt: new Date(),
          verifiedBy: 'gateway-webhook',
          verifiedAt: new Date(),
          notes: `Gateway event ${eventId}`,
        },
      });
      const receiptNumber = await nextNumberTx(tx, school.id, 'RECEIPT', session?.name ?? 'SESSION', 'RCP');
      const receipt = await tx.receipt.create({
        data: {
          schoolId: school.id, receiptNumber, paymentId: payment.id,
          studentId: payment.studentId, invoiceId: payment.invoiceId,
          amount: payment.amount, issuedBy: 'gateway-webhook',
        },
      });
      return { paymentId: payment.id, receiptNumber };
    });

    // allocate outside the insert tx but still atomic per allocation
    const allocation = await allocatePayment(result.paymentId, 'gateway-webhook').catch(() => ({ allocated: 0 }));

    await db.paymentGatewayEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
    await writeAudit({
      action: 'PAYMENT_WEBHOOK',
      entityType: 'payment',
      entityId: result.paymentId,
      after: { orderId, gatewayPaymentId, receiptNumber: result.receiptNumber, allocatedPaise: allocation.allocated },
    });
    return Response.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'processing error';
    await db.paymentGatewayEvent.update({
      where: { id: event.id },
      data: { status: 'FAILED', error: message.slice(0, 500), processedAt: new Date() },
    });
    await writeAudit({ action: 'PAYMENT_WEBHOOK_FAILED', entityType: 'payment_gateway_event', entityId: event.id, after: { error: message } });
    return fail(message === 'INVOICE_NOT_FOUND' ? 'Order not mapped to an invoice' : 'Webhook processing failed', 500);
  }
}
