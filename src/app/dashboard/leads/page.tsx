import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { db } from '@/lib/db';
import { LEAD_STATUSES as STATUSES, LEAD_SOURCE_LABELS, CLOSED_LEAD_STATUSES } from '@/lib/constants';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { LeadsFilters, ImportCsvButton, ExportCsvLink } from '@/components/leads/leads-filters';
import { LeadsTable, type LeadRow } from '@/components/leads/leads-table';
import { KanbanBoard, KanbanEmpty, type KanbanLead } from '@/components/leads/kanban-board';

export const metadata: Metadata = { title: 'Admission Leads' };

const PAGE_SIZE = 25;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === 'string' && v !== '' ? v : undefined);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const canAccess = canAny(user.roles, [
    PERMISSIONS.LEADS_READ_ALL,
    PERMISSIONS.LEADS_READ_ASSIGNED,
    PERMISSIONS.LEADS_WRITE,
  ]);
  if (!canAccess) redirect('/dashboard?denied=1');

  const canReadAll = hasPermission(user, PERMISSIONS.LEADS_READ_ALL);
  const canAssign = hasPermission(user, PERMISSIONS.LEADS_ASSIGN);
  const canImportExport = hasPermission(user, PERMISSIONS.LEADS_IMPORT_EXPORT);

  const sp = await searchParams;
  const q = one(sp.q);
  const status = one(sp.status);
  const source = one(sp.source);
  const priority = one(sp.priority);
  const assignedTo = one(sp.assignedTo);
  const view = one(sp.view) === 'kanban' ? 'kanban' : 'table';
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);

  const school = await db.school.findFirst();
  if (!school) {
    return (
      <div>
        <PageHeader title="Admission Leads" description="Capture and nurture admission enquiries." />
        <Card className="p-6"><p className="text-sm text-muted-foreground">School is not configured yet.</p></Card>
      </div>
    );
  }

  // FRONT_DESK (and similar) see only leads they created or are assigned;
  // leads.read.all sees everything.
  const scope = canReadAll
    ? { schoolId: school.id }
    : { schoolId: school.id, OR: [{ assignedTo: user.id }, { createdById: user.id }] };

  const baseWhere: Record<string, unknown> = {
    ...scope,
    ...(status ? { status } : {}),
    ...(source ? { leadSource: { name: source } } : {}),
    ...(priority ? { priority } : {}),
    ...(assignedTo ? { assignedTo } : {}),
    ...(q
      ? {
          OR: [
            { studentName: { contains: q } },
            { guardianName: { contains: q } },
            { mobile: { contains: q } },
            { email: { contains: q } },
            { leadNumber: { contains: q } },
          ],
        }
      : {}),
  };

  // Stats per pipeline stage (respecting filters except status)
  const statsWhere = { ...baseWhere };
  delete (statsWhere as Record<string, unknown>).status;

  const [total, leads, statRows, sources, sessions, counsellors] = await Promise.all([
    db.admissionLead.count({ where: baseWhere }),
    db.admissionLead.findMany({
      where: baseWhere,
      orderBy: { lastActivityAt: 'desc' },
      skip: view === 'table' ? (page - 1) * PAGE_SIZE : 0,
      take: view === 'table' ? PAGE_SIZE : 400,
      include: {
        leadSource: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    db.admissionLead.groupBy({ by: ['status'], where: statsWhere, _count: true }),
    db.leadSource.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { name: 'asc' } }),
    db.academicSession.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { startDate: 'desc' } }),
    db.user.findMany({
      where: {
        isActive: true,
        userRoles: { some: { role: { key: { in: ['ADMISSION_COUNSELLOR', 'FRONT_DESK'] } } } },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const statsByStatus: Record<string, number> = {};
  for (const row of statRows) statsByStatus[row.status] = row._count;
  const stage = (keys: string[]) => keys.reduce((acc, k) => acc + (statsByStatus[k] ?? 0), 0);

  const pipelineChips: { label: string; count: number }[] = [
    { label: 'New', count: stage(['NEW']) },
    { label: 'Contacted', count: stage(['CONTACTED']) },
    { label: 'Follow-up', count: stage(['FOLLOW_UP']) },
    { label: 'Visit', count: stage(['VISIT_SCHEDULED']) },
    { label: 'Application', count: stage(['APPLICATION_STARTED', 'DOCUMENTS_PENDING', 'APPLICATION_SUBMITTED']) },
    { label: 'Offer', count: stage(['ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'OFFER_MADE']) },
    { label: 'Confirmed', count: stage(['ADMISSION_CONFIRMED']) },
  ];

  const formOptions = {
    sources: sources.map((s) => ({ id: s.id, name: s.name })),
    sessions: sessions.map((s) => ({ id: s.id, name: s.name })),
    counsellors,
  };

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    leadNumber: l.leadNumber,
    studentName: l.studentName,
    classApplyingFor: l.classApplyingFor,
    guardianName: l.guardianName,
    mobile: l.mobile,
    email: l.email,
    sourceName: l.leadSource ? (LEAD_SOURCE_LABELS[l.leadSource.name] ?? l.leadSource.name) : null,
    assigneeName: l.assignee?.name ?? null,
    status: l.status,
    priority: l.priority,
    nextFollowUpDate: l.nextFollowUpDate ? l.nextFollowUpDate.toISOString() : null,
    lastActivityAt: l.lastActivityAt.toISOString(),
  }));

  const kanbanItems: KanbanLead[] = view === 'kanban'
    ? leads.map((l) => ({
        id: l.id,
        leadNumber: l.leadNumber,
        studentName: l.studentName,
        mobile: l.mobile,
        classApplyingFor: l.classApplyingFor,
        status: l.status,
        priority: l.priority,
        assigneeName: l.assignee?.name ?? null,
      }))
    : [];

  // Preserve filters in pagination/export links
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (status) qs.set('status', status);
  if (source) qs.set('source', source);
  if (priority) qs.set('priority', priority);
  if (assignedTo) qs.set('assignedTo', assignedTo);
  if (view === 'kanban') qs.set('view', 'kanban');
  const qsExport = new URLSearchParams(qs);
  const exportHref = `/api/admissions/leads/export${qsExport.toString() ? `?${qsExport.toString()}` : ''}`;
  const pageLink = (p: number) => {
    const next = new URLSearchParams(qs);
    next.set('page', String(p));
    return `/dashboard/leads?${next.toString()}`;
  };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openStatuses = STATUSES.filter((s) => !CLOSED_LEAD_STATUSES.includes(s));
  const openCount = stage([...openStatuses]);
  const closedCount = stage(CLOSED_LEAD_STATUSES);

  return (
    <div>
      <PageHeader
        title="Admission Leads"
        description={`${openCount} open · ${closedCount} closed — capture, nurture and convert enquiries.`}
        actions={
          <>
            <LeadFormDialog options={formOptions} canAssign={canAssign || canReadAll} />
            {canImportExport ? <ImportCsvButton /> : null}
            {canImportExport ? <ExportCsvLink href={exportHref} /> : null}
            {canImportExport ? (
              <Button variant="ghost" asChild>
                <a href="/api/admissions/leads/import?template=1" download>
                  <FileUp className="mr-2 h-4 w-4" /> Template
                </a>
              </Button>
            ) : null}
          </>
        }
      />

      {/* Pipeline stats strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {pipelineChips.map((chip) => (
          <Card key={chip.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{chip.label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{chip.count}</p>
          </Card>
        ))}
      </div>

      <LeadsFilters counsellors={counsellors} showCounsellorFilter={canReadAll} />

      <Card className="p-6">
        {view === 'kanban' ? (
          kanbanItems.length === 0 ? <KanbanEmpty /> : <KanbanBoard initial={kanbanItems} />
        ) : (
          <LeadsTable rows={rows} counsellors={counsellors} canAssign={canAssign} />
        )}
      </Card>

      {view === 'table' && total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageLink(page - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Link>
              </Button>
            ) : null}
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageLink(page + 1)}>Next <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
