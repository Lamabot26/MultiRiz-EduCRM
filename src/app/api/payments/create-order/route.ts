import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { createOrderSchema } from '@/lib/validation';
import { getPaymentProvider } from '@/lib/payments/provider';
import { canAccessStudentFees } from '@/lib/access';

// POST /api/payments/create-order — start an online payment for an invoice.
// Validates ownership + payable balance server-side; nothing is charged yet.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const body = await parseBody(req, createOrderSchema);

    const invoice = await db.invoice.findFirst({
      where: { id: body.invoiceId, schoolId: school.id },
      include: { student: true },
    });
    if (!invoice) throw new ApiError('Invoice not found', 404);
    if (!(await canAccessStudentFees(user, invoice.studentId))) {
      return fail('You do not have permission to pay this invoice', 403);
    }
    if (invoice.status === 'CANCELLED') throw new ApiError('Invoice is cancelled', 400);
    if (invoice.balance <= 0) throw new ApiError('Invoice has no outstanding balance', 400);

    const provider = getPaymentProvider();
    const order = await provider.createOrder({
      amountPaise: invoice.balance,
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice.id, studentId: invoice.studentId, admissionNumber: invoice.student.admissionNumber },
    });

    // Persist order→invoice mapping so the verified webhook can locate it.
    await db.paymentGatewayEvent.create({
      data: {
        provider: provider.name,
        eventId: `${provider.name}:order:${order.orderId}`,
        eventType: 'ORDER_CREATED',
        orderId: order.orderId,
        payload: JSON.stringify({ invoiceId: invoice.id, studentId: invoice.studentId, amountPaise: order.amountPaise }),
        signatureValid: true,
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'PAYMENT_ORDER_CREATED',
      entityType: 'invoice',
      entityId: invoice.id,
      after: { orderId: order.orderId, amountPaise: order.amountPaise, provider: provider.name },
    });
    return ok({
      orderId: order.orderId,
      amountPaise: order.amountPaise,
      currency: order.currency,
      keyId: order.keyId,
      checkoutUrl: order.checkoutUrl ?? null,
      demo: !provider.isConfigured(),
      invoiceNumber: invoice.invoiceNumber,
    });
  },
  { permission: PERMISSIONS.FEES_ONLINE_PAY, rateLimit: { key: 'create-order', limit: 10, windowMs: 5 * 60 * 1000 } },
);
