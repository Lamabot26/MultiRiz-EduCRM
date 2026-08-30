'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, Plus, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, PRIORITIES, GENDERS, GENDER_LABELS } from '@/lib/constants';

export const CLASS_OPTIONS = [
  'Pre-Nursery', 'Nursery', 'LKG', 'UKG',
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
];

export type LeadOptionSources = {
  sources: { id: string; name: string }[];
  sessions: { id: string; name: string }[];
  counsellors: { id: string; name: string }[];
};

export type LeadFormValues = {
  id?: string;
  studentName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  classApplyingFor?: string | null;
  academicSessionId?: string | null;
  guardianName?: string | null;
  mobile?: string | null;
  altMobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  previousSchool?: string | null;
  leadSourceId?: string | null;
  sourceNotes?: string | null;
  assignedTo?: string | null;
  status?: string | null;
  priority?: string | null;
  notes?: string | null;
  nextFollowUpDate?: string | null;
};

const MOBILE_RE = /^(\+91[- ]?)?[6-9]\d{9}$/;

type FormState = Record<string, string>;

function toState(v?: LeadFormValues | null): FormState {
  const s: FormState = {};
  for (const k of [
    'studentName', 'dateOfBirth', 'gender', 'classApplyingFor', 'academicSessionId',
    'guardianName', 'mobile', 'altMobile', 'email', 'address', 'city', 'previousSchool',
    'leadSourceId', 'sourceNotes', 'assignedTo', 'status', 'priority', 'notes', 'nextFollowUpDate',
  ]) {
    const raw = v?.[k as keyof LeadFormValues];
    if (k === 'dateOfBirth' || k === 'nextFollowUpDate') {
      s[k] = raw ? new Date(raw as string).toISOString().slice(0, 10) : '';
    } else {
      s[k] = (raw as string) ?? '';
    }
  }
  s.status = s.status || 'NEW';
  s.priority = s.priority || 'MEDIUM';
  return s;
}

function buildPayload(state: FormState, force: boolean): Record<string, unknown> {
  const opt = (v: string) => (v === '' ? null : v);
  const payload: Record<string, unknown> = {
    studentName: state.studentName.trim(),
    guardianName: state.guardianName.trim(),
    mobile: state.mobile.replace(/\s+/g, ''),
    dateOfBirth: opt(state.dateOfBirth),
    gender: opt(state.gender),
    classApplyingFor: opt(state.classApplyingFor),
    academicSessionId: opt(state.academicSessionId),
    altMobile: opt(state.altMobile),
    email: opt(state.email),
    address: opt(state.address),
    city: opt(state.city),
    previousSchool: opt(state.previousSchool),
    leadSourceId: opt(state.leadSourceId),
    sourceNotes: opt(state.sourceNotes),
    assignedTo: state.assignedTo === 'unassigned' ? null : opt(state.assignedTo),
    status: opt(state.status),
    priority: opt(state.priority),
    notes: opt(state.notes),
    nextFollowUpDate: opt(state.nextFollowUpDate),
  };
  if (force) payload.force = true;
  return payload;
}

