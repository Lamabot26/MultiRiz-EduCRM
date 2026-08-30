'use client';

// =====================================================================
// Students list filter bar — search box + class/section/status selects.
// Updates ?query params via router.push (server component re-renders).
// =====================================================================

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS } from '@/lib/constants';
import type { ClassOption } from '@/components/students/student-form-dialog';

type Props = {
  classes: ClassOption[];
  statusOptions?: string[];
};

export function StudentsFilters({ classes, statusOptions }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  const classId = sp.get('classId') ?? '';
  const sectionId = sp.get('sectionId') ?? '';
  const status = sp.get('status') ?? '';
  const sections = classes.find((c) => c.id === classId)?.sections ?? [];

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page'); // any filter change resets pagination
    router.push(`/dashboard/students?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end" role="search" aria-label="Student filters">
      <form
        className="flex-1 min-w-[200px]"
        onSubmit={(e) => { e.preventDefault(); push({ q }); }}
      >
        <Label htmlFor="students-q" className="sr-only">Search students</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            id="students-q"
            className="pl-8"
            placeholder="Search name, admission #, or guardian mobile…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <Select
          value={classId}
          onValueChange={(v) => push({ classId: v, sectionId: '' })}
        >
          <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter by class">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sectionId} onValueChange={(v) => push({ sectionId: v })} disabled={!classId}>
          <SelectTrigger className="w-full sm:w-[120px]" aria-label="Filter by section">
            <SelectValue placeholder="All sections" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => push({ status: v })}>
          <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {(statusOptions ?? STUDENT_STATUSES).map((s) => (
              <SelectItem key={s} value={s}>{STUDENT_STATUS_LABELS[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear filters"
          onClick={() => { setQ(''); router.push('/dashboard/students'); }}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
