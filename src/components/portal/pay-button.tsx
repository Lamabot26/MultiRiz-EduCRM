'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

type OrderResponse = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  checkoutUrl: string | null;
  demo: boolean;
  invoiceNumber: string;
};

// Pay Online — provider-agnostic flow. When no real gateway is configured
// (demo mode), the parent can simulate a successful capture, which goes
// through the exact same server-side transactional path as the real
// verified webhook (immutable payment + allocation + receipt + audit).
export function PayButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  async function startPayment() {
    setBusy(true);
    try {
      const res = await apiFetch<OrderResponse>('/api/payments/create-order', {
        method: 'POST', body: JSON.stringify({ invoiceId }),
      });
      const data = res.data as OrderResponse;
      if (data.demo) {
        setOrder(data);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: `Gateway order created (${data.orderId}). Completing checkout requires the school's payment gateway configuration.` });
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Could not start payment', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function simulateSuccess() {
    if (!order) return;
    setSimulating(true);
    try {
      await apiFetch('/api/payments/webhook/simulate', {
        method: 'POST', body: JSON.stringify({ orderId: order.orderId }),
      });
      toast({ title: 'Payment successful — receipt generated' });
      setOrder(null);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Simulation failed', variant: 'destructive' });
    } finally {
      setSimulating(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={startPayment} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CreditCard className="h-3.5 w-3.5 mr-1.5" />}
        Pay Online
      </Button>
      <Dialog open={Boolean(order)} onOpenChange={(o) => !o && setOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Secure online payment</DialogTitle>
            <DialogDescription>
              Invoice {order?.invoiceNumber}. The school&apos;s payment gateway is not configured yet
              (Kuberns environment variables <code>PAYMENT_GATEWAY_*</code>). In demo mode you can simulate a
              successful gateway capture to see the full receipt flow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOrder(null)}>Cancel</Button>
            <Button onClick={simulateSuccess} disabled={simulating}>
              {simulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Simulate successful payment (demo)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
