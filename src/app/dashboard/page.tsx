import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users, UserPlus, CheckCircle2, FileWarning, IndianRupee, CalendarClock,
  AlertTriangle, ArrowRight, Phone, Mail, MessageCircle, StickyNote, MapPin,
  GitBranch, History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { requireUser, isStaff, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS, can } from '@/lib/rbac';
import { db } from '@/lib/db';
import { rupees } from '@/lib/money';
import { fmtDate, fmtDateTime, startOfDay, endOfDay, startOfMonth, addDays } from '@/lib/date-utils';
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from '@/lib/constants';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_MODE_LABELS } from '@/lib/constants';

export const metadata = { title: 'Dashboard' };

function MetricCard({
  title, value, sub, icon: Icon,
}: {
  title: string; value: string; sub?: string; icon: LucideIcon;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p>
          {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  NOTE: StickyNote, CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle,
  VISIT: MapPin, STATUS_CHANGE: GitBranch, STAGE_MOVE: GitBranch,
};

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!isStaff(user)) redirect('/portal');

  const sp = await searchParams;
  const denied = sp.denied === '1';

  const canReadAllLeads = hasPermission(user, PERMISSIONS.LEADS_READ_ALL);
  const canSeeAssignedLeads = can(user.roles, PERMISSIONS.LEADS_READ_ASSIGNED);
  const canReadAudit = hasPermission(user, PERMISSIONS.AUDIT_READ);

  // ---------- Metrics (all guarded: a failure degrades to zero, never 500s) ----------
  const school = await db.school.findFirst().catch(() => null);
  const schoolId = school?.id ?? '';

  let activeStudents = 0;
  let newLeads30d = 0;
  let confirmedAdmissions = 0;
  let pendingDocs = 0;
  let todayCollection = 0;
  let monthCollection = 0;
  let outstanding = 0;
  let defaulterCount = 0;
  let defaulterSum = 0;
  let recentPayments: {
    id: string; amount: number; mode: string; paidAt: Date | null;
    student: { firstName: string; lastName: string | null; admissionNumber: string } | null;
  }[] = [];
  let upcomingFollowups: {
    id: string; dueDate: Date; note: string | null;
    lead: { id: string; leadNumber: string; studentName: string } | null;
  }[] = [];
  let recentAudit: {
    id: string; action: string; entityType: string; entityId: string | null;
    userRole: string | null; createdAt: Date;
  }[] = [];
  let myPipeline: { status: string; count: number }[] = [];

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = addDays(now, -30);
    const weekEnd = endOfDay(addDays(now, 7));
    const leadScope = canReadAllLeads
      ? { schoolId }
      : canSeeAssignedLeads
        ? { schoolId, OR: [{ assignedTo: user.id }, { createdById: user.id }] }
        : { schoolId, assignedTo: user.id };

    const [students, leads30, confirmed, docs, payToday, payMonth, invOutstanding, defaulters, payments, followups, audit, pipeline] =
      await Promise.all([
        db.student.count({ where: { schoolId, status: 'ACTIVE', deletedAt: null } }),
        db.admissionLead.count({ where: { ...leadScope, createdAt: { gte: thirtyDaysAgo } } }),
        db.admissionLead.count({ where: { schoolId, status: 'ADMISSION_CONFIRMED' } }),
        db.applicationDocument.count({
          where: { isVerified: false, application: { schoolId } },
        }),
        db.payment.aggregate({
          _sum: { amount: true },
          where: { schoolId, status: 'CONFIRMED', paidAt: { gte: todayStart, lte: todayEnd } },
        }),
        db.payment.aggregate({
          _sum: { amount: true },
          where: { schoolId, status: 'CONFIRMED', paidAt: { gte: monthStart, lte: todayEnd } },
        }),
        db.invoice.aggregate({
          _sum: { balance: true },
          where: { schoolId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] }, balance: { gt: 0 } },
        }),
        db.invoice.aggregate({
          _count: true,
          _sum: { balance: true },
          where: {
            schoolId, status: { in: ['OVERDUE', 'PARTIALLY_PAID'] },
            dueDate: { lt: todayStart }, balance: { gt: 0 },
          },
        }),
        db.payment.findMany({
          where: { schoolId, status: 'CONFIRMED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, amount: true, mode: true, paidAt: true,
            student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          },
        }),
        db.leadFollowup.findMany({
          where: { status: 'PENDING', dueDate: { gte: todayStart, lte: weekEnd }, lead: leadScope },
          orderBy: { dueDate: 'asc' },
          take: 8,
          select: {
            id: true, dueDate: true, note: true,
            lead: { select: { id: true, leadNumber: true, studentName: true } },
          },
        }),
        canReadAudit
          ? db.auditLog.findMany({
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true, action: true, entityType: true, entityId: true,
                userRole: true, createdAt: true,
              },
            })
          : Promise.resolve([]),
        canReadAllLeads || canSeeAssignedLeads
          ? db.admissionLead.groupBy({
              by: ['status'],
              where: { schoolId, assignedTo: user.id },
              _count: true,
            })
          : Promise.resolve([]),
      ]);

    activeStudents = students;
    newLeads30d = leads30;
    confirmedAdmissions = confirmed;
    pendingDocs = docs;
    todayCollection = payToday._sum.amount ?? 0;
    monthCollection = payMonth._sum.amount ?? 0;
    outstanding = invOutstanding._sum.balance ?? 0;
    defaulterCount = defaulters._count;
    defaulterSum = defaulters._sum.balance ?? 0;
    recentPayments = payments;
    upcomingFollowups = followups;
    recentAudit = audit;
    myPipeline = pipeline
      .map((p) => ({ status: p.status, count: p._count }))
      .sort(
        (a, b) =>
          LEAD_STATUSES.indexOf(a.status as (typeof LEAD_STATUSES)[number]) -
          LEAD_STATUSES.indexOf(b.status as (typeof LEAD_STATUSES)[number]),
      );
  } catch {
    // metrics stay at defaults — dashboard still renders
  }

  const isCounsellor = can(user.roles, PERMISSIONS.LEADS_WRITE) || canSeeAssignedLeads;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Role-aware overview of admissions, students and fee health."
      />

      {denied ? (
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view that page. If you believe this is a mistake, contact the school administrator.
          </AlertDescription>
        </Alert>
      ) : null}

      {!school ? (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            School record is not configured yet. Metrics will appear once initial setup (Settings) is complete.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active Students" value={String(activeStudents)} icon={Users} sub="Currently enrolled" />
        <MetricCard title="New Leads (30 days)" value={String(newLeads30d)} icon={UserPlus} sub="Admission enquiries" />
        <MetricCard title="Admissions Confirmed" value={String(confirmedAdmissions)} icon={CheckCircle2} sub="All sessions" />
        <MetricCard title="Pending Documents" value={String(pendingDocs)} icon={FileWarning} sub="Unverified application docs" />
        <MetricCard title="Today's Collection" value={rupees(todayCollection)} icon={IndianRupee} sub={fmtDate(new Date())} />
        <MetricCard title="Monthly Collection" value={rupees(monthCollection)} icon={CalendarClock} sub={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
        <MetricCard title="Outstanding Amount" value={rupees(outstanding)} icon={IndianRupee} sub="Unpaid invoice balances" />
        <MetricCard
          title="Defaulters"
          value={String(defaulterCount)}
          icon={AlertTriangle}
          sub={`${rupees(defaulterSum)} overdue balance`}
        />
      </div>

      {/* Counsellor pipeline */}
      {isCounsellor && myPipeline.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">My Pipeline</CardTitle>
            <CardDescription>Leads currently assigned to you, by stage.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {myPipeline.map((p) => (
              <Badge key={p.status} variant="outline" className="px-3 py-1.5 text-xs">
                {LEAD_STATUS_LABELS[p.status] ?? p.status}
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">{p.count}</span>
              </Badge>
            ))}
            {myPipeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned leads yet.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Recent payments + upcoming follow-ups */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
            <CardDescription>Last 5 confirmed fee payments.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <IndianRupee className="h-4 w-4" /> No payments recorded yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentPayments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.student ? `${p.student.firstName} ${p.student.lastName ?? ''}`.trim() : 'Student'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.student?.admissionNumber ?? '—'} · {PAYMENT_MODE_LABELS[p.mode] ?? p.mode} · {fmtDateTime(p.paidAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{rupees(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
            <CardDescription>Next 7 days — open follow-up tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingFollowups.length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" /> No follow-ups due in the next 7 days.
              </p>
            ) : (
              <ul className="divide-y">
                {upcomingFollowups.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      {f.lead ? (
                        <Link href={`/dashboard/leads/${f.lead.id}`} className="truncate text-sm font-medium hover:underline">
                          {f.lead.studentName} <span className="text-xs text-muted-foreground">({f.lead.leadNumber})</span>
                        </Link>
                      ) : (
                        <span className="text-sm">Lead removed</span>
                      )}
                      {f.note ? <p className="truncate text-xs text-muted-foreground">{f.note}</p> : null}
                    </div>
                    <Badge variant="outline" className="shrink-0">{fmtDate(f.dueDate)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit trail (audit.read only) */}
      {canReadAudit ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Audit Activity</CardTitle>
            <CardDescription>Last 5 sensitive actions across the ERP.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <History className="h-4 w-4" /> No audit entries yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentAudit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium font-mono">{a.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.entityType}{a.entityId ? ` · ${a.entityId.slice(0, 8)}…` : ''} · {a.userRole ?? 'system'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/audit-logs"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all audit logs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
