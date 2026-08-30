import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/date-utils';
import { CalendarDays, Megaphone } from 'lucide-react';

export const metadata = { title: 'Notices & Events' };

export default async function PortalNoticesPage() {
  const user = await requireUser();
  const school = await db.school.findFirst();
  const isStudent = user.roles.includes('STUDENT');
  const audiences = isStudent ? ['PUBLIC', 'STUDENTS', 'ALL'] : ['PUBLIC', 'PARENTS', 'ALL'];

  const [notices, events] = school
    ? await Promise.all([
        db.notice.findMany({
          where: { schoolId: school.id, isPublished: true, audience: { in: audiences } },
          orderBy: { publishedAt: 'desc' }, take: 30,
        }),
        db.event.findMany({
          where: { schoolId: school.id, isPublished: true, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' }, take: 15,
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Notices & Events</h1>
        <p className="text-sm text-muted-foreground">Official communication from {school?.name ?? 'the school'}.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" /> Notices</h2>
        {notices.map((n) => (
          <Card key={n.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <h3 className="font-medium">{n.title}</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary">{n.category}</Badge>
                  <span className="text-xs text-muted-foreground self-center">{n.publishedAt ? fmtDate(n.publishedAt) : ''}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{n.content}</p>
              {n.attachmentUrl && (
                <a href={n.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Download attachment{n.attachmentName ? `: ${n.attachmentName}` : ''}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices right now.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Upcoming events</h2>
        {events.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                {e.location && <p className="text-xs text-muted-foreground mt-1">Location: {e.location}</p>}
              </div>
              <Badge variant="outline" className="shrink-0">{e.startsAt ? fmtDate(e.startsAt) : ''}</Badge>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
      </section>
    </div>
  );
}
