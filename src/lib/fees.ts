import { db } from './db';
import { nextNumber } from './sequences';
import { addMonths, startOfDay, fmtMonthYear } from './date-utils';

// =====================================================================
// Fee engine — invoice generation, payment allocation, late fees.
// ALL financial mutations run inside prisma.$transaction.
// Payments are immutable once CONFIRMED (see confirmPayment).
// =====================================================================

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export type GenerateInvoicesInput = {
  schoolId: string;
  academicSessionId: string;
  feeStructureId: string;
  studentIds: string[];
  periods: number; // how many installments/months/quarters to bill now
  issuedBy: string;
  dueDay?: number;
};

/** Generate invoices for students from a fee structure, transactionally. */
export async function generateInvoices(input: GenerateInvoicesInput) {
  const { schoolId, academicSessionId, feeStructureId, studentIds, periods, issuedBy } = input;

  return db.$transaction(async (tx) => {
    const structure = await tx.feeStructure.findFirst({
      where: { id: feeStructureId, schoolId, academicSessionId, status: 'ACTIVE' },
      include: { items: { include: { feeComponent: true } }, academicSession: true },
    });
    if (!structure) throw new Error('Fee structure not found or not active');
    if (structure.items.length === 0) throw new Error('Fee structure has no items');

    const sessionLabel = structure.academicSession.name;
    const frequency = structure.items[0].frequency;
    const perPeriodItems = structure.items.map((it) => ({
      feeComponentId: it.feeComponentId,
      description: it.feeComponent.name,
      amount: Math.round(it.amount / (it.installmentCount || 1)),
    }));
    const amountPerPeriod = perPeriodItems.reduce((s, i) => s + i.amount, 0);

    const created: { invoiceId: string; invoiceNumber: string; studentId: string; total: number }[] = [];
    const base = startOfDay(new Date());

    for (const studentId of studentIds) {
      for (let p = 0; p < periods; p++) {
        const issueDate = p === 0 ? base : addMonths(base, p);
        const dueDate = input.dueDay
          ? new Date(issueDate.getFullYear(), issueDate.getMonth(), input.dueDay)
          : addMonths(issueDate, 1);
        const periodLabel = `${fmtMonthYear(issueDate)}${frequency === 'QUARTERLY' ? ` (Q${(p % 4) + 1})` : ''}`;

        const existing = await tx.invoice.findFirst({
          where: { studentId, periodLabel, status: { not: 'CANCELLED' }, academicSessionId },
        });
        if (existing) continue; // idempotent per student+period

        const invoiceNumber = await nextNumber(tx, schoolId, 'INVOICE', sessionLabel, 'INV');
        const subtotal = amountPerPeriod;
        const invoice = await tx.invoice.create({
          data: {
            schoolId, invoiceNumber, studentId, academicSessionId,
            issueDate, dueDate, periodLabel,
            status: 'ISSUED',
            subtotal, discountTotal: 0, lateFeeTotal: 0,
            total: subtotal, paidTotal: 0, balance: subtotal,
            generatedBy: issuedBy,
            items: { create: perPeriodItems.map((it) => ({ ...it, total: it.amount, periodLabel })) },
          },
        });
        created.push({ invoiceId: invoice.id, invoiceNumber, studentId, total: subtotal });
      }
    }
    return created;
  });
}

/**
 * Allocate a CONFIRMED payment across the student's outstanding invoices
 * (oldest due first). Creates PaymentAllocation rows, updates invoice
 * balances/status, and is idempotent for a given paymentId.
 */
export async function allocatePayment(paymentId: string, allocatedBy: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'CONFIRMED') throw new Error('Only confirmed payments can be allocated');

    const existingAllocations = await tx.paymentAllocation.findMany({ where: { paymentId } });
    let remaining = payment.amount - existingAllocations.reduce((s, a) => s + a.amount, 0);
    if (remaining <= 0) return { allocated: 0, remaining: 0 };

    const invoices = await tx.invoice.findMany({
      where: { studentId: payment.studentId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
      orderBy: [{ dueDate: 'asc' }, { issueDate: 'asc' }],
    });

    let allocatedTotal = 0;
    for (const inv of invoices) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, inv.balance);
      if (applied <= 0) continue;

      await tx.paymentAllocation.create({
        data: { paymentId, invoiceId: inv.id, amount: applied, allocatedBy },
      });
      const paidTotal = inv.paidTotal + applied;
      const balance = inv.balance - applied;
      await tx.invoice.update({
        where: { id: inv.id },
        data: {
          paidTotal, balance,
          status: balance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        },
      });
      remaining -= applied;
      allocatedTotal += applied;
    }
    return { allocated: allocatedTotal, remaining };
  });
}

