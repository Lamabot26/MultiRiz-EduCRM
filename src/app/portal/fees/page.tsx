import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { getParentStudentIds, getOwnStudentId } from '@/lib/access';
import { getSchoolSettings } from '@/lib/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { INVOICE_STATUS_LABELS } from '@/lib/constants';
import { PayButton } from '@/components/portal/pay-button';
import { Download, Receipt } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Fees & Payments' };

export default async function PortalFeesPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const school = await db.school.findFirst();
  const settings = await getSchoolSettings();

  let studentIds: string[] = [];
  if (user.roles.includes('PARENT')) studentIds = await getParentStudentIds(user.id);
  else if (user.roles.includes('STUDENT')) {
    const own = await getOwnStudentId(user.id);
    if (own) studentIds = [own];
  }

  // URL student param is verified against the parent's own children (IDOR-safe)
  const selectedId = params.student && studentIds.includes(params.student) ? params.student : studentIds[0];
  if (!school || studentIds.length === 0) {
    return <p className="p-6 text-center text-muted-foreground">No student records linked to your account. Please contact the school office.</p>;
  }

  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    include: { classRoom: true },
  });
  const selected = students.find((s) => s.id === selectedId) ?? students[0];

  const [invoices, receipts] = await Promise.all([
    db.invoice.findMany({
      where: { studentId: selected.id, status: { not: 'CANCELLED' } },
      orderBy: [{ dueDate: 'asc' }, { issueDate: 'asc' }],
    }),
    db.receipt.findMany({
      where: { studentId: selected.id },
      include: { payment: true },
      orderBy: { issuedAt: 'desc' }, take: 30,
    }),
  ]);

  const totalDue = invoices.reduce((s, i) => s + i.balance, 0);

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PAID: 'text-success bg-success/10', PARTIALLY_PAID: 'bg-warning/15 text-warning',
      OVERDUE: 'bg-destructive/10 text-destructive', ISSUED: 'bg-primary/10 text-primary', DRAFT: 'bg-muted',
    };
    return <Badge className={cls[s] ?? ''}>{INVOICE_STATUS_LABELS[s] ?? s}</Badge>;
  };

  return (
    <div className="space-y-6">
      {students.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {students.map((s) => (
            <Link key={s.id} href={`/portal/fees?student=${s.id}`}>
              <Badge variant={s.id === selected.id ? 'default' : 'outline'} className="cursor-pointer px-3 py-1.5">
                {s.firstName} {s.lastName ?? ''}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <Card className="sp-card-shadow">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">{selected.firstName} {selected.lastName ?? ''} — {selected.classRoom?.name ?? ''}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalDue > 0 ? <>Outstanding balance: <span className="font-semibold text-destructive">{rupees(totalDue)}</span></> : 'All fees are fully paid. Thank you!'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Period</TableHead><TableHead>Due date</TableHead>
                  <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.periodLabel ?? '—'}</TableCell>
                    <TableCell className="text-sm">{inv.dueDate ? fmtDate(inv.dueDate) : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(inv.total + inv.lateFeeTotal - inv.discountTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(inv.paidTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{rupees(inv.balance)}</TableCell>
                    <TableCell>{statusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right">
                      {inv.balance > 0 && user.roles.includes('PARENT') && (
                        <PayButton invoiceId={inv.id} invoiceNumber={inv.invoiceNumber} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No invoices yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{settings.feePolicyNote}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead><TableHead>Date</TableHead><TableHead>Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.receiptNumber}{r.isDuplicate ? <Badge variant="outline" className="ml-2">duplicate</Badge> : null}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(r.issuedAt)}</TableCell>
                    <TableCell className="text-sm">{r.payment.mode}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(r.amount)}</TableCell>
                    <TableCell>
                      <a href={`/api/fees/payments/${r.paymentId}/receipt`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
                {receipts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No receipts yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
