import Link from 'next/link';
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
import { PAYMENT_MODE_LABELS } from '@/lib/constants';
import { RefundRequestDialog, RefundDecisionButtons } from '@/components/fees/refund-actions';

export const metadata = { title: 'Fee Refunds' };

export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const user = await requirePermission('fees.payments.read');
  const canRequest = hasPermission(user, PERMISSIONS.FEES_REFUND_REQUEST);
  const canApprove = hasPermission(user, PERMISSIONS.FEES_REFUND_APPROVE);
  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-muted-foreground">School not configured.</p>;

  const status = params.status ?? 'PENDING';
  const [items, refundablePayments] = await Promise.all([
    db.refund.findMany({
      where: { schoolId: school.id, ...(status !== 'ALL' ? { status } : {}) },
      include: { student: true, payment: true },
      orderBy: { createdAt: 'desc' }, take: 200,
    }),
    db.payment.findMany({
      where: { schoolId: school.id, status: 'CONFIRMED' },
      include: { student: true, refunds: { where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSED'] } } } },
      orderBy: { paidAt: 'desc' }, take: 300,
    }),
  ]);

  const refundable = refundablePayments
    .map((p) => ({ p, left: p.amount - p.refunds.reduce((s, r) => s + r.amount, 0) }))
    .filter((x) => x.left > 0)
    .map(({ p, left }) => ({
      id: p.id,
      label: `${p.student.firstName} ${p.student.lastName ?? ''} — ${PAYMENT_MODE_LABELS[p.mode] ?? p.mode} ${fmtDate(p.paidAt ?? p.createdAt)} (₹${(left / 100).toLocaleString('en-IN')})`,
      amount: left,
    }));

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PENDING: 'bg-warning/15 text-warning', APPROVED: 'bg-primary/10 text-primary',
      PROCESSED: 'text-success bg-success/10', REJECTED: 'bg-destructive/10 text-destructive',
    };
    return <Badge className={cls[s] ?? ''}>{s}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Fee Refunds"
        description="Request → approve → process. Processing marks the source payment REFUNDED (immutable transition). Fully audited."
        actions={canRequest ? <RefundRequestDialog payments={refundable} /> : undefined}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{status === 'ALL' ? 'All' : status} refunds ({items.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {['PENDING', 'APPROVED', 'PROCESSED', 'REJECTED', 'ALL'].map((s) => (
              <Link key={s} href={`?status=${s}`}><Button size="sm" variant={status === s ? 'default' : 'outline'}>{s}</Button></Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead><TableHead>Payment</TableHead><TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead><TableHead>Requested</TableHead>{canApprove && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.student.firstName} {r.student.lastName ?? ''}</TableCell>
                    <TableCell className="text-sm">{PAYMENT_MODE_LABELS[r.payment.mode] ?? r.payment.mode} · {rupees(r.payment.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(r.amount)}</TableCell>
                    <TableCell className="text-sm max-w-44 truncate">{r.reason}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-sm">{r.referenceNumber ?? '—'}</TableCell>
                    <TableCell className="text-sm">{fmtDate(r.createdAt)}</TableCell>
                    {canApprove && <TableCell><RefundDecisionButtons refundId={r.id} current={r.status} /></TableCell>}
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No refunds found for this filter.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
