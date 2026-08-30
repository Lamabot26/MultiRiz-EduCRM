'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Undo2 } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

type PaymentOpt = { id: string; label: string; amount: number };

export function RefundRequestDialog({ payments }: { payments: PaymentOpt[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const selected = payments.find((p) => p.id === paymentId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/fees/refunds', {
        method: 'POST',
        body: JSON.stringify({ paymentId, amount: Math.round((parseFloat(amount) || 0) * 100), reason }),
      });
      toast({ title: 'Refund request submitted for approval' });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Undo2 className="h-4 w-4 mr-2" /> Request Refund</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request fee refund</DialogTitle>
          <DialogDescription>Refunds require approval, then processing. The source payment is marked REFUNDED after processing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payment</Label>
            <Select value={paymentId} onValueChange={(v) => { setPaymentId(v); const p = payments.find((x) => x.id === v); if (p) setAmount(String(p.amount / 100)); }} required>
              <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {payments.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Refund amount (₹) {selected ? `— max ₹${(selected.amount / 100).toLocaleString('en-IN')}` : ''}</Label>
            <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2"><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RefundDecisionButtons({ refundId, current }: { refundId: string; current: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');

  async function decide(status: 'APPROVED' | 'REJECTED' | 'PROCESSED') {
    setBusy(true);
    try {
      await apiFetch(`/api/fees/refunds/${refundId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ status, ...(status === 'PROCESSED' ? { referenceNumber: reference || null } : {}) }),
      });
      toast({ title: `Refund ${status.toLowerCase()}` });
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Decision failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {current === 'PENDING' && (
        <>
          <Button size="sm" onClick={() => decide('APPROVED')} disabled={busy}>Approve</Button>
          <Button size="sm" variant="destructive" onClick={() => decide('REJECTED')} disabled={busy}>Reject</Button>
        </>
      )}
      {current === 'APPROVED' && (
        <div className="flex items-center gap-1">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ref no." className="h-8 w-24 text-xs" />
          <Button size="sm" variant="outline" onClick={() => decide('PROCESSED')} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Processed'}
          </Button>
        </div>
      )}
    </div>
  );
}
