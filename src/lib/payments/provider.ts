import crypto from 'crypto';

// =====================================================================
// Provider-agnostic payment gateway abstraction (spec section N).
// v1 ships a Razorpay-style PLACEHOLDER adapter: credentials come from
// env vars only; no card/UPI/CVV data ever touches our database.
// Only the verified webhook may finalise payment status.
// =====================================================================

export type CreateOrderInput = {
  amountPaise: number;
  receipt: string; // internal reference (invoice number)
  notes?: Record<string, string>;
};

export type CreateOrderResult = {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string; // publishable key for checkout
  checkoutUrl?: string; // placeholder providers may host a test page
};

export type WebhookVerification = { valid: boolean; reason?: string };

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPaymentSignature(params: { orderId: string; paymentId: string; signature: string }): boolean;
  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification;
  getPaymentStatus(orderId: string): Promise<'created' | 'paid' | 'failed' | 'unknown'>;
  refundPayment(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<{ refundId: string }>;
}

/**
 * Razorpay-style placeholder adapter.
 * - createOrder: returns a deterministic local order id when credentials
 *   are absent (DEV mode) so flows can be demoed safely.
 * - verification uses HMAC-SHA256 exactly as Razorpay does, so swapping
 *   in the real SDK later needs no workflow changes.
 */
export class RazorpayPlaceholderProvider implements PaymentProvider {
  readonly name = 'razorpay-placeholder';

  private keyId = process.env.PAYMENT_GATEWAY_KEY_ID ?? '';
  private keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET ?? '';
  private webhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET ?? '';

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!this.isConfigured()) {
      // Local placeholder order — clearly namespaced, unusable externally.
      const orderId = `order_local_${crypto.randomBytes(8).toString('hex')}`;
      return { orderId, amountPaise: input.amountPaise, currency: 'INR', keyId: 'local_placeholder', checkoutUrl: undefined };
    }
    // Real integration point: call gateway REST API with keyId/keySecret here.
    const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return { orderId, amountPaise: input.amountPaise, currency: 'INR', keyId: this.keyId };
  }

  verifyPaymentSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    if (!this.keySecret || !signature) return false;
    const expected = crypto.createHmac('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification {
    if (!this.webhookSecret) return { valid: false, reason: 'webhook secret not configured' };
    if (!signature) return { valid: false, reason: 'missing signature header' };
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    try {
      const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
      return { valid, reason: valid ? undefined : 'signature mismatch' };
    } catch {
      return { valid: false, reason: 'signature compare failed' };
    }
  }

  async getPaymentStatus(_orderId: string): Promise<'created' | 'paid' | 'failed' | 'unknown'> {
    // Real integration: GET /orders/:id/payments on the gateway.
    return 'unknown';
  }

  async refundPayment(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<{ refundId: string }> {
    void notes;
    void paymentId;
    void amountPaise;
    // Real integration: POST /payments/:id/refund
    return { refundId: `rfnd_local_${crypto.randomBytes(6).toString('hex')}` };
  }
}

let provider: PaymentProvider | undefined;
export function getPaymentProvider(): PaymentProvider {
  provider ??= new RazorpayPlaceholderProvider();
  return provider;
}
