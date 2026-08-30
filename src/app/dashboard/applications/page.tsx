import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Search, Inbox } from 'lucide-react';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS, can } from '@/lib/rbac';
import { db } from '@/lib/db';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { fmtDate } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ApplicationStatusBadge } from '@/components/leads/status-badge';
import { ApplicationFormDialog } from '@/components/applications/application-detail-actions';

export const metadata: Metadata = { title: 'Admission Applications' };

const PAGE_SIZE = 25;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === 'string' && v !== '' ? v : undefined);

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.APPLICATIONS_MANAGE)) redirect('/dashboard?denied=1');

  const sp = await searchParams;
  const statusRaw = one(sp.status);
  const status = statusRaw && statusRaw !== 'all' ? statusRaw : undefined;
  const q = one(sp.q);
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);

  const school = await db.school.findFirst();
  if (!school) {
    return (
      <div>
        <PageHeader title="Admission Applications" description="Track applications through review to enrolment." />
        <Card className="p-6"><p className="text-sm text-muted-foreground">School is not configured yet.</p></Card>
      </div>
    );
  }

  const where = {
    schoolId: school.id,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { studentName: { contains: q } },
            { applicationNumber: { contains: q } },
            { guardianName: { contains: q } },
            { mobile: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, apps, statRows, verifiedCounts, sessions] = await Promise.all([
    db.admissionApplication.count({ where }),
    db.admissionApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { documents: true } } },
    }),
    db.admissionApplication.groupBy({ by: ['status'], where: { schoolId: school.id }, _count: true }),
    db.applicationDocument.groupBy({
      by: ['applicationId'],
      where: { isVerified: true, application: { schoolId: school.id } },
      _count: true,
    }),
    db.academicSession.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { startDate: 'desc' } }),
  ]);

  const verifiedMap = new Map(verifiedCounts.map((v) => [v.applicationId, v._count]));
  const stats: Record<string, number> = {};
  for (const r of statRows) stats[r.status] = r._count;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    params.set('page', String(p));
    return `/dashboard/applications?${params.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Admission Applications"
        description="Track applications from submission through review, decision and enrolment."
        actions={<ApplicationFormDialog sessions={sessions.map((s) => ({ id: s.id, name: s.name }))} />}
      />

      {/* Stats by status */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {APPLICATION_STATUSES.map((s) => (
          <Link key={s} href={`/dashboard/applications?status=${s}`}>
            <Card className="p-4 transition-colors hover:bg-muted/40">
              <p className="text-xs font-medium text-muted-foreground">{APPLICATION_STATUS_LABELS[s]}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">{stats[s] ?? 0}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Filters — native GET form (works without client JS) */}
      <form action="/dashboard/applications" method="get" className="mb-4 flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search app #, student, guardian, mobile…" className="pl-8" aria-label="Search applications" />
        </div>
        <Select name="status" defaultValue={status ?? 'all'}>
          <SelectTrigger className="sm:w-[190px]" aria-label="Status filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary" className="sm:w-24">Apply</Button>
      </form>

      <Card className="p-6">
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">No applications found</p>
            <p className="text-xs text-muted-foreground">Create one manually or convert an admission lead.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => {
                  const verified = verifiedMap.get(a.id) ?? 0;
                  const totalDocs = a._count.documents;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40">
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        <Link href={`/dashboard/applications/${a.id}`} className="font-medium text-primary hover:underline">
                          {a.applicationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/applications/${a.id}`} className="font-medium hover:underline">
                          {a.studentName}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{a.classApplyingFor}</TableCell>
                      <TableCell className="text-sm">{a.guardianName}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{a.mobile}</TableCell>
                      <TableCell><ApplicationStatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        {totalDocs === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          <span className={`text-xs font-medium ${verified === totalDocs ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {verified}/{totalDocs} verified
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(a.submittedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageLink(page - 1)}>Previous</Link>
              </Button>
            ) : null}
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageLink(page + 1)}>Next</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
