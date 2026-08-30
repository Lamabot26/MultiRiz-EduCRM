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
import { fmtDateTime, startOfDay, startOfMonth } from '@/lib/date-utils';
import { PAYMENT_MODE_LABELS } from '@/lib/constants';
import { RecordPaymentDialog } from '@/components/fees/fee-actions';
import { Download, Wallet, CalendarDays, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export const metadata = { title: 'Fee Collections' };

export default async function CollectionsPage() {
  const user = await requirePermission('fees.payments.read');
  const canCollect = hasPermission(user, PERMISSIONS.FEES_PAYMENTS_OFFLINE);
  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-muted-foreground">School not configured.</p>;

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const [todayAgg, monthAgg, overdueAgg, modeGroups, recent, chequePending] = await Promise.all([
    db.payment.aggregate({ where: { schoolId: school.id, status: 'CONFIRMED', paidAt: { gte: today } }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { schoolId: school.id, status: 'CONFIRMED', paidAt: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    db.invoice.aggregate({ where: { schoolId: school.id, status: 'OVERDUE' }, _sum: { balance: true }, _count: true }),
    db.payment.groupBy({ by: ['mode'], where: { schoolId: school.id, status: 'CONFIRMED', paidAt: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    db.payment.findMany({
      where: { schoolId: school.id },
      include: { student: true, receiver: true, receipts: true },
      orderBy: { createdAt: 'desc' }, take: 25,
    }),
    db.payment.count({ where: { schoolId: school.id, mode: 'CHEQUE', status: 'PENDING' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Fee Collections"
        description="Daily collection counter — record offline payments, track receipts and payment-mode mix."
        actions={
          <>
            <Button variant="outline" asChild><a href="/api/reports/daily-collection"><Download className="h-4 w-4 mr-2" /> Daily CSV</a></Button>
            {canCollect && <RecordPaymentDialog />}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><Wallet className="h-8 w-8 text-success/60" /><div><p className="text-xl font-bold tabular-nums">{rupees(todayAgg._sum.amount ?? 0)}</p><p className="text-xs text-muted-foreground">Today ({todayAgg._count} payments)</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CalendarDays className="h-8 w-8 text-primary/40" /><div><p className="text-xl font-bold tabular-nums">{rupees(monthAgg._sum.amount ?? 0)}</p><p className="text-xs text-muted-foreground">This month ({monthAgg._count})</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive/60" /><div><p className="text-xl font-bold tabular-nums">{rupees(overdueAgg._sum.balance ?? 0)}</p><p className="text-xs text-muted-foreground">Overdue ({overdueAgg._count} invoices)</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FileSpreadsheet className="h-8 w-8 text-accent/60" /><div><p className="text-xl font-bold tabular-nums">{chequePending}</p><p className="text-xs text-muted-foreground">Cheques pending</p></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent payments</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDateTime(p.paidAt ?? p.createdAt)}</TableCell>
                      <TableCell>{p.student.firstName} {p.student.lastName ?? ''}</TableCell>
                      <TableCell>{PAYMENT_MODE_LABELS[p.mode] ?? p.mode}</TableCell>
                      <TableCell className="text-sm">{p.referenceNumber ?? p.gatewayPaymentId ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{rupees(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'CONFIRMED' ? 'default' : p.status === 'REFUNDED' ? 'destructive' : 'secondary'}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.receipts[0] ? (
                          <a href={`/api/fees/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">{p.receipts[0].receiptNumber}</a>
                        ) : <Link href="/dashboard/fees/invoices" className="text-xs text-muted-foreground">—</Link>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recent.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payments recorded yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">This month by mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {modeGroups.map((g) => (
              <div key={g.mode}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{PAYMENT_MODE_LABELS[g.mode] ?? g.mode} ({g._count})</span>
                  <span className="tabular-nums font-medium">{rupees(g._sum.amount ?? 0)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: `${monthAgg._sum.amount ? Math.round(((g._sum.amount ?? 0) / monthAgg._sum.amount) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
            {modeGroups.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No collections this month.</p>}
            <Button variant="outline" className="w-full mt-2" asChild><a href="/api/reports/payment-modes">Mode breakdown CSV</a></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
