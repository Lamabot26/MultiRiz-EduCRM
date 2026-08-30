import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-guard';
import { hasPermission, getSessionUser } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportActions } from '@/components/fees/report-actions';
import { Megaphone, Users, GraduationCap, Receipt, FileBarChart, ShieldCheck, CalendarCheck, Wallet, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Reports' };

type ReportDef = { type: string; title: string; description: string; financial?: boolean };

const GROUPS: { title: string; icon: React.ReactNode; reports: ReportDef[] }[] = [
  {
    title: 'Admissions', icon: <Megaphone className="h-4 w-4" />,
    reports: [
      { type: 'leads', title: 'Admission Leads', description: 'All leads with source, counsellor, status and follow-up dates.' },
      { type: 'lead-sources', title: 'Lead Source Performance', description: 'Lead counts grouped by source and status.' },
      { type: 'counsellor-performance', title: 'Counsellor Performance', description: 'Lead pipeline grouped by assigned counsellor.' },
      { type: 'conversions', title: 'Admission Conversions', description: 'Applications, their lead origin and student conversion status.' },
    ],
  },
  {
    title: 'Students', icon: <GraduationCap className="h-4 w-4" />,
    reports: [
      { type: 'student-master', title: 'Student Master', description: 'Complete student directory with guardian contacts.' },
      { type: 'class-wise', title: 'Class-wise Strength', description: 'Active/inactive student counts per class & section.' },
      { type: 'approved-contacts', title: 'Approved Contacts', description: 'Authorised contacts per student with approval status (calling-system ready).' },
    ],
  },
  {
    title: 'Fees & Finance', icon: <Receipt className="h-4 w-4" />, 
    reports: [
      { type: 'fee-demand', title: 'Fee Demand Register', description: 'Invoices issued with totals, payments and balances.' , financial: true },
      { type: 'daily-collection', title: 'Daily Collection', description: 'Confirmed payments received (today or date range).', financial: true },
      { type: 'monthly-collection', title: 'Monthly Collection', description: 'Month-wise collection totals.', financial: true },
      { type: 'defaulters', title: 'Fee Defaulters', description: 'Outstanding invoices past due date with guardian mobiles.', financial: true },
      { type: 'invoices', title: 'Invoice Register', description: 'All invoices with status.', financial: true },
      { type: 'receipts', title: 'Receipt Register', description: 'All receipts incl. duplicates.', financial: true },
      { type: 'concessions', title: 'Concession Report', description: 'Requested and approved concessions.', financial: true },
      { type: 'refunds', title: 'Refund Report', description: 'Refund workflow status.', financial: true },
      { type: 'payment-modes', title: 'Payment Mode Breakdown', description: 'Collections grouped by payment mode.', financial: true },
    ],
  },
  {
    title: 'Attendance & System', icon: <ShieldCheck className="h-4 w-4" />,
    reports: [
      { type: 'attendance', title: 'Attendance Register', description: 'Daily attendance records per class & student.' },
      { type: 'audit-logs', title: 'Audit Log Report', description: 'Full audit trail (audit.read permission required).' },
    ],
  },
];

export default async function ReportsPage() {
  await requirePermission('reports.read');
  const user = await getSessionUser();
  const financial = user ? hasPermission(user, PERMISSIONS.REPORTS_FINANCIAL) : false;
  const classes = await db.classRoom.findMany({ where: { isActive: true }, orderBy: { level: 'asc' } });
  const sessions = await db.academicSession.findMany({ orderBy: { name: 'desc' } });

  return (
    <div>
      <PageHeader
        title="Reports & Exports"
        description="Every report supports date-range, session and class filters, CSV export and permission-controlled access. Exports are audited."
      />

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-end gap-4 print:hidden">
          <div className="space-y-1"><label className="text-xs text-muted-foreground">From</label><Input type="date" className="h-9 w-40" id="rep-from" /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">To</label><Input type="date" className="h-9 w-40" id="rep-to" /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Session</label>
            <select id="rep-session" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Class</label>
            <select id="rep-class" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">Tip: pick filters here, then use a report&apos;s CSV button — the current filters are applied via the page link. For exact filtering you can also append <code>?from=DD-MM-YYYY&amp;to=DD-MM-YYYY</code> directly.</p>
        </CardContent>
      </Card>

      {GROUPS.map((group) => (
        <div key={group.title} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-primary">{group.icon}</span>
            <h2 className="font-semibold">{group.title}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.reports.map((r) => {
              if (r.financial && !financial) return null;
              return (
                <Card key={r.type} className="sp-card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {r.financial ? <Wallet className="h-4 w-4 text-accent" /> : <FileBarChart className="h-4 w-4 text-primary" />}
                      {r.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3 min-h-8">{r.description}</p>
                    <ReportActions type={r.type} filters="" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Financial reports are hidden without the reports.financial permission.</p>
    </div>
  );
}
