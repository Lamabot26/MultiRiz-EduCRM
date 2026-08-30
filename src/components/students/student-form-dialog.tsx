'use client';

// =====================================================================
// Student create / edit dialog — used by the students list page (create)
// and the student detail overview tab (edit).
// Classes + sections are fetched once from GET /api/classes on open.
// =====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import {
  GENDERS, GENDER_LABELS, RELATIONSHIPS, RELATIONSHIP_LABELS,
  STUDENT_STATUSES, STUDENT_STATUS_LABELS,
} from '@/lib/constants';

/** Empty string → null (tiny local helper). */
const orNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

export type ClassOption = { id: string; name: string; level: number; sections: { id: string; name: string }[] };

export type StudentFormValues = {
  id?: string;
  admissionNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  religion?: string | null;
  admissionDate?: Date | string | null;
  classId?: string | null;
  sectionId?: string | null;
  rollNumber?: string | null;
  house?: string | null;
  transportRoute?: string | null;
  hostelStatus?: string | null;
  previousSchool?: string | null;
  status?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentFormValues | null;
  onSaved?: () => void;
};

function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function StudentFormDialog({ open, onOpenChange, student, onSaved }: Props) {
  const isEdit = Boolean(student?.id);
  const { toast } = useToast();
  const [classesState, setClassesState] = useState<{ rows: ClassOption[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    admissionNumber: '', firstName: '', middleName: '', lastName: '',
    dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian', religion: '',
    admissionDate: '', classId: '', sectionId: '', rollNumber: '',
    house: '', transportRoute: '', hostelStatus: '', previousSchool: '', status: 'ACTIVE',
    // optional initial guardian (create only)
    guardianName: '', guardianRelationship: 'FATHER', guardianMobile: '', guardianEmail: '', guardianOccupation: '',
  });
  const [withGuardian, setWithGuardian] = useState(true);

  const set = useCallback((k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  useEffect(() => {
    if (!open || classesState) return;
    let cancelled = false;
    apiFetch<ClassOption[]>('/api/classes')
      .then((env) => { if (!cancelled) setClassesState({ rows: env.data ?? [] }); })
      .catch(() => { if (!cancelled) setClassesState({ rows: [] }); });
    return () => { cancelled = true; };
  }, [open, classesState]);

  useEffect(() => {
    if (!open) return;
    const s = student ?? null;
    setForm({
      admissionNumber: s?.admissionNumber ?? '',
      firstName: s?.firstName ?? '',
      middleName: s?.middleName ?? '',
      lastName: s?.lastName ?? '',
      dateOfBirth: toInputDate(s?.dateOfBirth),
      gender: s?.gender ?? '',
      bloodGroup: s?.bloodGroup ?? '',
      nationality: s?.nationality ?? 'Indian',
      religion: s?.religion ?? '',
      admissionDate: toInputDate(s?.admissionDate ?? new Date()),
      classId: s?.classId ?? '',
      sectionId: s?.sectionId ?? '',
      rollNumber: s?.rollNumber ?? '',
      house: s?.house ?? '',
      transportRoute: s?.transportRoute ?? '',
      hostelStatus: s?.hostelStatus ?? '',
      previousSchool: s?.previousSchool ?? '',
      status: s?.status ?? 'ACTIVE',
      guardianName: '', guardianRelationship: 'FATHER', guardianMobile: '', guardianEmail: '', guardianOccupation: '',
    });
    setWithGuardian(true);
  }, [open, student]);

  const classes = classesState?.rows ?? [];
  const classesLoading = open && classesState === null;
  const sections = useMemo(
    () => classes.find((c) => c.id === form.classId)?.sections ?? [],
    [classes, form.classId],
  );

  const submit = async () => {
    if (!form.firstName.trim()) {
      toast({ title: 'First name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        middleName: orNull(form.middleName),
        lastName: orNull(form.lastName),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        bloodGroup: orNull(form.bloodGroup),
        nationality: orNull(form.nationality),
        religion: orNull(form.religion),
        admissionDate: form.admissionDate || null,
        classId: form.classId || null,
        sectionId: form.sectionId || null,
        rollNumber: orNull(form.rollNumber),
        house: orNull(form.house),
        transportRoute: orNull(form.transportRoute),
        hostelStatus: orNull(form.hostelStatus),
        previousSchool: orNull(form.previousSchool),
      };
      if (isEdit) {
        payload.status = form.status;
        await apiFetch(`/api/students/${student!.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast({ title: 'Student updated', description: `${form.firstName}'s profile was saved.` });
      } else {
        if (form.admissionNumber.trim()) payload.admissionNumber = form.admissionNumber.trim();
        payload.status = form.status;
        if (withGuardian && form.guardianName.trim() && form.guardianMobile.trim()) {
          payload.guardian = {
            fullName: form.guardianName.trim(),
            relationship: form.guardianRelationship,
            mobile: form.guardianMobile.trim(),
            email: orNull(form.guardianEmail),
            occupation: orNull(form.guardianOccupation),
          };
        }
        const env = await apiFetch<{ id: string; admissionNumber?: string }>('/api/students', {
          method: 'POST', body: JSON.stringify(payload),
        });
        const assigned = env.data?.admissionNumber ?? form.admissionNumber ?? 'auto';
        toast({
          title: 'Student admitted',
          description: `Admission number ${assigned} was assigned.`,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({
        title: isEdit ? 'Update failed' : 'Could not create student',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add Student'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the student record. Status changes are recorded in status history.'
              : 'Admission number is generated automatically (SPIS/{YY}/{seq}) if left blank.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="sf-adm">Admission Number</Label>
              <Input id="sf-adm" placeholder="Auto: SPIS/25/0001" value={form.admissionNumber} onChange={(e) => set('admissionNumber', e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="sf-first">First Name *</Label>
            <Input id="sf-first" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-mid">Middle Name</Label>
            <Input id="sf-mid" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-last">Last Name</Label>
            <Input id="sf-last" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-dob">Date of Birth</Label>
            <Input id="sf-dob" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
              <SelectTrigger aria-label="Gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-blood">Blood Group</Label>
            <Input id="sf-blood" placeholder="O+" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-nat">Nationality</Label>
            <Input id="sf-nat" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-rel">Religion</Label>
            <Input id="sf-rel" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-admd">Admission Date</Label>
            <Input id="sf-admd" type="date" value={form.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STUDENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STUDENT_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={form.classId} onValueChange={(v) => { set('classId', v); set('sectionId', ''); }}>
              <SelectTrigger aria-label="Class"><SelectValue placeholder={classesLoading ? 'Loading…' : 'Select class'} /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={form.sectionId} onValueChange={(v) => set('sectionId', v)} disabled={!form.classId}>
              <SelectTrigger aria-label="Section"><SelectValue placeholder={form.classId ? 'Select section' : 'Pick class first'} /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-roll">Roll Number</Label>
            <Input id="sf-roll" value={form.rollNumber} onChange={(e) => set('rollNumber', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-house">House</Label>
            <Input id="sf-house" placeholder="e.g. Ashoka" value={form.house} onChange={(e) => set('house', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-trans">Transport Route</Label>
            <Input id="sf-trans" value={form.transportRoute} onChange={(e) => set('transportRoute', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-hostel">Hostel Status</Label>
            <Input id="sf-hostel" placeholder="Day scholar / Hostel" value={form.hostelStatus} onChange={(e) => set('hostelStatus', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sf-prev">Previous School</Label>
            <Input id="sf-prev" value={form.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
          </div>
        </div>

        {!isEdit && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Initial Guardian (optional)</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setWithGuardian((v) => !v)}>
                  {withGuardian ? 'Remove' : 'Add guardian'}
                </Button>
              </div>
              {withGuardian && (
                <div className="grid gap-4 sm:grid-cols-2 mt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-gname">Guardian Full Name</Label>
                    <Input id="sf-gname" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relationship</Label>
                    <Select value={form.guardianRelationship} onValueChange={(v) => set('guardianRelationship', v)}>
                      <SelectTrigger aria-label="Relationship"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{RELATIONSHIP_LABELS[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-gmob">Mobile</Label>
                    <Input id="sf-gmob" placeholder="10-digit mobile" inputMode="numeric" value={form.guardianMobile} onChange={(e) => set('guardianMobile', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-gemail">Email</Label>
                    <Input id="sf-gemail" type="email" value={form.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sf-gocc">Occupation</Label>
                    <Input id="sf-gocc" value={form.guardianOccupation} onChange={(e) => set('guardianOccupation', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {isEdit ? 'Save changes' : 'Create student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
