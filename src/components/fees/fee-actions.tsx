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
import { Loader2, Banknote, Percent, Copy, Check } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';
import { PAYMENT_MODE_LABELS, CONCESSION_TYPE_LABELS, CONCESSION_TYPES } from '@/lib/constants';

type StudentOpt = { id: string; name: string; admissionNumber: string };
type InvoiceOpt = { id: string; invoiceNumber: string; balance: number };

export function RecordPaymentDialog({ studentId, invoiceId, balancePaise }: { studentId?: string; invoiceId?: string; balancePaise?: number }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [studentSel, setStudentSel] = useState('');
  const [invoices, setInvoices] = useState<InvoiceOpt[]>([]);
  const [invoiceSel, setInvoiceSel] = useState<string>(invoiceId ?? 'advance');
  const [amount, setAmount] = useState(invoiceId && balancePaise ? String(balancePaise / 100) : '');
  const [mode, setMode] = useState('CASH');
  const [reference, setReference] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');

  async function searchStudents(q: string) {
    setStudentSearch(q);
    if (q.length < 2) { setStudents([]); return; }
    try {
      const res = await apiFetch<{ students?: { id: string; firstName: string; lastName: string | null; admissionNumber: string }[]; items?: { id: string; firstName: string; lastName: string | null; admissionNumber: string }[] }>(`/api/students?q=${encodeURIComponent(q)}&pageSize=10`);
      const raw = res.data?.students ?? res.data?.items ?? [];
      setStudents(raw.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName ?? ''}`, admissionNumber: s.admissionNumber })));
    } catch { /* ignore */ }
  }

  async function loadInvoices(sid: string) {
    setStudentSel(sid);
    setInvoiceSel('advance');
    setInvoices([]);
    try {
      const res = await apiFetch<{ items: { id: string; invoiceNumber: string; balance: number; status: string }[] }>(`/api/fees/invoices?student=${sid}&open=1&pageSize=50`).catch(() => null);
      const items = res?.data?.items?.filter((i) => !['PAID', 'CANCELLED'].includes(i.status)) ?? [];
      setInvoices(items.map((i) => ({ id: i.id, invoiceNumber: i.invoiceNumber, balance: i.balance })));
    } catch { /* ignore */ }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ receiptNumber: string; allocated: number }>('/api/fees/payments/offline', {
        method: 'POST',
        body: JSON.stringify({
          studentId: invoiceId ? studentId : studentSel,
          invoiceId: invoiceSel === 'advance' ? null : invoiceSel,
          amount: Math.round((parseFloat(amount) || 0) * 100),
          mode,
          referenceNumber: reference || null,
          chequeNumber: mode === 'CHEQUE' ? chequeNumber || null : null,
          chequeDate: mode === 'CHEQUE' && chequeDate ? chequeDate : null,
          bankName: mode === 'CHEQUE' || mode === 'BANK_TRANSFER' ? bankName || null : null,
          notes: notes || null,
        }),
      });
      toast({ title: `Payment recorded — receipt ${res.data?.receiptNumber ?? ''}` });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Payment failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Banknote className="h-4 w-4 mr-2" /> Record Payment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record offline payment</DialogTitle>
          <DialogDescription>Cash, cheque, bank transfer or UPI received at the counter. A receipt is generated immediately.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!invoiceId && (
            <div className="space-y-2">
              <Label>Student</Label>
              <Input placeholder="Search name or admission number…" value={studentSearch} onChange={(e) => searchStudents(e.target.value)} required={invoiceSel !== 'advance' || !studentSel} />
              {students.length > 0 && (
                <Select value={studentSel} onValueChange={loadInvoices}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {!invoiceId && (
            <div className="space-y-2">
              <Label>Apply to invoice</Label>
              <Select value={invoiceSel} onValueChange={setInvoiceSel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance payment (no specific invoice)</SelectItem>
                  {invoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.invoiceNumber} — balance ₹{(i.balance / 100).toLocaleString('en-IN')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount received (₹)</Label>
              <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_MODE_LABELS).filter(([k]) => k !== 'ONLINE' && k !== 'ADJUSTMENT').map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Reference (UTR / txn no.)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </div>
            {mode === 'CHEQUE' && (
              <>
                <div className="space-y-2"><Label>Cheque number</Label><Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} /></div>
                <div className="space-y-2"><Label>Cheque date</Label><Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} /></div>
              </>
            )}
            {(mode === 'CHEQUE' || mode === 'BANK_TRANSFER') && (
              <div className="space-y-2 sm:col-span-2"><Label>Bank name</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
            )}
            <div className="space-y-2 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Record & generate receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConcessionRequestDialog({ studentId, invoiceId }: { studentId: string; invoiceId?: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('SIBLING');
  const [percent, setPercent] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/fees/concessions', {
        method: 'POST',
        body: JSON.stringify({
          studentId, invoiceId: invoiceId ?? null, type,
          ...(percent ? { percent: parseFloat(percent) } : {}),
          ...(amount ? { amount: Math.round(parseFloat(amount) * 100) } : {}),
          reason,
        }),
      });
      toast({ title: 'Concession request submitted for approval' });
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
        <Button variant="outline"><Percent className="h-4 w-4 mr-2" /> Request Concession</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request fee concession</DialogTitle>
          <DialogDescription>Scholarships and waivers require Principal / Super Admin approval before they are applied.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONCESSION_TYPES.map((t) => <SelectItem key={t} value={t}>{CONCESSION_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Percent (%)</Label><Input type="number" min="0" max="100" step="0.1" value={percent} onChange={(e) => { setPercent(e.target.value); setAmount(''); }} /></div>
            <div className="space-y-2"><Label>OR flat amount (₹)</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); setPercent(''); }} /></div>
          </div>
          <div className="space-y-2"><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Submit request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConcessionDecisionButtons({ concessionId }: { concessionId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  async function decide(status: 'APPROVED' | 'REJECTED') {
    setBusy(true);
    try {
      await apiFetch(`/api/fees/concessions/${concessionId}/decision`, {
        method: 'POST', body: JSON.stringify({ status, remarks: remarks || null }),
      });
      toast({ title: `Concession ${status.toLowerCase()}` });
      setOpenId(null);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Decision failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={openId === concessionId} onOpenChange={(o) => setOpenId(o ? concessionId : null)}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Review</Button></DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Concession decision</DialogTitle><DialogDescription>Your decision is audited and final for this request.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <Textarea placeholder="Remarks (optional)" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="destructive" size="sm" onClick={() => decide('REJECTED')} disabled={busy}>Reject</Button>
            <Button size="sm" onClick={() => decide('APPROVED')} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DuplicateReceiptButton({ paymentId, receiptNumber }: { paymentId: string; receiptNumber?: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function issue() {
    setBusy(true);
    try {
      const res = await fetch(`/api/fees/payments/${paymentId}/receipt?duplicate=1`);
      if (!res.ok) throw new Error('Duplicate receipt failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast({ title: 'Duplicate receipt issued (marked DUPLICATE & audited)' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={issue} disabled={busy} title={`Original: ${receiptNumber ?? ''}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Duplicate
    </Button>
  );
}
