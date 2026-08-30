import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, getSessionUser } from '@/lib/auth-guard';
import { getParentStudentIds, getOwnStudentId } from '@/lib/access';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { Wallet, CalendarCheck, Bell, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Portal Home' };

export default async function PortalHome() {
  const user = await requireUser();
  const school = await db.school.findFirst();

  let studentIds: string[] = [];
  if (user.roles.includes('PARENT')) studentIds = await getParentStudentIds(user.id);
  else if (user.roles.includes('STUDENT')) {
    const own = await getOwnStudentId(user.id);
    if (own) studentIds = [own];
  }

  const students = studentIds.length
    ? await db.student.findMany({
        where: { id: { in: studentIds }, deletedAt: null },
        include: { classRoom: true, section: true, invoices: { where: { status: { notIn: ['CANCELLED'] } } } },
      })
    : [];

  const notices = school
    ? await db.notice.findMany({
        where: { schoolId: school.id, isPublished: true, audience: { in: user.roles.includes('STUDENT') ? ['PUBLIC', 'STUDENTS', 'ALL'] : ['PUBLIC', 'PARENTS', 'ALL'] } },
        orderBy: { publishedAt: 'desc' }, take: 4,
      })
    : [];

  // attendance % this month per student (best-effort)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const attendanceByStudent = new Map<string, { present: number; total: number }>();
  if (studentIds.length) {
    const records = await db.attendanceRecord.findMany({
      where: { studentId: { in: studentIds }, attendanceSession: { date: { gte: monthStart } } },
      select: { studentId: true, status: true },
    });
    for (const r of records) {
      const agg = attendanceByStudent.get(r.studentId) ?? { present: 0, total: 0 };
      agg.total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') agg.present++;
      attendanceByStudent.set(r.studentId, agg);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Your children&apos;s fees, attendance and school updates — all in one place.</p>
      </div>

      {students.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No student records are linked to your account yet. Please contact the school office.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {students.map((s) => {
          const outstanding = s.invoices.reduce((sum, i) => sum + i.balance, 0);
          const att = attendanceByStudent.get(s.id);
          const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
          return (
            <Card key={s.id} className="sp-card-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {s.firstName.slice(0, 1)}{s.lastName?.slice(0, 1) ?? ''}
                    </div>
                    <div>
                      <p className="font-semibold">{s.firstName} {s.lastName ?? ''}</p>
                      <p className="text-xs text-muted-foreground">{s.admissionNumber} · {s.classRoom?.name ?? '—'} {s.section ? `- ${s.section.name}` : ''}</p>
                    </div>
                  </div>
                  <Badge variant={outstanding > 0 ? 'destructive' : 'default'} className="shrink-0">
                    {outstanding > 0 ? `${rupees(outstanding)} due` : 'Fees clear'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg border p-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-accent" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="font-semibold text-sm tabular-nums truncate">{rupees(outstanding)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance (month)</p>
                      <p className="font-semibold text-sm">{attPct !== null ? `${attPct}%` : '—'}</p>
                    </div>
                  </div>
                </div>
                <Button asChild className="w-full mt-4" variant={outstanding > 0 ? 'default' : 'outline'}>
                  <Link href={`/portal/fees?student=${s.id}`}>View fees & pay {outstanding > 0 ? <ArrowRight className="h-4 w-4 ml-1" /> : null}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-accent" /> Latest notices</h2>
          <Link href="/portal/notices" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {notices.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex justify-between gap-3 items-start">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content.slice(0, 140)}…</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{n.publishedAt ? fmtDate(n.publishedAt) : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices right now.</p>}
        </div>
      </div>
    </div>
  );
}
