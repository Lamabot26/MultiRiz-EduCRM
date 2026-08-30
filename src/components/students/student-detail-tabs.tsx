'use client';

// =====================================================================
// Student detail — client island with tabbed sections:
// Overview | Guardians | Approved Contacts | Documents | Fee Account |
// Attendance | Status History.
// Mutations call the REST APIs then router.refresh() to re-pull the
// server-rendered page.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck, CalendarDays, ClipboardList, FileText, Loader2, Pencil,
  Phone, Plus, ShieldCheck, Trash2, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { StudentFormDialog } from '@/components/students/student-form-dialog';
import { rupees } from '@/lib/money';
import { fmtDate, fmtDateTime } from '@/lib/date-utils';
import {
  DOC_TYPES, DOC_TYPE_LABELS, GENDER_LABELS, RELATIONSHIPS, RELATIONSHIP_LABELS,
  STUDENT_STATUSES, STUDENT_STATUS_LABELS,
} from '@/lib/constants';

/** Empty string → null (tiny local helper). */
const orNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

// ---------- prop shapes (serialized from the server page) ----------
type StudentInfo = {
  id: string; admissionNumber: string;
  firstName: string; middleName: string | null; lastName: string | null;
  dateOfBirth: Date | null; gender: string | null; bloodGroup: string | null;
  nationality: string | null; religion: string | null; admissionDate: Date | null;
  classId: string | null; sectionId: string | null; rollNumber: string | null;
  house: string | null; transportRoute: string | null; hostelStatus: string | null;
  previousSchool: string | null; status: string; photoUrl: string | null;
  className: string | null; sectionName: string | null; sessionName: string | null;
  admissionDateLabel: string;
};
type GuardianRow = {
  guardianId: string; fullName: string; relationship: string; mobile: string;
  email: string | null; occupation: string | null; isPrimary: boolean;
  isEmergencyContact: boolean; isPrimaryContactFlag: boolean; consentStatus: string;
};
type ContactAuditRow = { id: string; action: string; performedByName: string; createdAt: Date };
type ContactRow = {
  id: string; contactName: string; relationship: string; mobile: string; email: string | null;
  approvalStatus: string; approvedByName: string | null; approvedAt: Date | null;
  notes: string | null; createdAt: Date; audits: ContactAuditRow[];
};
type DocumentRow = {
  id: string; docType: string; fileName: string; fileUrl: string;
  verified: boolean; sizeBytes: number | null; createdAt: Date;
};
type StatusHistoryRow = {
  id: string; fromStatus: string | null; toStatus: string; reason: string | null;
  changedByName: string; changedAt: Date;
};
type ClassAssignmentRow = {
  id: string; className: string; sectionName: string | null; sessionName: string;
  rollNumber: string | null; isActive: boolean; assignedAt: Date;
};
type FeesData = {
  invoices: { id: string; invoiceNumber: string; periodLabel: string | null; issueDate: Date; dueDate: Date | null; status: string; total: number; paidTotal: number; balance: number }[];
  payments: { id: string; amount: number; mode: string; status: string; paidAt: Date | null; referenceNumber: string | null; createdAt: Date }[];
  outstandingLabel: string;
} | null;

type Props = {
  perms: { write: boolean; contacts: boolean; documents: boolean; fees: boolean; attendance: boolean };
  student: StudentInfo;
  guardians: GuardianRow[];
  approvedContacts: ContactRow[];
  documents: DocumentRow[];
  statusHistory: StatusHistoryRow[];
  classAssignments: ClassAssignmentRow[];
  attendance: {
    percentPresent: number | null; total: number; present: number;
    recent: { id: string; date: Date; status: string; className: string; sessionType: string }[];
  };
  fees: FeesData;
};

