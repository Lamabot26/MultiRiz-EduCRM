'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

type ClassOpt = { id: string; name: string; sections: { id: string; name: string }[] };

export function AssignStructureDialog({ structureId, structureName, classes }: { structureId: string; structureName: string; classes: ClassOpt[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const sections = classes.find((c) => c.id === classId)?.sections ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ assigned: number; eligible: number }>(`/api/fees/structures/${structureId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ classId, ...(sectionId ? { sectionId } : {}) }),
      });
      toast({ title: `Assigned to ${res.data?.assigned ?? 0} of ${res.data?.eligible ?? 0} students` });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Assignment failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign students</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign fee structure</DialogTitle>
          <DialogDescription>{structureName} — assign to all active students of a class.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); }} required>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {sections.length > 0 && (
            <div className="space-y-2">
              <Label>Section (optional)</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !classId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
