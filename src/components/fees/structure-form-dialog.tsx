'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';
import { FEE_COMPONENT_LABELS, FEE_FREQUENCIES, FEE_FREQUENCY_LABELS } from '@/lib/constants';

type ClassOpt = { id: string; name: string };
type SessionOpt = { id: string; name: string };
type ComponentOpt = { id: string; code: string; name: string };
type ItemDraft = { feeComponentId: string; amount: string; frequency: string; dueDay: string; installmentCount: string };

export function StructureFormDialog({
  classes, sessions, components, onCreated,
}: {
  classes: ClassOpt[]; sessions: SessionOpt[]; components: ComponentOpt[];
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([
    { feeComponentId: '', amount: '', frequency: 'MONTHLY', dueDay: '10', installmentCount: '1' },
  ]);

  const total = items.reduce((s, it) => {
    const amt = parseFloat(it.amount) || 0;
    const inst = parseInt(it.installmentCount || '1', 10) || 1;
    return s + (inst > 0 ? amt / inst : amt);
  }, 0);

  function setItem(i: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/fees/structures', {
        method: 'POST',
        body: JSON.stringify({
          name, academicSessionId: sessionId, classId,
          items: items.map((it) => ({
            feeComponentId: it.feeComponentId,
            amount: Math.round((parseFloat(it.amount) || 0) * 100),
            frequency: it.frequency,
            dueDay: it.dueDay ? parseInt(it.dueDay, 10) : null,
            installmentCount: parseInt(it.installmentCount || '1', 10) || 1,
          })),
        }),
      });
      toast({ title: 'Fee structure created' });
      setOpen(false);
      setName(''); setItems([{ feeComponentId: '', amount: '', frequency: 'MONTHLY', dueDay: '10', installmentCount: '1' }]);
      onCreated?.();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Failed to create structure', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> New Fee Structure</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create fee structure</DialogTitle>
          <DialogDescription>Define fee components, amounts and frequency for a class & session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard 2025-26" required />
            </div>
            <div className="space-y-2">
              <Label>Academic session</Label>
              <Select value={sessionId} onValueChange={setSessionId} required>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId} required>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fee components</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { feeComponentId: '', amount: '', frequency: 'MONTHLY', dueDay: '', installmentCount: '1' }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add component
              </Button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_0.7fr_auto] gap-2 items-end rounded-lg border p-2">
                <div className="space-y-1">
                  <Label className="text-xs">Component</Label>
                  <Select value={it.feeComponentId} onValueChange={(v) => setItem(i, { feeComponentId: v })} required>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {components.map((c) => <SelectItem key={c.id} value={c.id}>{FEE_COMPONENT_LABELS[c.code] ?? c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input type="number" min="1" step="0.01" className="h-9" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frequency</Label>
                  <Select value={it.frequency} onValueChange={(v) => setItem(i, { frequency: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{FEE_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{FEE_FREQUENCY_LABELS[f]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Due day</Label>
                  <Input type="number" min="1" max="28" className="h-9" value={it.dueDay} onChange={(e) => setItem(i, { dueDay: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Installments</Label>
                  <Input type="number" min="1" max="12" className="h-9" value={it.installmentCount} onChange={(e) => setItem(i, { installmentCount: e.target.value })} />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} disabled={items.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">Per-period total: <span className="font-semibold text-foreground">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create structure
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