export function LeadFormDialog({
  options,
  lead,
  canAssign = false,
  trigger,
  onSaved,
}: {
  options: LeadOptionSources;
  lead?: LeadFormValues | null;
  canAssign?: boolean;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(lead?.id);
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<FormState>(() => toState(lead));
  const [clientError, setClientError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; leadNumber: string; studentName?: string } | null>(null);

  useEffect(() => {
    if (open) {
      setState(toState(lead));
      setClientError(null);
      setDuplicate(null);
    }
  }, [open]);

  const set = (k: string, v: string) => setState((s) => ({ ...s, [k]: v }));

  async function submit(force = false) {
    setClientError(null);
    if (!state.studentName.trim() || state.studentName.trim().length < 2) {
      setClientError('Student name is required (min 2 characters).');
      return;
    }
    if (!state.guardianName.trim() || state.guardianName.trim().length < 2) {
      setClientError('Guardian name is required (min 2 characters).');
      return;
    }
    if (!MOBILE_RE.test(state.mobile.replace(/\s+/g, ''))) {
      setClientError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (state.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) {
      setClientError('Enter a valid email address.');
      return;
    }
    setSaving(true);
    setDuplicate(null);
    try {
      const url = isEdit ? `/api/admissions/leads/${lead?.id}` : '/api/admissions/leads';
      const res = await apiFetch<{ id: string; leadNumber: string }>(url, {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify(buildPayload(state, force)),
      });
      toast({
        title: isEdit ? 'Lead updated' : 'Lead created',
        description: `Lead ${res.data?.leadNumber ?? ''} saved successfully.`,
      });
      setOpen(false);
      onSaved?.();
      router.refresh();
      if (!isEdit && res.data?.id) {
        router.push(`/dashboard/leads/${res.data.id}`);
      }
    } catch (e) {
      const err = e as ApiFetchError;
      const existing = err.data?.existing as { id: string; leadNumber: string; studentName?: string } | undefined;
      if (err.status === 409 && existing) {
        setDuplicate(existing);
      } else {
        setClientError(err.message || 'Could not save the lead. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Lead
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> {isEdit ? 'Edit Lead' : 'Create Lead'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update lead details. Status changes are logged to the lead timeline.'
                : 'Capture a new admission enquiry. Duplicate enquiries are detected automatically.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lf-student">Student Name *</Label>
              <Input id="lf-student" value={state.studentName} onChange={(e) => set('studentName', e.target.value)} placeholder="e.g. Aarav Mohanty" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-dob">Date of Birth</Label>
              <Input id="lf-dob" type="date" value={state.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={state.gender} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger aria-label="Gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class Applying For</Label>
              <Select value={state.classApplyingFor} onValueChange={(v) => set('classApplyingFor', v)}>
                <SelectTrigger aria-label="Class applying for"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Academic Session</Label>
              <Select value={state.academicSessionId} onValueChange={(v) => set('academicSessionId', v)}>
                <SelectTrigger aria-label="Academic session"><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {options.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lead Source</Label>
              <Select value={state.leadSourceId} onValueChange={(v) => set('leadSourceId', v)}>
                <SelectTrigger aria-label="Lead source"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {options.sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-guardian">Guardian Name *</Label>
              <Input id="lf-guardian" value={state.guardianName} onChange={(e) => set('guardianName', e.target.value)} placeholder="e.g. Rakesh Mohanty" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-mobile">Mobile *</Label>
              <Input id="lf-mobile" inputMode="tel" value={state.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-altmobile">Alternate Mobile</Label>
              <Input id="lf-altmobile" inputMode="tel" value={state.altMobile} onChange={(e) => set('altMobile', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-email">Email</Label>
              <Input id="lf-email" type="email" value={state.email} onChange={(e) => set('email', e.target.value)} placeholder="guardian@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-city">City</Label>
              <Input id="lf-city" value={state.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-prevschool">Previous School</Label>
              <Input id="lf-prevschool" value={state.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-source-notes">Source Notes</Label>
              <Input id="lf-source-notes" value={state.sourceNotes} onChange={(e) => set('sourceNotes', e.target.value)} placeholder="How did they hear about us?" />
            </div>
            {canAssign ? (
              <div className="space-y-1.5">
                <Label>Assigned Counsellor</Label>
                <Select value={state.assignedTo} onValueChange={(v) => set('assignedTo', v)}>
                  <SelectTrigger aria-label="Assigned counsellor"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {options.counsellors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={state.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger aria-label="Status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={state.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger aria-label="Priority"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-nextfollowup">Next Follow-up Date</Label>
              <Input id="lf-nextfollowup" type="date" value={state.nextFollowUpDate} onChange={(e) => set('nextFollowUpDate', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lf-address">Address</Label>
              <Input id="lf-address" value={state.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lf-notes">Notes</Label>
              <Textarea id="lf-notes" rows={3} value={state.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything worth remembering about this enquiry…" />
            </div>
          </div>

          {clientError ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{clientError}</p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={() => void submit(false)} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Possible-duplicate warning (409 with existing lead) */}
      <Dialog open={Boolean(duplicate)} onOpenChange={(o) => !o && setDuplicate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Possible duplicate
            </DialogTitle>
            <DialogDescription>
              An enquiry with the same mobile/email was registered in the last 90 days.
            </DialogDescription>
          </DialogHeader>
          {duplicate ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{duplicate.studentName ?? 'Existing lead'}</p>
              <p className="text-xs text-muted-foreground">Lead #{duplicate.leadNumber}</p>
              <Link href={`/dashboard/leads/${duplicate.id}`} className="mt-1 inline-block text-sm font-medium text-primary hover:underline">
                Open this lead →
              </Link>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicate(null)}>Go back</Button>
            <Button variant="secondary" onClick={() => void submit(true)} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
