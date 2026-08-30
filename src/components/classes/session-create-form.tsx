'use client';

// =====================================================================
// Academic session create form (settings.manage). Making a session
// current requires explicit confirmation because it demotes the
// previously current session.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';

export function SessionCreateForm() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/sessions/create', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), startDate, endDate, isCurrent }),
      });
      toast({ title: 'Session created', description: `${name.trim()}${isCurrent ? ' is now the current session.' : ''}` });
      setConfirmOpen(false);
      setName(''); setStartDate(''); setEndDate(''); setIsCurrent(false);
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not create session', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const trySubmit = () => {
    if (!name.trim() || !startDate || !endDate) {
      toast({ title: 'Name, start date and end date are required', variant: 'destructive' });
      return;
    }
    if (isCurrent) setConfirmOpen(true);
    else submit();
  };

  return (
    <>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="sess-name">Session name</Label>
            <Input id="sess-name" placeholder="2026-27" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sess-start">Start date</Label>
            <Input id="sess-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sess-end">End date</Label>
            <Input id="sess-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isCurrent} onCheckedChange={setIsCurrent} aria-label="Set as current session" />
            Set as current session
          </label>
          <Button size="sm" onClick={trySubmit} disabled={busy || !name.trim() || !startDate || !endDate}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Create session
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set {name} as the current session?</DialogTitle>
            <DialogDescription>
              The previously current session will be demoted. Class assignments and fee
              structures default to the current session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Yes, make current
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