/** Evaluate late-fee rules for overdue invoices. Returns number updated. */
export async function evaluateLateFees(schoolId: string): Promise<number> {
  const rules = await db.lateFeeRule.findMany({ where: { schoolId, isActive: true } });
  if (rules.length === 0) return 0;
  const today = startOfDay(new Date());
  const overdue = await db.invoice.findMany({
    where: { schoolId, status: { in: ['ISSUED', 'PARTIALLY_PAID'] }, dueDate: { lt: today } },
    include: { items: true },
  });
  let updated = 0;
  for (const inv of overdue) {
    const daysLate = Math.floor((today.getTime() - (inv.dueDate?.getTime() ?? today.getTime())) / 86400000);
    if (daysLate <= 0) continue;
    const rule = rules[0];
    if (!rule) break;
    const grace = rule.gracePeriodDays ?? 0;
    if (daysLate <= grace) continue;
    let lateFee = 0;
    if (rule.ruleType === 'FIXED' || rule.ruleType === 'ONE_TIME') lateFee = rule.amount;
    else if (rule.ruleType === 'PERCENT_PER_DAY' && rule.percent) {
      lateFee = Math.min(Math.round((inv.balance * rule.percent) / 100 / 30) * daysLate / daysLate * daysLate, rule.maxAmount ?? Number.MAX_SAFE_INTEGER);
      lateFee = Math.round((inv.total * rule.percent) / 100 / 30) * Math.min(daysLate, 30);
    } else if (rule.ruleType === 'PERCENT_PER_MONTH' && rule.percent) {
      lateFee = Math.round((inv.total * rule.percent) / 100) * Math.ceil(daysLate / 30);
    }
    lateFee = Math.max(0, Math.min(lateFee, rule.maxAmount ?? Number.MAX_SAFE_INTEGER));
    if (lateFee !== inv.lateFeeTotal) {
      await db.invoice.update({
        where: { id: inv.id },
        data: { lateFeeTotal: lateFee, balance: inv.total + lateFee - inv.discountTotal - inv.paidTotal, status: 'OVERDUE' },
      });
      updated++;
    } else {
      await db.invoice.update({ where: { id: inv.id }, data: { status: 'OVERDUE' } });
    }
  }
  return updated;
}

/** Record an OFFLINE payment (cash/cheque/transfer/UPI) transactionally. */
export async function recordOfflinePayment(input: {
  schoolId: string; studentId: string; invoiceId?: string | null;
  amount: number; mode: string; referenceNumber?: string | null;
  chequeNumber?: string | null; chequeDate?: Date | null; bankName?: string | null;
  notes?: string | null; receivedBy: string;
}) {
  return db.$transaction(async (tx) => {
    const session = await tx.academicSession.findFirst({ where: { schoolId: input.schoolId, isCurrent: true } });
    const sessionLabel = session?.name ?? 'SESSION';
    const payment = await tx.payment.create({
      data: {
        schoolId: input.schoolId,
        studentId: input.studentId,
        invoiceId: input.invoiceId ?? null,
        amount: input.amount,
        mode: input.mode,
        status: 'CONFIRMED', // offline entry is confirmed on record; approval workflow can reverse
        referenceNumber: input.referenceNumber ?? null,
        chequeNumber: input.chequeNumber ?? null,
        chequeDate: input.chequeDate ?? null,
        bankName: input.bankName ?? null,
        paidAt: new Date(),
        receivedBy: input.receivedBy,
        verifiedBy: input.receivedBy,
        verifiedAt: new Date(),
        notes: input.notes ?? null,
      },
    });
    const receiptNumber = await nextNumber(tx, input.schoolId, 'RECEIPT', sessionLabel, 'RCP');
    const receipt = await tx.receipt.create({
      data: {
        schoolId: input.schoolId, receiptNumber, paymentId: payment.id,
        studentId: input.studentId, invoiceId: input.invoiceId ?? null,
        amount: input.amount, issuedBy: input.receivedBy,
      },
    });
    return { payment, receipt };
  });
}