const fullName = (s: StudentInfo) => [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');

// =====================================================================
export function StudentDetailTabs(props: Props) {
  const { student, perms } = props;
  const router = useRouter();
  const { toast } = useToast();

  // ---- shared dialog state ----
  const [editOpen, setEditOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState(student.status);
  const [statusReason, setStatusReason] = useState('');
  const [busy, setBusy] = useState(false);

  const saveStatus = async () => {
    if (!statusValue || statusValue === student.status) {
      toast({ title: 'Pick a different status first' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusValue, reason: orNull(statusReason) }),
      });
      toast({ title: 'Status updated', description: `${student.admissionNumber} → ${STUDENT_STATUS_LABELS[statusValue] ?? statusValue}.` });
      setStatusDialogOpen(false);
      setStatusReason('');
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not update status', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const tabList = [
    { value: 'overview', label: 'Overview' },
    { value: 'guardians', label: 'Guardians' },
    { value: 'contacts', label: 'Approved Contacts' },
    { value: 'documents', label: 'Documents' },
    { value: 'fees', label: 'Fee Account' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'history', label: 'Status History' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            {student.photoUrl && <AvatarImage src={student.photoUrl} alt={`${fullName(student)} photo`} />}
            <AvatarFallback className="text-lg font-semibold">
              {(student.firstName?.charAt(0) ?? 'S')}{(student.lastName?.charAt(0) ?? '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{fullName(student)}</h1>
              <StatusBadge status={student.status} label={STUDENT_STATUS_LABELS[student.status] ?? student.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {student.admissionNumber}
              {student.className ? <> · {student.className}{student.sectionName ? ` – ${student.sectionName}` : ''}</> : null}
              {student.rollNumber ? <> · Roll {student.rollNumber}</> : null}
            </p>
          </div>
        </div>
        {perms.write && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStatusValue(student.status); setStatusDialogOpen(true); }}
            >
              Change status
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {tabList.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Full name" value={fullName(student)} />
                <Info label="Gender" value={student.gender ? GENDER_LABELS[student.gender] ?? student.gender : null} />
                <Info label="Date of birth" value={fmtDate(student.dateOfBirth)} />
                <Info label="Blood group" value={student.bloodGroup} />
                <Info label="Nationality" value={student.nationality} />
                <Info label="Religion" value={student.religion} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admission Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Admission number" value={student.admissionNumber} mono />
                <Info label="Admission date" value={student.admissionDateLabel} />
                <Info label="Academic session" value={student.sessionName} />
                <Info label="Previous school" value={student.previousSchool} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Academic Allocation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info label="Class" value={student.className} />
                <Info label="Section" value={student.sectionName} />
                <Info label="Roll number" value={student.rollNumber} />
                <Info label="House" value={student.house} />
                <Info label="Transport route" value={student.transportRoute} />
                <Info label="Hostel status" value={student.hostelStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Enrollment History</CardTitle>
                <CardDescription>Class assignments across sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {props.classAssignments.length === 0 ? (
                  <EmptyLine icon={<CalendarDays className="h-4 w-4" aria-hidden />} text="No class assignments recorded." />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {props.classAssignments.slice(0, 5).map((ca) => (
                      <li key={ca.id} className="flex items-center justify-between gap-2">
                        <span>{ca.className}{ca.sectionName ? ` – ${ca.sectionName}` : ''} · {ca.sessionName}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {ca.isActive && <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Current</Badge>}
                          {fmtDate(ca.assignedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------- Guardians ---------------- */}
        <TabsContent value="guardians" className="space-y-4">
          {perms.write && <GuardiansSection studentId={student.id} guardians={props.guardians} />}
        </TabsContent>

        {/* ---------------- Approved Contacts ---------------- */}
        <TabsContent value="contacts" className="space-y-4">
          {perms.contacts ? (
            <ApprovedContactsSection studentId={student.id} contacts={props.approvedContacts} />
          ) : (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
                You need approved-contacts management permission to view this section.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Documents ---------------- */}
        <TabsContent value="documents" className="space-y-4">
          {perms.documents ? (
            <DocumentsSection studentId={student.id} documents={props.documents} />
          ) : (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <FileText className="h-5 w-5 shrink-0" aria-hidden />
                You need document management permission to view this section.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Fee Account ---------------- */}
        <TabsContent value="fees" className="space-y-4">
          {perms.fees && props.fees ? (
            <FeeSection fees={props.fees} />
          ) : (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                Sign in with finance access to view invoices and payments.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Attendance ---------------- */}
        <TabsContent value="attendance" className="space-y-4">
          {perms.attendance ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">Present % (session)</p>
                    <p className="text-2xl font-bold text-success">{props.attendance.percentPresent ?? '—'}{props.attendance.percentPresent !== null ? '%' : ''}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">Days present</p>
                    <p className="text-2xl font-bold">{props.attendance.present}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">Days recorded</p>
                    <p className="text-2xl font-bold">{props.attendance.total}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  {props.attendance.recent.length === 0 ? (
                    <EmptyLine icon={<ClipboardList className="h-4 w-4" aria-hidden />} text="No attendance records for the current session yet." />
                  ) : (
                    <ul className="divide-y text-sm">
                      {props.attendance.recent.map((r) => (
                        <li key={r.id} className="flex items-center justify-between py-2">
                          <span>{fmtDate(r.date)} · {r.className} · {r.sessionType.replace('_', ' ')}</span>
                          <StatusBadge status={r.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                You need attendance read permission to view this section.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Status History ---------------- */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status history</CardTitle>
              <CardDescription>Every status transition is recorded with the reason.</CardDescription>
            </CardHeader>
            <CardContent>
              {props.statusHistory.length === 0 ? (
                <EmptyLine icon={<ClipboardList className="h-4 w-4" aria-hidden />} text="No status changes recorded." />
              ) : (
                <ol className="space-y-3">
                  {props.statusHistory.map((h) => (
                    <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge status={h.toStatus} label={STUDENT_STATUS_LABELS[h.toStatus] ?? h.toStatus} />
                      {h.fromStatus && (
                        <>
                          <span className="text-muted-foreground">from</span>
                          <span>{STUDENT_STATUS_LABELS[h.fromStatus] ?? h.fromStatus}</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {fmtDateTime(h.changedAt)} · by {h.changedByName}
                      </span>
                      {h.reason && <span className="w-full text-xs text-muted-foreground">Reason: {h.reason}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog (reused create/edit form) */}
      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSaved={() => router.refresh()}
      />

      {/* Status change dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change student status</DialogTitle>
            <DialogDescription>
              Status transitions are stored in the student&apos;s status history and audited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>New status</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger aria-label="New status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STUDENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STUDENT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-reason">Reason</Label>
              <Textarea
                id="status-reason"
                rows={3}
                placeholder="e.g. Transferred to another school (TC issued)"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveStatus} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------
function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function EmptyLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}

// ================= Guardians section ==================================
function GuardiansSection({ studentId, guardians }: { studentId: string; guardians: GuardianRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '', relationship: 'FATHER', mobile: '', altMobile: '', email: '', occupation: '', address: '',
    isPrimaryContact: false, isEmergencyContact: false,
  });

  const addGuardian = async () => {
    setBusy('add');
    try {
      await apiFetch(`/api/students/${studentId}/guardians`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          relationship: form.relationship,
          mobile: form.mobile.trim(),
          altMobile: orNull(form.altMobile),
          email: orNull(form.email),
          occupation: orNull(form.occupation),
          address: orNull(form.address),
          isPrimaryContact: form.isPrimaryContact,
          isEmergencyContact: form.isEmergencyContact,
        }),
      });
      toast({ title: 'Guardian added' });
      setAddOpen(false);
      setForm({ fullName: '', relationship: 'FATHER', mobile: '', altMobile: '', email: '', occupation: '', address: '', isPrimaryContact: false, isEmergencyContact: false });
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not add guardian', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const patch = async (guardianId: string, body: Record<string, unknown>, label: string) => {
    setBusy(guardianId + label);
    try {
      await apiFetch(`/api/students/${studentId}/guardians`, { method: 'PATCH', body: JSON.stringify({ guardianId, ...body }) });
      toast({ title: label + ' updated' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Guardians ({guardians.length})</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Add Guardian
        </Button>
      </div>
      {guardians.length === 0 ? (
        <Card><CardContent className="p-6">
          <EmptyLine icon={<Users className="h-4 w-4" aria-hidden />} text="No guardians linked yet." />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guardians.map((g) => (
            <Card key={g.guardianId}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{g.fullName}</CardTitle>
                    <CardDescription>{RELATIONSHIP_LABELS[g.relationship] ?? g.relationship}</CardDescription>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {g.isPrimary && <Badge className="border-success/30 bg-success/10 text-success" variant="outline">Primary</Badge>}
                    {g.isEmergencyContact && <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">Emergency</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" aria-hidden /> {g.mobile}</p>
                {g.email && <p className="text-muted-foreground">{g.email}</p>}
                {g.occupation && <p className="text-muted-foreground">Occupation: {g.occupation}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Consent:</span>
                  <StatusBadge status={g.consentStatus} label={g.consentStatus} />
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {!g.isPrimary && (
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => patch(g.guardianId, { isPrimary: true }, 'Primary guardian')}>
                      Make primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => patch(g.guardianId, { isEmergencyContact: !g.isEmergencyContact }, 'Emergency')}
                  >
                    {g.isEmergencyContact ? 'Unset emergency' : 'Set emergency'}
                  </Button>
                  {g.consentStatus !== 'APPROVED' && (
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => patch(g.guardianId, { consentStatus: 'APPROVED' }, 'Consent')}>
                      Approve consent
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add guardian</DialogTitle>
            <DialogDescription>The guardian record is linked to this student and audited.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gd-name">Full name *</Label>
              <Input id="gd-name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={form.relationship} onValueChange={(v) => setForm((p) => ({ ...p, relationship: v }))}>
                <SelectTrigger aria-label="Relationship"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{RELATIONSHIP_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gd-mobile">Mobile *</Label>
              <Input id="gd-mobile" inputMode="numeric" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gd-alt">Alternate mobile</Label>
              <Input id="gd-alt" value={form.altMobile} onChange={(e) => setForm((p) => ({ ...p, altMobile: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gd-email">Email</Label>
              <Input id="gd-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gd-occ">Occupation</Label>
              <Input id="gd-occ" value={form.occupation} onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gd-addr">Address</Label>
              <Input id="gd-addr" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isPrimaryContact} onCheckedChange={(v) => setForm((p) => ({ ...p, isPrimaryContact: v }))} aria-label="Primary contact" />
              Primary contact
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isEmergencyContact} onCheckedChange={(v) => setForm((p) => ({ ...p, isEmergencyContact: v }))} aria-label="Emergency contact" />
              Emergency contact
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy !== null}>Cancel</Button>
            <Button onClick={addGuardian} disabled={busy !== null || !form.fullName.trim() || !form.mobile.trim()}>
              {busy === 'add' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Add guardian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================= Approved contacts section =========================
function ApprovedContactsSection({ studentId, contacts }: { studentId: string; contacts: ContactRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ contact: ContactRow; status: 'APPROVED' | 'REJECTED' | 'REVOKED' } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [form, setForm] = useState({ contactName: '', relationship: 'FATHER', mobile: '', email: '', notes: '' });

  const addContact = async () => {
    setBusy('add');
    try {
      await apiFetch(`/api/students/${studentId}/approved-contacts`, {
        method: 'POST',
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          relationship: form.relationship,
          mobile: form.mobile.trim(),
          email: orNull(form.email),
          notes: orNull(form.notes),
        }),
      });
      toast({ title: 'Contact added', description: 'It starts in PENDING state until approved.' });
      setAddOpen(false);
      setForm({ contactName: '', relationship: 'FATHER', mobile: '', email: '', notes: '' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not add contact', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const decide = async () => {
    if (!confirm) return;
    setBusy('decide');
    try {
      await apiFetch(`/api/students/${studentId}/approved-contacts/${confirm.contact.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: confirm.status, notes: orNull(confirmNotes) }),
      });
      toast({ title: `Contact ${confirm.status.toLowerCase()}` });
      setConfirm(null);
      setConfirmNotes('');
      router.refresh();
    } catch (err) {
      toast({ title: 'Decision failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (contact: ContactRow) => {
    setBusy('remove-' + contact.id);
    try {
      await apiFetch(`/api/students/${studentId}/approved-contacts/${contact.id}`, { method: 'DELETE' });
      toast({ title: 'Contact removed', description: 'Status set to REVOKED — the audit trail is preserved.' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Remove failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Approved pickup / calling contacts ({contacts.length})</h2>
          <p className="text-xs text-muted-foreground">Every change is recorded in an immutable audit trail.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card><CardContent className="p-6">
          <EmptyLine icon={<ShieldCheck className="h-4 w-4" aria-hidden />} text="No authorised contacts added yet." />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{c.contactName}</CardTitle>
                    <CardDescription>{RELATIONSHIP_LABELS[c.relationship] ?? c.relationship} · {c.mobile}</CardDescription>
                  </div>
                  <StatusBadge status={c.approvalStatus} label={c.approvalStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.email && <p className="text-muted-foreground">{c.email}</p>}
                {c.notes && <p className="text-muted-foreground">Notes: {c.notes}</p>}
                <p className="text-xs text-muted-foreground">
                  {c.approvedAt
                    ? `${c.approvalStatus.charAt(0) + c.approvalStatus.slice(1).toLowerCase()}${c.approvedByName ? ` by ${c.approvedByName}` : ''} · ${fmtDateTime(c.approvedAt)}`
                    : 'Awaiting decision'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.approvalStatus !== 'APPROVED' && (
                    <Button size="sm" variant="outline" onClick={() => { setConfirm({ contact: c, status: 'APPROVED' }); setConfirmNotes(c.notes ?? ''); }}>
                      <BadgeCheck className="mr-1 h-4 w-4 text-success" aria-hidden /> Approve
                    </Button>
                  )}
                  {c.approvalStatus === 'PENDING' && (
                    <Button size="sm" variant="outline" onClick={() => { setConfirm({ contact: c, status: 'REJECTED' }); setConfirmNotes(c.notes ?? ''); }}>
                      Reject
                    </Button>
                  )}
                  {c.approvalStatus === 'APPROVED' && (
                    <Button size="sm" variant="outline" onClick={() => { setConfirm({ contact: c, status: 'REVOKED' }); setConfirmNotes(c.notes ?? ''); }}>
                      Revoke
                    </Button>
                  )}
                  {c.approvalStatus !== 'REVOKED' && (
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null} onClick={() => remove(c)}>
                      <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Remove
                    </Button>
                  )}
                </div>
                {c.audits.length > 0 && (
                  <details className="rounded-md border p-2 text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground">
                      Audit trail ({c.audits.length})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {c.audits.map((a) => (
                        <li key={a.id} className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">{a.action}</Badge>
                          <span className="text-muted-foreground">{fmtDateTime(a.createdAt)} · {a.performedByName}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add contact dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add approved contact</DialogTitle>
            <DialogDescription>New contacts start as PENDING and must be approved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ac-name">Contact name *</Label>
              <Input id="ac-name" value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Relationship</Label>
                <Select value={form.relationship} onValueChange={(v) => setForm((p) => ({ ...p, relationship: v }))}>
                  <SelectTrigger aria-label="Relationship"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{RELATIONSHIP_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-mobile">Mobile *</Label>
                <Input id="ac-mobile" inputMode="numeric" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-email">Email</Label>
              <Input id="ac-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-notes">Notes</Label>
              <Textarea id="ac-notes" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy !== null}>Cancel</Button>
            <Button onClick={addContact} disabled={busy !== null || !form.contactName.trim() || !form.mobile.trim()}>
              {busy === 'add' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision confirm dialog */}
      <Dialog open={confirm !== null} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm?.status === 'APPROVED' && 'Approve contact'}
              {confirm?.status === 'REJECTED' && 'Reject contact'}
              {confirm?.status === 'REVOKED' && 'Revoke contact'}
            </DialogTitle>
            <DialogDescription>
              {confirm?.status === 'APPROVED' && `${confirm.contact.contactName} will be authorised for pickup / calls.`}
              {confirm?.status === 'REJECTED' && `${confirm?.contact.contactName}'s request will be rejected.`}
              {confirm?.status === 'REVOKED' && `${confirm?.contact.contactName}'s authorisation will be revoked.`}
              {' '}This decision is recorded in the immutable audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ac-decision-notes">Notes (optional)</Label>
            <Textarea id="ac-decision-notes" rows={3} value={confirmNotes} onChange={(e) => setConfirmNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={busy !== null}>Cancel</Button>
            <Button
              onClick={decide}
              disabled={busy !== null}
              variant={confirm?.status === 'APPROVED' ? 'default' : 'destructive'}
            >
              {busy === 'decide' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Confirm {confirm?.status.toLowerCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================= Documents section =================================
function DocumentsSection({ studentId, documents }: { studentId: string; documents: DocumentRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ docType: 'BIRTH_CERTIFICATE', fileName: '', fileUrl: '', mimeType: '', sizeText: '', notes: '' });

  const addDoc = async () => {
    const sizeBytes = form.sizeText.trim() ? parseInt(form.sizeText, 10) : null;
    setBusy('add');
    try {
      await apiFetch(`/api/students/${studentId}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          docType: form.docType,
          fileName: form.fileName.trim(),
          fileUrl: form.fileUrl.trim(),
          mimeType: orNull(form.mimeType),
          sizeBytes: sizeBytes !== null && !Number.isNaN(sizeBytes) ? sizeBytes : null,
          notes: orNull(form.notes),
        }),
      });
      toast({ title: 'Document added' });
      setAddOpen(false);
      setForm({ docType: 'BIRTH_CERTIFICATE', fileName: '', fileUrl: '', mimeType: '', sizeText: '', notes: '' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not add document', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const removeDoc = async (doc: DocumentRow) => {
    setBusy('del-' + doc.id);
    try {
      await apiFetch(`/api/students/${studentId}/documents?docId=${doc.id}`, { method: 'DELETE' });
      toast({ title: 'Document deleted', description: 'The deletion is audited.' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Add Document
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="p-6"><EmptyLine icon={<FileText className="h-4 w-4" aria-hidden />} text="No documents uploaded yet." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm font-medium">{DOC_TYPE_LABELS[d.docType] ?? d.docType}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm">
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{d.fileName}</a>
                      </TableCell>
                      <TableCell className="text-sm">{d.sizeBytes ? `${(d.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(d.createdAt)}</TableCell>
                      <TableCell>
                        {d.verified
                          ? <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Verified</Badge>
                          : <Badge variant="outline">Pending</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null} onClick={() => removeDoc(d)}>
                          <Trash2 className="h-4 w-4" aria-hidden /><span className="sr-only">Delete {d.fileName}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
            <DialogDescription>
              Link an uploaded file. URL must start with /uploads/ or https:// — max 10&nbsp;MB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Document type</Label>
              <Select value={form.docType} onValueChange={(v) => setForm((p) => ({ ...p, docType: v }))}>
                <SelectTrigger aria-label="Document type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{DOC_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-name">File name *</Label>
              <Input id="dc-name" value={form.fileName} onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-url">File URL *</Label>
              <Input id="dc-url" placeholder="/uploads/birth-certificates/…" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dc-mime">MIME type</Label>
                <Input id="dc-mime" placeholder="application/pdf" value={form.mimeType} onChange={(e) => setForm((p) => ({ ...p, mimeType: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-size">Size (bytes)</Label>
                <Input id="dc-size" inputMode="numeric" value={form.sizeText} onChange={(e) => setForm((p) => ({ ...p, sizeText: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-notes">Notes</Label>
              <Textarea id="dc-notes" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy !== null}>Cancel</Button>
            <Button onClick={addDoc} disabled={busy !== null || !form.fileName.trim() || !form.fileUrl.trim()}>
              {busy === 'add' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Add document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================= Fee section =======================================
function FeeSection({ fees }: { fees: NonNullable<FeesData> }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-destructive">{fees.outstandingLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Invoices</p>
            <p className="text-2xl font-bold">{fees.invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Payments</p>
            <p className="text-2xl font-bold">{fees.payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoices</CardTitle>
          <CardDescription>Read-only — managed from the Fees module.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {fees.invoices.length === 0 ? (
            <div className="p-6"><EmptyLine icon={<FileText className="h-4 w-4" aria-hidden />} text="No invoices generated for this student yet." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">{i.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">{i.periodLabel ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(i.issueDate)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(i.dueDate)}</TableCell>
                      <TableCell><StatusBadge status={i.status} /></TableCell>
                      <TableCell className="text-right text-sm">{rupees(i.total)}</TableCell>
                      <TableCell className="text-right text-sm">{rupees(i.paidTotal)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{rupees(i.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fees.payments.length === 0 ? (
            <div className="p-6"><EmptyLine icon={<ClipboardList className="h-4 w-4" aria-hidden />} text="No payments recorded yet." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{rupees(p.amount)}</TableCell>
                      <TableCell className="text-sm">{p.mode.replace('_', ' ')}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-sm">{p.referenceNumber ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{p.paidAt ? fmtDateTime(p.paidAt) : fmtDateTime(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
