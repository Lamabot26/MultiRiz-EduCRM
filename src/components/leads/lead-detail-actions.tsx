'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, CalendarPlus, CheckCircle2, XCircle, UserX, ArrowRightLeft,
  Pencil, Ban, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { LeadFormDialog, CLASS_OPTIONS, type LeadOptionSources, type LeadFormValues } from '@/components/leads/lead-form-dialog';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, PRIORITIES } from '@/lib/constants';
import { fmtDate } from '@/lib/date-utils';

// ---------------------------------------------------------------------
// Stage movement select
// ---------------------------------------------------------------------
export function StageSelect({ leadId, current, disabled }: { leadId: string; current: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setValue(next);
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      toast({ title: 'Stage updated', description: `Moved to “${LEAD_STATUS_LABELS[next] ?? next}”.` });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      setValue(current);
      toast({ title: 'Could not update stage', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => void change(v)} disabled={disabled || busy}>
        <SelectTrigger className="w-[240px]" aria-label="Move lead to stage">
          <SelectValue placeholder="Move to stage…" />
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Priority setter
// ---------------------------------------------------------------------
export function PrioritySelect({ leadId, current }: { leadId: string; current: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setValue(next);
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ priority: next }) });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      setValue(current);
      toast({ title: 'Could not update priority', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => void change(v)} disabled={busy}>
        <SelectTrigger className="w-[150px]" aria-label="Set priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Re-assign counsellor
// ---------------------------------------------------------------------
export function AssigneeSelect({
  leadId, current, counsellors, disabled,
}: {
  leadId: string; current: string | null; counsellors: { id: string; name: string }[]; disabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(current ?? 'unassigned');
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setValue(next);
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: next === 'unassigned' ? null : next }),
      });
      toast({ title: 'Counsellor updated' });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      setValue(current ?? 'unassigned');
      toast({ title: 'Could not reassign', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => void change(v)} disabled={disabled || busy}>
        <SelectTrigger className="w-[220px]" aria-label="Reassign counsellor">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {counsellors.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Next follow-up card: set date + schedule follow-up dialog
// ---------------------------------------------------------------------
export function NextFollowUpCard({
  leadId, nextFollowUpDate,
}: {
  leadId: string; nextFollowUpDate: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState(nextFollowUpDate ? nextFollowUpDate.slice(0, 10) : '');
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  async function saveDate() {
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nextFollowUpDate: date || null }),
      });
      toast({ title: 'Next follow-up date saved' });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not save date', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function scheduleFollowup() {
    if (!dueDate) {
      toast({ title: 'Pick a due date', variant: 'destructive' });
      return;
    }
    setSavingFollowup(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}/followups`, {
        method: 'POST',
        body: JSON.stringify({ dueDate, note: note || null }),
      });
      toast({ title: 'Follow-up scheduled', description: `Due ${fmtDate(dueDate)}.` });
      setDialogOpen(false);
      setDueDate('');
      setNote('');
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not schedule', description: err.message, variant: 'destructive' });
    } finally {
      setSavingFollowup(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="nfu-date">Next follow-up date</Label>
          <Input id="nfu-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => void saveDate()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
      <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
        <CalendarPlus className="mr-2 h-4 w-4" /> Schedule follow-up task
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule follow-up</DialogTitle>
            <DialogDescription>Creates a follow-up task and updates the lead&apos;s next follow-up date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fu-date">Due date *</Label>
              <Input id="fu-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fu-note">Note</Label>
              <Textarea id="fu-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should be covered in this call?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={savingFollowup}>Cancel</Button>
            <Button onClick={() => void scheduleFollowup()} disabled={savingFollowup}>
              {savingFollowup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------
// Follow-up complete button (list row action)
// ---------------------------------------------------------------------
export function FollowupCompleteButton({ leadId, followupId }: { leadId: string; followupId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function complete() {
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}/followups`, {
        method: 'PATCH',
        body: JSON.stringify({ followupId, status: 'DONE' }),
      });
      toast({ title: 'Follow-up completed' });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not complete', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 text-emerald-700" onClick={() => void complete()} disabled={busy}>
      {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
      Done
    </Button>
  );
}

// ---------------------------------------------------------------------
// Add activity (note / call outcome / email / whatsapp)
// ---------------------------------------------------------------------
const ACTIVITY_TYPES = ['NOTE', 'CALL', 'EMAIL', 'WHATSAPP'] as const;

