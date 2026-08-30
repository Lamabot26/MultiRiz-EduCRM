import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { fmtDate, fmtDateTime } from '@/lib/date-utils';
import { INVOICE_STATUS_LABELS, CONCESSION_TYPE_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';
import { RecordPaymentDialog, ConcessionRequestDialog, ConcessionDecisionButtons, DuplicateReceiptButton } from '@/components/fees/fee-actions';
import { FileText, Download } from 'lucide-react';

export const metadata = { title: 'Invoice Detail' };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission('fees.payments.read');
  const school = await db.school.findFirst();
  if (!school) notFound();

  const invoice = await db.invoice.findFirst({
    where: { id, schoolId: school.id },
    include: {
      student: { include: { classRoom: true, section: true } },
      items: { include: { feeComponent: true }, orderBy: { id: 'asc' } },
      payments: { include: { allocations: true, receipts: true, receiver: true }, orderBy: { createdAt: 'desc' } },
      receipts: { orderBy: { issuedAt: 'desc' } },
      concessions: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!invoice) notFound();

  const canCollect = hasPermission(user, PERMISSIONS.FEES_PAYMENTS_OFFLINE);
  const canRequestConcession = hasPermission(user, PERMISSIONS.FEES_CONCESSION_REQUEST);
  const canApproveConcession = hasPermission(user, PERMISSIONS.FEES_CONCESSION_APPROVE);
  const payable = invoice.total + invoice.lateFeeTotal - invoice.discountTotal - invoice.paidTotal;

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PAID: 'text-success bg-success/10', PARTIALLY_PAID: 'bg-warning/15 text-warning',
      OVERDUE: 'bg-destructive/10 text-destructive', ISSUED: 'bg-primary/10 text-primary',
      CANCELLED: 'bg-muted text-muted-foreground', DRAFT: 'bg-muted text-muted-foreground',
    };
    return <Badge className={cls[s] ?? ''}>{INVOICE_STATUS_LABELS[s] ?? s}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${invoice.student.firstName} ${invoice.student.lastName ?? ''} · ${invoice.student.admissionNumber} · ${invoice.student.classRoom?.name ?? ''} ${invoice.student.section ? '- ' + invoice.student.section.name : ''}`}
        actions={
          <>
            <Button variant="outline" asChild><a href={`/api/fees/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer"><Download className="h-4 w-4 mr-2" /> Invoice PDF</a></Button>
            {canRequestConcession && invoice.balance > 0 && <ConcessionRequestDialog studentId={invoice.studentId} invoiceId={invoice.id} />}
            {canCollect && invoice.balance > 0 && <RecordPaymentDialog studentId={invoice.studentId} invoiceId={invoice.id} balancePaise={payable} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Invoice items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoice.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{it.periodLabel ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(it.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Summary {statusBadge(invoice.status)}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{rupees(invoice.subtotal)}</span></div>
            {invoice.lateFeeTotal > 0 && <div className="flex justify-between text-destructive"><span>Late fee</span><span className="tabular-nums">{rupees(invoice.lateFeeTotal)}</span></div>}
            {invoice.discountTotal > 0 && <div className="flex justify-between text-success"><span>Concessions</span><span className="tabular-nums">−{rupees(invoice.discountTotal)}</span></div>}
            <div className="flex justify-between font-semibold border-t pt-2"><span>Total payable</span><span className="tabular-nums">{rupees(invoice.total + invoice.lateFeeTotal - invoice.discountTotal)}</span></div>
            <div className="flex justify-between text-success"><span>Paid</span><span className="tabular-nums">{rupees(invoice.paidTotal)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2 text-lg"><span>Balance</span><span className="tabular-nums">{rupees(invoice.balance)}</span></div>
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <p>Issued: {fmtDate(invoice.issueDate)}</p>
              <p>Due: {invoice.dueDate ? fmtDate(invoice.dueDate) : '—'}</p>
              <p>Period: {invoice.periodLabel ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Payments ({invoice.payments.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Receipt</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoice.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{fmtDateTime(p.paidAt ?? p.createdAt)}</TableCell>
                      <TableCell>{PAYMENT_MODE_LABELS[p.mode] ?? p.mode}</TableCell>
                      <TableCell className="text-sm">{p.referenceNumber ?? p.gatewayPaymentId ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{rupees(p.amount)}</TableCell>
                      <TableCell><Badge variant={p.status === 'CONFIRMED' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                      <TableCell>
                        {p.receipts[0] && (
                          <div className="flex items-center gap-1">
                            <a href={`/api/fees/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">{p.receipts[0].receiptNumber}</a>
                            {canCollect && <DuplicateReceiptButton paymentId={p.id} receiptNumber={p.receipts[0].receiptNumber} />}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoice.payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No payments recorded yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Concessions ({invoice.concessions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {invoice.concessions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{CONCESSION_TYPE_LABELS[c.type] ?? c.type} {c.percent ? `— ${c.percent}%` : c.amount ? `— ${rupees(c.amount)}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{c.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">Status: {c.status}{c.approvedAt ? ` · ${fmtDateTime(c.approvedAt)}` : ''}</p>
                </div>
                {c.status === 'PENDING' && canApproveConcession && <ConcessionDecisionButtons concessionId={c.id} />}
              </div>
            ))}
            {invoice.concessions.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No concessions on this invoice.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
