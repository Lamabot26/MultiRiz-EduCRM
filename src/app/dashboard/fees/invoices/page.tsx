import Link from 'next/link';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-guard';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { INVOICE_STATUS_LABELS } from '@/lib/constants';
import { GenerateInvoicesDialog } from '@/components/fees/generate-invoices-dialog';
import { LateFeeButton } from '@/components/fees/late-fee-button';
import { Wallet, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';

export const metadata = { title: 'Fee Invoices' };

const PAGE_SIZE = 25;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; class?: string; page?: string }>;
}) {
  const params = await searchParams;
  const user = await requirePermission('fees.payments.read');
  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-muted-foreground">School not configured.</p>;

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const where = {
    schoolId: school.id,
    ...(params.status ? { status: params.status } : {}),
    ...(params.class ? { student: { classId: params.class } } : {}),
    ...(params.q ? { OR: [
      { invoiceNumber: { contains: params.q } },
      { student: { firstName: { contains: params.q } } },
      { student: { lastName: { contains: params.q } } },
      { student: { admissionNumber: { contains: params.q } } },
    ] } : {}),
  };

  const [invoices, total, classes, structures, agg] = await Promise.all([
    db.invoice.findMany({
      where, include: { student: { include: { classRoom: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    }),
    db.invoice.count({ where }),
    db.classRoom.findMany({ where: { schoolId: school.id, isActive: true }, include: { sections: true }, orderBy: { level: 'asc' } }),
    db.feeStructure.findMany({ where: { schoolId: school.id, status: 'ACTIVE' }, include: { classRoom: true, academicSession: true } }),
    db.invoice.aggregate({ where: { schoolId: school.id, status: { not: 'CANCELLED' } }, _sum: { total: true, paidTotal: true, balance: true } }),
  ]);

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PAID: 'text-success bg-success/10', PARTIALLY_PAID: 'bg-warning/15 text-warning',
      OVERDUE: 'bg-destructive/10 text-destructive', ISSUED: 'bg-primary/10 text-primary',
      CANCELLED: 'bg-muted text-muted-foreground', DRAFT: 'bg-muted text-muted-foreground',
    };
    return <Badge className={cls[s] ?? ''}>{INVOICE_STATUS_LABELS[s] ?? s}</Badge>;
  };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Fee Invoices"
        description="Generate, track and collect fee invoices. Payments are allocated to the oldest outstanding invoice first."
        actions={<GenerateInvoicesDialog structures={structures} classes={classes.map((c) => ({ id: c.id, name: c.name, sections: c.sections.map((s) => ({ id: s.id, name: s.name })) }))} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><IndianRupee className="h-8 w-8 text-primary/40" /><div><p className="text-xl font-bold tabular-nums">{rupees(agg._sum.total ?? 0)}</p><p className="text-xs text-muted-foreground">Total billed</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-success/60" /><div><p className="text-xl font-bold tabular-nums">{rupees(agg._sum.paidTotal ?? 0)}</p><p className="text-xs text-muted-foreground">Collected</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Wallet className="h-8 w-8 text-accent/60" /><div><p className="text-xl font-bold tabular-nums">{rupees(agg._sum.balance ?? 0)}</p><p className="text-xs text-muted-foreground">Outstanding</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive/60" /><div><p className="text-xl font-bold tabular-nums">{await db.invoice.count({ where: { schoolId: school.id, status: 'OVERDUE' } })}</p><p className="text-xs text-muted-foreground">Overdue invoices</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Invoices ({total})</CardTitle>
          <form className="flex flex-wrap gap-2" action="/dashboard/fees/invoices">
            <input name="q" defaultValue={params.q ?? ''} placeholder="Search invoice / student…" className="h-9 rounded-md border border-input bg-background px-3 text-sm w-52" />
            <select name="status" defaultValue={params.status ?? ''} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All statuses</option>
              {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select name="class" defaultValue={params.class ?? ''} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button type="submit" size="sm" variant="secondary">Filter</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link href={`/dashboard/fees/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.invoiceNumber}</Link>
                    </TableCell>
                    <TableCell>{inv.student.firstName} {inv.student.lastName ?? ''}</TableCell>
                    <TableCell>{inv.student.classRoom?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{inv.periodLabel ?? '—'}</TableCell>
                    <TableCell className="text-sm">{inv.dueDate ? fmtDate(inv.dueDate) : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(inv.total + inv.lateFeeTotal - inv.discountTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">{rupees(inv.paidTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{rupees(inv.balance)}</TableCell>
                    <TableCell>{statusBadge(inv.status)}</TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No invoices found{user ? '' : ''}. Use “Generate Invoices” to create them from a fee structure.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && <Link href={`?page=${page - 1}&q=${params.q ?? ''}&status=${params.status ?? ''}&class=${params.class ?? ''}`}><Button variant="outline" size="sm">Previous</Button></Link>}
                {page < totalPages && <Link href={`?page=${page + 1}&q=${params.q ?? ''}&status=${params.status ?? ''}&class=${params.class ?? ''}`}><Button variant="outline" size="sm">Next</Button></Link>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
