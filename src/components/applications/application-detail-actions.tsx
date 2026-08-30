'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, GraduationCap, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, GENDERS, GENDER_LABELS, DOC_TYPES, DOC_TYPE_LABELS } from '@/lib/constants';
import { CLASS_OPTIONS } from '@/components/leads/lead-form-dialog';

const DOC_TYPE_ITEMS = DOC_TYPES.map((d) => (
  <SelectItem key={d} value={d}>{DOC_TYPE_LABELS[d]}</SelectItem>
));

// ---------------------------------------------------------------------
// Create application (manual entry without a lead)
// ---------------------------------------------------------------------
export function ApplicationFormDialog({
  sessions,
  trigger,
}: {
  sessions: { id: string; name: string }[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentName: '', dateOfBirth: '', gender: '', classApplyingFor: '',
    academicSessionId: '', guardianName: '', mobile: '', email: '',
    address: '', previousSchool: '',
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, academicSessionId: sessions.find((s) => s.id === f.academicSessionId)?.id ?? sessions[0]?.id ?? '' }));
      setErr(null);
    }
  }, [open]);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function submit() {
    setErr(null);
    if (form.studentName.trim().length < 2) return setErr('Student name is required.');
    if (form.guardianName.trim().length < 2) return setErr('Guardian name is required.');
    if (!/^(\+91[- ]?)?[6-9]\d{9}$/.test(form.mobile.replace(/\s+/g, ''))) return setErr('Enter a valid 10-digit Indian mobile number.');
    if (!form.classApplyingFor) return setErr('Select the class applying for.');
    if (!form.academicSessionId) return setErr('Select the academic session.');
    setBusy(true);
    try {
      const res = await apiFetch<{ id: string; applicationNumber: string }>('/api/admissions/applications', {
        method: 'POST',
        body: JSON.stringify({
          studentName: form.studentName.trim(),
          guardianName: form.guardianName.trim(),
          mobile: form.mobile.replace(/\s+/g, ''),
          classApplyingFor: form.classApplyingFor,
          academicSessionId: form.academicSessionId,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          email: form.email || null,
          address: form.address || null,
          previousSchool: form.previousSchool || null,
        }),
      });
      toast({ title: 'Application created', description: `Application ${res.data?.applicationNumber ?? ''} submitted.` });
      setOpen(false);
      router.refresh();
      if (res.data?.id) router.push(`/dashboard/applications/${res.data.id}`);
    } catch (e) {
      const error = e as ApiFetchError;
      setErr(error.message || 'Could not create the application.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Application
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Application</DialogTitle>
            <DialogDescription>Manual entry — no linked lead required.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="af-student">Student Name *</Label>
              <Input id="af-student" value={form.studentName} onChange={(e) => set('studentName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-dob">Date of Birth</Label>
              <Input id="af-dob" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger aria-label="Gender"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (<SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class Applying For *</Label>
              <Select value={form.classApplyingFor} onValueChange={(v) => set('classApplyingFor', v)}>
                <SelectTrigger aria-label="Class"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Academic Session *</Label>
              <Select value={form.academicSessionId} onValueChange={(v) => set('academicSessionId', v)}>
                <SelectTrigger aria-label="Session"><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-guardian">Guardian Name *</Label>
              <Input id="af-guardian" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-mobile">Mobile *</Label>
              <Input id="af-mobile" inputMode="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-email">Email</Label>
              <Input id="af-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-prev">Previous School</Label>
              <Input id="af-prev" value={form.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-address">Address</Label>
              <Input id="af-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
          {err ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------
// Status workflow select
// ---------------------------------------------------------------------
export function ApplicationStatusSelect({ applicationId, current }: { applicationId: string; current: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setValue(next);
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      toast({ title: 'Status updated', description: APPLICATION_STATUS_LABELS[next] ?? next });
      router.refresh();
    } catch (e) {
      const error = e as ApiFetchError;
      setValue(current);
      toast({ title: 'Could not update status', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => void change(v)} disabled={busy}>
        <SelectTrigger className="w-[220px]" aria-label="Application status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Documents: add dialog + verify checkbox
// ---------------------------------------------------------------------
export function AddDocumentDialog({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ docType: 'BIRTH_CERTIFICATE', fileName: '', fileUrl: '', remarks: '' });

  async function submit() {
    setErr(null);
    if (!form.fileName.trim()) return setErr('File name is required.');
    if (!/^\/uploads\//.test(form.fileUrl) && !/^https:\/\//.test(form.fileUrl)) {
      return setErr('File URL must start with /uploads/ or https://');
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/applications/${applicationId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ docType: form.docType, fileName: form.fileName.trim(), fileUrl: form.fileUrl.trim(), remarks: form.remarks || null }),
      });
      toast({ title: 'Document added' });
      setOpen(false);
      setForm({ docType: 'BIRTH_CERTIFICATE', fileName: '', fileUrl: '', remarks: '' });
      router.refresh();
    } catch (e) {
      const error = e as ApiFetchError;
      setErr(error.message || 'Could not add document.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> Add document
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
            <DialogDescription>
              Record a document against this application. Files must already be uploaded (path under /uploads/ or an https URL).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Document type</Label>
              <Select value={form.docType} onValueChange={(v) => setForm((f) => ({ ...f, docType: v }))}>
                <SelectTrigger aria-label="Document type"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPE_ITEMS}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">File name *</Label>
              <Input id="doc-name" value={form.fileName} onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))} placeholder="birth-certificate.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-url">File URL *</Label>
              <Input id="doc-url" value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} placeholder="/uploads/abcd1234.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-remarks">Remarks</Label>
              <Textarea id="doc-remarks" rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
            </div>
          </div>
          {err ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DocumentVerifyCheckbox({
  applicationId, documentId, isVerified,
}: {
  applicationId: string; documentId: string; isVerified: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [checked, setChecked] = useState(isVerified);
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setChecked(next);
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/applications/${applicationId}/documents`, {
        method: 'PATCH',
        body: JSON.stringify({ documentId, isVerified: next }),
      });
      toast({ title: next ? 'Document verified' : 'Verification removed' });
      router.refresh();
    } catch (e) {
      const error = e as ApiFetchError;
      setChecked(!next);
      toast({ title: 'Could not update document', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Checkbox
      checked={checked}
      disabled={busy}
      onCheckedChange={(v) => void toggle(v === true)}
      aria-label={checked ? 'Mark document unverified' : 'Verify document'}
    />
  );
}

// ---------------------------------------------------------------------
// Decision buttons (Offer / Reject / Waitlist) with remarks dialog
// ---------------------------------------------------------------------
export function DecisionButtons({ applicationId, disabled }: { applicationId: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<'OFFER' | 'REJECT' | 'WAITLIST'>('OFFER');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  function openDialog(d: 'OFFER' | 'REJECT' | 'WAITLIST') {
    setDecision(d);
    setRemarks('');
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      await apiFetch(`/api/admissions/applications/${applicationId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, remarks: remarks || null }),
      });
      toast({
        title: 'Decision recorded',
        description:
          decision === 'OFFER' ? 'Offer letter status: OFFER_MADE.'
          : decision === 'REJECT' ? 'Application rejected.'
          : 'Applicant waitlisted.',
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      const error = e as ApiFetchError;
      toast({ title: 'Could not record decision', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="border-emerald-300 text-emerald-800 hover:bg-emerald-50" onClick={() => openDialog('OFFER')} disabled={disabled}>
          Make Offer
        </Button>
        <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50" onClick={() => openDialog('WAITLIST')} disabled={disabled}>
          Waitlist
        </Button>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => openDialog('REJECT')} disabled={disabled}>
          Reject
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Record decision: {decision === 'OFFER' ? 'Offer' : decision === 'REJECT' ? 'Reject' : 'Waitlist'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'OFFER'
                ? 'The application status moves to OFFER_MADE. Mark it ACCEPTED to enable student conversion.'
                : 'This is recorded on the decision timeline and cannot be undone lightly.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="dec-remarks">Remarks</Label>
            <Textarea id="dec-remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks for the record…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              onClick={() => void submit()}
              disabled={busy}
              variant={decision === 'REJECT' ? 'destructive' : 'default'}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm {decision === 'OFFER' ? 'Offer' : decision === 'REJECT' ? 'Rejection' : 'Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------
// Convert accepted application → Student
// ---------------------------------------------------------------------
export function ConvertToStudentButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    try {
      const res = await apiFetch<{ studentId: string; admissionNumber: string }>(
        `/api/admissions/applications/${applicationId}/convert`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      toast({
        title: 'Student created!',
        description: (
          <span>
            Admission number <strong>{res.data?.admissionNumber}</strong> —{' '}
            <Link href={`/dashboard/students/${res.data?.studentId ?? ''}`} className="underline">open student profile</Link>
          </span>
        ),
      });
      router.refresh();
    } catch (e) {
      const error = e as ApiFetchError;
      toast({ title: 'Conversion failed', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button className="w-full" onClick={() => void convert()} disabled={busy}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
      Convert to Student
    </Button>
  );
}
