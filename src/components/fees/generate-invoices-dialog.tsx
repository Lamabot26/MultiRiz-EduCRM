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
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilePlus2 } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

type Structure = { id: string; name: string; classRoom: { name: string }; academicSession: { name: string } };
type ClassOpt = { id: string; name: string; sections: { id: string; name: string }[] };

export function GenerateInvoicesDialog({ structures, classes }: { structures: Structure[]; classes: ClassOpt[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [structureId, setStructureId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [periods, setPeriods] = useState('1');
  const [dueDay, setDueDay] = useState('10');

  const sections = classes.find((c) => c.id === classId)?.sections ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ created: number }>('/api/fees/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({
          feeStructureId: structureId, classId,
          ...(sectionId ? { sectionId } : {}),
          periods: parseInt(periods, 10) || 1,
          dueDay: dueDay ? parseInt(dueDay, 10) : null,
        }),
      });
      toast({ title: `${res.data?.created ?? 0} invoice(s) generated` });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Generation failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><FilePlus2 className="h-4 w-4 mr-2" /> Generate Invoices</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate fee invoices</DialogTitle>
          <DialogDescription>
            Bulk-generate invoices from an active fee structure. Existing invoices for the same student & period are skipped (idempotent).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fee structure</Label>
            <Select value={structureId} onValueChange={setStructureId} required>
              <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
              <SelectContent>
                {structures.filter((s) => s.academicSession).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.classRoom.name} ({s.academicSession.name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bill class</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); }} required>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section (optional)</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periods to bill</Label>
              <Input type="number" min="1" max="12" value={periods} onChange={(e) => setPeriods(e.target.value)} />
              <p className="text-xs text-muted-foreground">1 = one installment now; 12 = full year (monthly items).</p>
            </div>
            <div className="space-y-2">
              <Label>Due day of month</Label>
              <Input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
