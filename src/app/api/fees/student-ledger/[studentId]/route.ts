import { db } from '@/lib/db';
import { withApi, ok, fail, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { canAccessStudentFees } from '@/lib/access';

// GET /api/fees/student-ledger/[studentId] — chronological ledger.
export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const allowed = canAny(user.roles, [PERMISSIONS.FEES_LEDGER_READ, PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.REPORTS_FINANCIAL]);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const studentId = parts[parts.indexOf('student-ledger') + 1] ?? '';

    if (!allowed && !(await canAccessStudentFees(user, studentId))) {
      return fail('You do not have permission to view this ledger', 403);
    }
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId: school.id, deletedAt: null },
      include: { classRoom: true, section: true },
    });
    if (!student) throw new ApiError('Student not found', 404);

    const [invoices, payments, receipts, concessions, refunds] = await Promise.all([
      db.invoice.findMany({ where: { studentId }, orderBy: { issueDate: 'asc' } }),
      db.payment.findMany({ where: { studentId }, orderBy: { paidAt: 'asc' }, include: { allocations: { include: { invoice: true } } } }),
      db.receipt.findMany({ where: { studentId }, orderBy: { issuedAt: 'asc' } }),
      db.concession.findMany({ where: { studentId }, orderBy: { createdAt: 'asc' } }),
      db.refund.findMany({ where: { studentId }, orderBy: { createdAt: 'asc' } }),
    ]);

    type LedgerRow = { date: Date; type: string; ref: string; description: string; debit: number; credit: number; link?: string };
    const rows: LedgerRow[] = [];
    for (const inv of invoices) {
      rows.push({ date: inv.issueDate, type: 'INVOICE', ref: inv.invoiceNumber, description: inv.periodLabel ?? 'Fee invoice', debit: inv.total + inv.lateFeeTotal - inv.discountTotal, credit: 0, link: `/dashboard/fees/invoices/${inv.id}` });
    }
    for (const p of payments) {
      if (p.status === 'CONFIRMED') {
        rows.push({ date: p.paidAt ?? p.createdAt, type: 'PAYMENT', ref: p.referenceNumber ?? p.id.slice(0, 8), description: `Payment (${p.mode})`, debit: 0, credit: p.amount });
      }
      if (p.status === 'REFUNDED') {
        rows.push({ date: p.paidAt ?? p.createdAt, type: 'PAYMENT', ref: p.referenceNumber ?? p.id.slice(0, 8), description: `Payment (${p.mode}) — later refunded`, debit: 0, credit: p.amount });
      }
    }
    for (const c of concessions.filter((x) => ['APPROVED', 'APPLIED'].includes(x.status))) {
      rows.push({ date: c.createdAt, type: 'CONCESSION', ref: c.id.slice(0, 8), description: `Concession (${c.type}) — ${c.reason}`, debit: 0, credit: c.amount ?? 0 });
    }
    for (const r of refunds.filter((x) => x.status === 'PROCESSED')) {
      rows.push({ date: r.processedAt ?? r.createdAt, type: 'REFUND', ref: r.referenceNumber ?? r.id.slice(0, 8), description: `Refund — ${r.reason}`, debit: r.amount, credit: 0 });
    }
    rows.sort((a, b) => a.date.getTime() - b.date.getTime());
    let running = 0;
    const ledger = rows.map((r) => {
      running += r.debit - r.credit;
      return { ...r, balance: running };
    });
    return ok({ student: { id: student.id, name: `${student.firstName} ${student.lastName ?? ''}`, admissionNumber: student.admissionNumber, class: student.classRoom?.name, section: student.section?.name }, ledger });
  },
  { permission: PERMISSIONS.PORTAL_ACCESS }, // fine-grained check inside
);
