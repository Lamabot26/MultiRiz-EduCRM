import { redirect } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AttendanceSelectors, AttendanceMarker, type RosterStudent, type WeeklySummary,
} from '@/components/attendance/attendance-marker';

export const dynamic = 'force-dynamic';

const SESSION_TYPE = 'FULL_DAY';

type SP = { classId?: string; sectionId?: string; date?: string };

function parseDateOnly(s: string | null): Date {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') ? s! : new Date().toISOString().slice(0, 10);
  return new Date(`${iso}T00:00:00.000Z`);
}

function lastNSchoolDays(n: number, endDate: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(endDate.getTime());
  while (days.length < n) {
    if (cursor.getUTCDay() !== 0) days.push(new Date(cursor.getTime()));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

export default async function AttendancePage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const canMark = hasPermission(user, PERMISSIONS.ATTENDANCE_MARK);
  const canRead = hasPermission(user, PERMISSIONS.ATTENDANCE_READ);
  if (!canMark && !canRead) redirect('/dashboard?denied=1');

  const sp = await searchParams;
  const date = parseDateOnly(sp.date ?? null);
  const dateIso = date.toISOString().slice(0, 10);
  const classId = sp.classId ?? '';
  const sectionId = sp.sectionId ?? '';

  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-sm text-muted-foreground">School not configured.</p>;

  const [classes, currentSession] = await Promise.all([
    db.classRoom.findMany({
      where: { schoolId: school.id },
      orderBy: { level: 'asc' },
      include: { sections: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    }),
    db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } }),
  ]);

  const roster: RosterStudent[] = classId
    ? await db.student.findMany({
        where: {
          schoolId: school.id,
          deletedAt: null,
          status: 'ACTIVE',
          classId,
          ...(sectionId ? { sectionId } : {}),
          OR: [
            ...(currentSession
              ? [{
                  classAssignments: {
                    some: {
                      classId,
                      ...(sectionId ? { sectionId } : {}),
                      academicSessionId: currentSession.id,
                      isActive: true,
                    },
                  },
                }]
              : []),
            { classId, ...(sectionId ? { sectionId } : {}) },
          ],
        },
        select: {
          id: true, admissionNumber: true, firstName: true, middleName: true,
          lastName: true, rollNumber: true, photoUrl: true,
        },
        orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
        take: 200,
      })
    : [];

  const session = classId
    ? await db.attendanceSession.findFirst({
        where: {
          schoolId: school.id, classId, sectionId: sectionId || null, date, sessionType: SESSION_TYPE,
        },
        include: { records: true },
      })
    : null;
  const existing: Record<string, string> = {};
  if (session) for (const r of session.records) existing[r.studentId] = r.status;

  // Weekly summary — last 7 school days per class average % present.
  const weekDays = lastNSchoolDays(7, date);
  const weekSessions = await db.attendanceSession.findMany({
    where: { schoolId: school.id, date: { gte: weekDays[weekDays.length - 1], lte: date } },
    include: { records: { select: { status: true } } },
  });
  const perClass = new Map<string, { present: number; total: number }>();
  for (const s of weekSessions) {
    const agg = perClass.get(s.classId) ?? { present: 0, total: 0 };
    for (const r of s.records) {
      if (r.status === 'HOLIDAY') continue;
      agg.total += 1;
      if (r.status === 'PRESENT') agg.present += 1;
    }
    perClass.set(s.classId, agg);
  }
  const classNames = new Map(classes.map((c) => [c.id, c.name]));
  const weeklySummary: WeeklySummary[] = [...perClass.entries()]
    .map(([cid, agg]) => ({
      classId: cid,
      className: classNames.get(cid) ?? 'Unknown',
      percentPresent: agg.total ? Math.round((agg.present / agg.total) * 100) : null,
      records: agg.total,
    }))
    .sort((a, b) => a.className.localeCompare(b.className));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {canMark
            ? 'Mark the daily register — each submission is audited with per-status counts.'
            : 'View-only register and weekly summary.'}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <AttendanceSelectors classes={classes} classId={classId} sectionId={sectionId} date={dateIso} />
        </CardContent>
      </Card>

      <AttendanceMarker
        roster={roster}
        existing={existing}
        markedAt={session?.markedAt ?? null}
        canMark={canMark}
        classId={classId}
        sectionId={sectionId}
        date={dateIso}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" aria-hidden /> Last 7 school days
          </CardTitle>
          <CardDescription>Average present % per class (Sundays excluded).</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklySummary.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No attendance recorded in this window yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {weeklySummary.map((w) => (
                <li key={w.classId} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{w.className}</p>
                  <p className="text-xl font-bold text-success">{w.percentPresent ?? '—'}{w.percentPresent !== null ? '%' : ''}</p>
                  <p className="text-xs text-muted-foreground">{w.records} records</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
