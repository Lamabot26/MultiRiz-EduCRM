'use client';

// =====================================================================
// Classes page islands: create class dialog + per-class add-section
// dialog. Teachers are fetched once from GET /api/users?role=TEACHER
// when the section dialog opens.
// =====================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';

/** Empty string → null (tiny local helper). */
const orNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

type TeacherOption = { id: string; name: string };

function useTeachers(open: boolean) {
  // null = not fetched yet → derived "loading" without sync setState in effects
  const [state, setState] = useState<{ teachers: TeacherOption[] } | null>(null);
  useEffect(() => {
    if (!open || state) return;
    let cancelled = false;
    apiFetch<TeacherOption[]>('/api/users?role=TEACHER')
      .then((env) => { if (!cancelled) setState({ teachers: env.data ?? [] }); })
      .catch(() => { if (!cancelled) setState({ teachers: [] }); });
    return () => { cancelled = true; };
  }, [open, state]);
  return { teachers: state?.teachers ?? [], loading: open && state === null };
}

// ---------------- Create class ----------------
export function CreateClassButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const submit = async () => {
    const lvl = parseInt(level, 10);
    if (!name.trim() || Number.isNaN(lvl)) {
      toast({ title: 'Name and a numeric level are required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), level: lvl, description: orNull(description) }),
      });
      toast({ title: 'Class created', description: `${name.trim()} added.` });
      setOpen(false);
      setName(''); setLevel(''); setDescription('');
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not create class', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden /> Create Class
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create class</DialogTitle>
            <DialogDescription>Level controls ordering (e.g. Nursery 0, Class 1 → 1).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cls-name">Class name *</Label>
              <Input id="cls-name" placeholder="e.g. Class 6" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls-level">Level (ordering) *</Label>
              <Input id="cls-level" type="number" min={0} max={20} value={level} onChange={(e) => setLevel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls-desc">Description</Label>
              <Textarea id="cls-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !name.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Create class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------- Add section per class ----------------
export function AddSectionButton({ classId, className }: { classId: string; className: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const { teachers, loading } = useTeachers(open);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: 'Section name is required', variant: 'destructive' });
      return;
    }
    const cap = capacity.trim() ? parseInt(capacity, 10) : null;
    if (cap !== null && Number.isNaN(cap)) {
      toast({ title: 'Capacity must be a number', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/classes/${classId}/sections`, {
        method: 'POST',
        body: JSON.stringify({ classId, name: name.trim(), capacity: cap, classTeacherId: classTeacherId || null }),
      });
      toast({ title: 'Section added', description: `${className} – ${name.trim()} created.` });
      setOpen(false);
      setName(''); setCapacity(''); setClassTeacherId('');
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not add section', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" aria-hidden /> Section
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add section to {className}</DialogTitle>
            <DialogDescription>Optionally assign a class teacher (must hold a teacher role).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sec-name">Section name *</Label>
                <Input id="sec-name" placeholder="e.g. A" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sec-cap">Capacity</Label>
                <Input id="sec-cap" type="number" min={1} max={200} placeholder="40" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Class teacher</Label>
              <Select value={classTeacherId} onValueChange={setClassTeacherId}>
                <SelectTrigger aria-label="Class teacher">
                  <SelectValue placeholder={loading ? 'Loading teachers…' : 'Unassigned'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !name.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Add section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
