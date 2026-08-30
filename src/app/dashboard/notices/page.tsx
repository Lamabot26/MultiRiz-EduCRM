import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { NoticesManager } from '@/components/notices/notices-manager';

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.NOTICES_MANAGE)) redirect('/dashboard?denied=1');

  const [notices, events] = await Promise.all([
    db.notice.findMany({
      orderBy: [{ isPublished: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    }),
    db.event.findMany({ orderBy: { startsAt: 'desc' }, take: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notices & Events</h1>
        <p className="text-sm text-muted-foreground">
          Publish announcements and school events to the website audience.
        </p>
      </div>
      <NoticesManager notices={notices} events={events} />
    </div>
  );
}
