import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-guard';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { CONCESSION_TYPE_LABELS } from '@/lib/constants';
import { ConcessionRequestDialog, ConcessionDecisionButtons } from '@/components/fees/fee-actions';
import Link from 'next/link';

export const metadata = { title: 'Fee Concessions' };

export default async function ConcessionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const user = await requirePermission('fees.payments.read');
  const canRequest = hasPermission(user, PERMISSIONS.FEES_CONCESSION_REQUEST);
  const canApprove = hasPermission(user, PERMISSIONS.FEES_CONCESSION_APPROVE);
  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-muted-foreground">School not configured.</p>;

  const status = params.status ?? 'PENDING';
  const [items, students] = await Promise.all([
    db.concession.findMany({
      where: { schoolId: school.id, ...(status !== 'ALL' ? { status } : {}) },
      include: { student: true, invoice: true },
      orderBy: { createdAt: 'desc' }, take: 200,
    }),
    db.student.findMany({
      where: { schoolId: school.id, status: 'ACTIVE', deletedAt: null },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      orderBy: { firstName: 'asc' }, take: 500,
    }),
  ]);

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PENDING: 'bg-warning/15 text-warning', APPROVED: 'text-success bg-success/10',
      APPLIED: 'text-success bg-success/10', REJECTED: 'bg-destructive/10 text-destructive',
    };
    return <Badge className={cls[s] ?? ''}>{s}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Fee Concessions"
        description="Scholarships, sibling discounts and waivers. Accountants request; Principal / Super Admin approve. Fully audited."
        actions={canRequest ? <ConcessionRequestDialog studentId={students[0]?.id ?? ''} /> : undefined}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{status === 'ALL' ? 'All' : status} concessions ({items.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
              <Link key={s} href={`?status=${s}`}><Button size="sm" variant={status === s ? 'default' : 'outline'}>{s === 'APPROVED' ? 'Approved/Applied' : s}</Button></Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead><TableHead>Invoice</TableHead><TableHead>Type</TableHead>
                  <TableHead className="text-right">Value</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead>{canApprove && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.student.firstName} {c.student.lastName ?? ''}</TableCell>
                    <TableCell>{c.invoice ? <Link className="text-primary hover:underline" href={`/dashboard/fees/invoices/${c.invoiceId}`}>{c.invoice.invoiceNumber}</Link> : '—'}</TableCell>
                    <TableCell>{CONCESSION_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.percent ? `${c.percent}%` : c.amount ? rupees(c.amount) : '—'}</TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{c.reason}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.createdAt)}</TableCell>
                    {canApprove && <TableCell>{c.status === 'PENDING' && <ConcessionDecisionButtons concessionId={c.id} />}</TableCell>}
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No concessions found for this filter.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
