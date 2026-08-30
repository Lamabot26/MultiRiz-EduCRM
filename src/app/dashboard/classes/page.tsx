import { redirect } from 'next/navigation';
import { GraduationCap, Plus, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { canAny, can, PERMISSIONS } from '@/lib/rbac';
import { fmtDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { AddSectionButton, CreateClassButton } from '@/components/classes/class-manager';
import { SessionCreateForm } from '@/components/classes/session-create-form';

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  const user = await requireUser();
  const canView = canAny(user.roles, [
    PERMISSIONS.CLASSES_MANAGE, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.STUDENTS_READ_ALL, PERMISSIONS.STUDENTS_READ_LIMITED,
  ]);
  if (!canView) redirect('/dashboard?denied=1');
  const canManage = can(user.roles, PERMISSIONS.CLASSES_MANAGE);
  const canSettings = can(user.roles, PERMISSIONS.SETTINGS_MANAGE);

  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-sm text-muted-foreground">School not configured.</p>;

  const [classes, sessions, sectionCounts] = await Promise.all([
    db.classRoom.findMany({
      where: { schoolId: school.id },
      orderBy: { level: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: { classTeacher: { select: { id: true, name: true } } },
        },
      },
    }),
    db.academicSession.findMany({ where: { schoolId: school.id }, orderBy: { startDate: 'desc' } }),
    db.student.groupBy({
      by: ['sectionId'],
      where: { schoolId: school.id, deletedAt: null, status: 'ACTIVE', sectionId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const strengthBySection = new Map(sectionCounts.map((c) => [c.sectionId as string, c._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes & Sections</h1>
          <p className="text-sm text-muted-foreground">
            Academic structure, section capacity and class teachers.
          </p>
        </div>
        {canManage && <CreateClassButton />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Class cards */}
        <div className="space-y-4 lg:col-span-2">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground/50" aria-hidden />
                <p className="text-sm font-medium">No classes defined</p>
                <p className="text-xs text-muted-foreground">
                  {canManage ? 'Create the first class to get started.' : 'Ask an administrator to define classes.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{c.name}</CardTitle>
                        <CardDescription>Level {c.level}{c.description ? ` · ${c.description}` : ''}</CardDescription>
                      </div>
                      {canManage && <AddSectionButton classId={c.id} className={c.name} />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {c.sections.length === 0 ? (
                      <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                        <Plus className="h-3.5 w-3.5" aria-hidden /> No sections yet.
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {c.sections.map((s) => {
                          const strength = strengthBySection.get(s.id) ?? 0;
                          const fill = s.capacity ? Math.min(100, Math.round((strength / s.capacity) * 100)) : null;
                          return (
                            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                              <div>
                                <p className="font-medium">{c.name} – {s.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {s.classTeacher ? `Class teacher: ${s.classTeacher.name}` : 'No class teacher assigned'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-right">
                                <Badge variant="secondary" className="gap-1">
                                  <Users className="h-3 w-3" aria-hidden />
                                  {strength}{s.capacity ? `/${s.capacity}` : ''}
                                </Badge>
                                {fill !== null && (
                                  <span
                                    className={`text-xs font-medium ${fill >= 100 ? 'text-destructive' : 'text-muted-foreground'}`}
                                    title="Capacity utilisation"
                                  >
                                    {fill}%
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Academic sessions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Academic Sessions</CardTitle>
              <CardDescription>The current session drives admissions, attendance and fees.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No sessions created yet.</p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</p>
                      </div>
                      {s.isCurrent
                        ? <StatusBadge status="ACTIVE" label="Current" />
                        : <StatusBadge status="INACTIVE" label="Past" />}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {canSettings && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">New session</CardTitle>
                <CardDescription>Only available with settings permission.</CardDescription>
              </CardHeader>
              <CardContent>
                <SessionCreateForm />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