export function ActivityForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<string>('NOTE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (title.trim().length < 2) {
      toast({ title: 'Add a short title', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}/activities`, {
        method: 'POST',
        body: JSON.stringify({ type, title: title.trim(), content: content || null, outcome: outcome || null }),
      });
      toast({ title: 'Activity logged' });
      setTitle('');
      setContent('');
      setOutcome('');
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not log activity', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-label="Activity type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'NOTE' ? 'Note' : t === 'CALL' ? 'Call' : t === 'EMAIL' ? 'Email' : 'WhatsApp'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="act-title">Title *</Label>
          <Input id="act-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Intro call done" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="act-content">Details</Label>
        <Textarea id="act-content" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conversation summary…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="act-outcome">Outcome</Label>
        <Input id="act-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. Interested — will visit on Saturday" />
      </div>
      <Button onClick={() => void save()} disabled={busy} className="w-full">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
        Log activity
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Campus visit: schedule dialog + status buttons
// ---------------------------------------------------------------------
export function VisitDialogButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [time, setTime] = useState('10:00');
  const [visitorName, setVisitorName] = useState('');
  const [visitorMobile, setVisitorMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function schedule() {
    if (!scheduledAt) {
      toast({ title: 'Pick a date', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}/visits`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledAt: `${scheduledAt}T${time || '10:00'}:00`,
          visitorName: visitorName || null,
          visitorMobile: visitorMobile || null,
          notes: notes || null,
        }),
      });
      toast({ title: 'Campus visit scheduled', description: fmtDate(scheduledAt) });
      setOpen(false);
      setScheduledAt('');
      setVisitorName('');
      setVisitorMobile('');
      setNotes('');
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not schedule visit', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <CalendarPlus className="mr-2 h-4 w-4" /> Schedule campus visit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule campus visit</DialogTitle>
            <DialogDescription>The lead moves to “Campus Visit Scheduled” automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="v-date">Date *</Label>
                <Input id="v-date" type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-time">Time</Label>
                <Input id="v-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-name">Visitor name</Label>
              <Input id="v-name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-mobile">Visitor mobile</Label>
              <Input id="v-mobile" inputMode="tel" value={visitorMobile} onChange={(e) => setVisitorMobile(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea id="v-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void schedule()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VisitStatusButtons({ leadId, visitId }: { leadId: string; visitId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(status: string) {
    setBusy(status);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}/visits`, {
        method: 'PATCH',
        body: JSON.stringify({ visitId, status }),
      });
      toast({ title: status === 'COMPLETED' ? 'Visit marked completed' : 'Marked as no-show' });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not update visit', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" className="h-8 text-emerald-700" onClick={() => void setStatus('COMPLETED')} disabled={busy !== null}>
        {busy === 'COMPLETED' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
        Done
      </Button>
      <Button variant="ghost" size="sm" className="h-8 text-amber-700" onClick={() => void setStatus('NO_SHOW')} disabled={busy !== null}>
        {busy === 'NO_SHOW' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
        No-show
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Lost / Not-interested with reason dialog
// ---------------------------------------------------------------------
export function LostDialogButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('LOST');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (reason.trim().length < 3) {
      toast({ title: 'Please capture the reason', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, lostReason: reason.trim() }),
      });
      toast({ title: status === 'LOST' ? 'Marked as lost' : 'Marked as not interested' });
      setOpen(false);
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not update lead', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
        <UserX className="mr-2 h-4 w-4" /> Mark Lost / Not Interested
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close this lead</DialogTitle>
            <DialogDescription>A reason is mandatory for reporting and follow-up quality.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Outcome"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOST">Lost (admitted elsewhere / dropped)</SelectItem>
                  <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lost-reason">Reason *</Label>
              <Textarea id="lost-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Chose a school closer to home" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Close lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------
// Convert lead → application
// ---------------------------------------------------------------------
export function ConvertLeadButton({ leadId, disabled }: { leadId: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    try {
      const res = await apiFetch<{ applicationId: string; applicationNumber: string }>(
        `/api/admissions/leads/${leadId}/convert`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      toast({
        title: 'Application created',
        description: `Application ${res.data?.applicationNumber ?? ''} created from this lead.`,
      });
      if (res.data?.applicationId) {
        router.push(`/dashboard/applications/${res.data.applicationId}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' });
      setBusy(false);
    }
  }

  return (
    <Button className="w-full" onClick={() => void convert()} disabled={busy || disabled}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
      Convert to Application
    </Button>
  );
}

export function ConvertDisabledNote() {
  return (
    <Button className="w-full" disabled>
      <FileText className="mr-2 h-4 w-4" /> Convert to Application
    </Button>
  );
}

// ---------------------------------------------------------------------
// Edit lead — reuses the create form dialog in edit mode
// ---------------------------------------------------------------------
export function EditLeadButton({
  lead, options, canAssign,
}: {
  lead: LeadFormValues & { id: string };
  options: LeadOptionSources;
  canAssign: boolean;
}) {
  return (
    <LeadFormDialog
      options={options}
      lead={lead}
      canAssign={canAssign}
      trigger={
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      }
    />
  );
}

// Re-exported so the server page can build the same options shape easily.
export { CLASS_OPTIONS };
