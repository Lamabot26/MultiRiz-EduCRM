'use client';

// =====================================================================
// Attendance island — filter selectors (class / section / date) and the
// roster marking table. Markers pick PRESENT/ABSENT/LATE/LEAVE per
// student and submit to POST /api/attendance (upsert + audited).
// Read-only users see the roster without radios.
// =====================================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { fmtDate } from '@/lib/date-utils';

export type ClassRow = { id: string; name: string; level: number; sections: { id: string; name: string }[] };
export type RosterStudent = {
  id: string; admissionNumber: string; firstName: string; middleName: string | null;
  lastName: string | null; rollNumber: string | null; photoUrl: string | null;
};
export type WeeklySummary = { classId: string; className: string; percentPresent: number | null; records: number };

type Props = {
  classes: ClassRow[];
  roster: RosterStudent[];
  existing: Record<string, string>; // studentId → status
  markedAt: Date | null;
  canMark: boolean;
  classId: string;
  sectionId: string;
  date: string; // ISO yyyy-mm-dd
  weeklySummary: WeeklySummary[];
};

export function AttendanceSelectors({ classes, classId, sectionId, date }: Pick<Props, 'classes' | 'classId' | 'sectionId' | 'date'>) {
  const router = useRouter();
  const sections = classes.find((c) => c.id === classId)?.sections ?? [];

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams({ date });
    if (classId) params.set('classId', classId);
    if (sectionId) params.set('sectionId', sectionId);
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/dashboard/attendance?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="search" aria-label="Attendance filters">
      <div className="space-y-1.5">
        <Label>Class</Label>
        <Select value={classId} onValueChange={(v) => push({ classId: v, sectionId: '' })}>
          <SelectTrigger aria-label="Select class"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Section</Label>
        <Select value={sectionId} onValueChange={(v) => push({ sectionId: v })} disabled={!classId}>
          <SelectTrigger aria-label="Select section"><SelectValue placeholder="All sections" /></SelectTrigger>
          <SelectContent>
            {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="att-date">Date</Label>
        <div className="flex items-center gap-2">
          <Input
            id="att-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => e.target.value && push({ date: e.target.value })}
          />
          <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(date)}</span>
        </div>
      </div>
    </div>
  );
}

export function AttendanceMarker({ roster, existing, markedAt, canMark, classId, sectionId, date }: Pick<Props, 'roster' | 'existing' | 'markedAt' | 'canMark' | 'classId' | 'sectionId' | 'date'>) {
  const router = useRouter();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { ...existing };
    for (const s of roster) if (!init[s.id]) init[s.id] = 'PRESENT';
    return init;
  });
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, HOLIDAY: 0 };
    for (const s of roster) {
      const v = statuses[s.id];
      if (v) counts[v] = (counts[v] ?? 0) + 1;
    }
    return counts;
  }, [roster, statuses]);

  const submit = async () => {
    if (!classId) {
      toast({ title: 'Select a class first', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const env = await apiFetch<{ counts: Record<string, number>; total: number }>('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          sectionId: sectionId || null,
          date,
          records: roster.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? 'PRESENT' })),
        }),
      });
      const res = env.data ?? { counts: {}, total: 0 };
      toast({
        title: 'Attendance saved',
        description: `${res.total} students · ${res.counts.PRESENT ?? 0} present, ${res.counts.ABSENT ?? 0} absent.`,
      });
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not save attendance', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!classId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarCheck className="h-10 w-10 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium">Select a class to view the roster</p>
          <p className="text-xs text-muted-foreground">Pick a class (and optionally a section) above.</p>
        </CardContent>
      </Card>
    );
  }

  if (roster.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarCheck className="h-10 w-10 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium">No active students found for this class-section</p>
          <p className="text-xs text-muted-foreground">Assign students to the class or adjust the filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Roster ({roster.length})</CardTitle>
            <CardDescription>
              {markedAt ? `Last marked ${fmtDate(markedAt)}` : 'Not marked for this date yet.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Present {summary.PRESENT}
            </span>
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              Absent {summary.ABSENT}
            </span>
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
              Late {summary.LATE}
            </span>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Leave {summary.LEAVE}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>{canMark ? 'Mark' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((s) => {
                const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {s.photoUrl && <AvatarImage src={s.photoUrl} alt={`${name} photo`} />}
                          <AvatarFallback className="text-xs font-semibold">
                            {(s.firstName?.charAt(0) ?? 'S')}{(s.lastName?.charAt(0) ?? '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{s.admissionNumber}</TableCell>
                    <TableCell className="text-sm">{s.rollNumber ?? '—'}</TableCell>
                    <TableCell>
                      {canMark ? (
                        <RadioGroup
                          value={statuses[s.id] ?? 'PRESENT'}
                          onValueChange={(v) => setStatuses((p) => ({ ...p, [s.id]: v }))}
                          className="flex flex-wrap gap-x-4 gap-y-1"
                          aria-label={`Attendance for ${name}`}
                        >
                          {ATTENDANCE_STATUSES.filter((st) => st !== 'HOLIDAY').map((st) => (
                            <label key={st} className="flex cursor-pointer items-center gap-1.5 text-sm">
                              <RadioGroupItem value={st} aria-label={ATTENDANCE_STATUS_LABELS[st]} />
                              {ATTENDANCE_STATUS_LABELS[st]}
                            </label>
                          ))}
                        </RadioGroup>
                      ) : (
                        <StatusBadge status={statuses[s.id]} label={ATTENDANCE_STATUS_LABELS[statuses[s.id]] ?? statuses[s.id]} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {canMark && (
          <div className="flex items-center justify-end gap-3 border-t p-4">
            <p className="text-xs text-muted-foreground">Saving re-marks the whole day and is audited.</p>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Mark Attendance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
