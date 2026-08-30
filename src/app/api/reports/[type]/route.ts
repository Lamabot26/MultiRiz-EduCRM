import { db } from '@/lib/db';
import { withApi, fail, writeAudit, auditFrom } from '@/lib/api-helpers';
import { PERMISSIONS, canAny, can } from '@/lib/rbac';
import { toCsv, csvResponse } from '@/lib/csv';
import { rupeesPlain } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';

// =====================================================================
// GET /api/reports/[type]?from&to&session&class&studentId — CSV exports.
// Financial reports require reports.financial; others reports.read.
// Every export is audited (EXPORT).
// =====================================================================

function parseDateParam(v: string | null, endOfDay = false): Date | undefined {
  if (!v) return undefined;
  let d: Date;
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split('-').map(Number);
    d = new Date(yyyy, mm - 1, dd);
  } else {
    d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
  }
  return endOfDay ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : d;
}

export const GET = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const type = parts[parts.indexOf('reports') + 1] ?? '';

    const FINANCIAL = new Set(['fee-demand', 'daily-collection', 'monthly-collection', 'defaulters', 'student-ledger', 'invoices', 'receipts', 'concessions', 'refunds', 'payment-modes']);
    if (FINANCIAL.has(type) ? !can(user.roles, PERMISSIONS.REPORTS_FINANCIAL) : !canAny(user.roles, [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_FINANCIAL])) {
      return fail('You do not have permission to access this report', 403);
    }

    const school = await db.school.findFirst();
    if (!school) return fail('School not configured', 503);

    const from = parseDateParam(url.searchParams.get('from'));
    const to = parseDateParam(url.searchParams.get('to'), true);
    const sessionId = url.searchParams.get('session') ?? undefined;
    const classId = url.searchParams.get('class') ?? undefined;
    const studentId = url.searchParams.get('studentId') ?? undefined;
    const range = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    const hasRange = Object.keys(range).length > 0;

    let headers: string[] = [];
    let rows: (string | number | null)[][] = [];

    switch (type) {
      case 'leads': {
        const leads = await db.admissionLead.findMany({
          where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) },
          include: { leadSource: true, assignee: true },
          orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Lead Number', 'Student', 'Class Applying', 'Guardian', 'Mobile', 'Email', 'City', 'Source', 'Counsellor', 'Status', 'Priority', 'Next Follow-up', 'Created'];
        rows = leads.map((l) => [l.leadNumber, l.studentName, l.classApplyingFor ?? '', l.guardianName, l.mobile, l.email ?? '', l.city ?? '', l.leadSource?.name ?? '', l.assignee?.name ?? '', l.status, l.priority, l.nextFollowUpDate ? fmtDate(l.nextFollowUpDate) : '', fmtDate(l.createdAt)]);
        break;
      }
      case 'lead-sources': {
        const leads = await db.admissionLead.groupBy({ by: ['leadSourceId', 'status'], where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) }, _count: true });
        const sources = await db.leadSource.findMany({ where: { schoolId: school.id } });
        const nameOf = (id: string | null) => sources.find((s) => s.id === id)?.name ?? 'Unknown';
        headers = ['Source', 'Status', 'Count'];
        rows = leads.map((g) => [nameOf(g.leadSourceId), g.status, g._count]);
        break;
      }
      case 'counsellor-performance': {
        const leads = await db.admissionLead.groupBy({ by: ['assignedTo', 'status'], where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) }, _count: true });
        const users = await db.user.findMany();
        const nameOf = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
        headers = ['Counsellor', 'Status', 'Count'];
        rows = leads.map((g) => [nameOf(g.assignedTo), g.status, g._count]);
        break;
      }
      case 'conversions': {
        const apps = await db.admissionApplication.findMany({
          where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) },
          include: { lead: true, academicSession: true }, orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Application #', 'Student', 'Class', 'From Lead', 'Status', 'Converted To Student', 'Created'];
        rows = apps.map((a) => [a.applicationNumber, a.studentName, a.classApplyingFor, a.lead?.leadNumber ?? '', a.status, a.convertedStudentId ? 'Yes' : 'No', fmtDate(a.createdAt)]);
        break;
      }
      case 'student-master': {
        const students = await db.student.findMany({
          where: { schoolId: school.id, deletedAt: null, ...(classId ? { classId } : {}), ...(sessionId ? { academicSessionId: sessionId } : {}) },
          include: { classRoom: true, section: true, guardians: { include: { guardian: true } } },
          orderBy: { admissionNumber: 'asc' }, take: 5000,
        });
        headers = ['Admission #', 'Name', 'Class', 'Section', 'Roll', 'DOB', 'Gender', 'Guardian', 'Guardian Mobile', 'Status', 'Admitted On'];
        rows = students.map((s) => {
          const g = s.guardians.find((x) => x.isPrimary)?.guardian;
          return [s.admissionNumber, `${s.firstName} ${s.lastName ?? ''}`, s.classRoom?.name ?? '', s.section?.name ?? '', s.rollNumber ?? '', s.dateOfBirth ? fmtDate(s.dateOfBirth) : '', s.gender ?? '', g?.fullName ?? '', g?.mobile ?? '', s.status, s.admissionDate ? fmtDate(s.admissionDate) : ''];
        });
        break;
      }
      case 'class-wise': {
        const students = await db.student.groupBy({
          by: ['classId', 'sectionId', 'status'], where: { schoolId: school.id, deletedAt: null }, _count: true,
        });
        const classes = await db.classRoom.findMany({ where: { schoolId: school.id }, include: { sections: true } });
        const cname = (id: string | null) => classes.find((c) => c.id === id)?.name ?? '—';
        const sname = (id: string | null) => { for (const c of classes) { const s = c.sections.find((x) => x.id === id); if (s) return s.name; } return '—'; };
        headers = ['Class', 'Section', 'Status', 'Count'];
        rows = students.map((g) => [cname(g.classId), sname(g.sectionId), g.status, g._count]);
        break;
      }
      case 'approved-contacts': {
        const contacts = await db.approvedContact.findMany({
          where: { student: { schoolId: school.id }, ...(hasRange ? { createdAt: range } : {}) },
          include: { student: { include: { classRoom: true } } }, orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Student', 'Class', 'Contact Name', 'Relationship', 'Mobile', 'Approval Status', 'Approved At', 'Notes'];
        rows = contacts.map((c) => [`${c.student.firstName} ${c.student.lastName ?? ''}`, c.student.classRoom?.name ?? '', c.contactName, c.relationship, c.mobile, c.approvalStatus, c.approvedAt ? fmtDate(c.approvedAt) : '', c.notes ?? '']);
        break;
      }
      case 'fee-demand': {
        const invoices = await db.invoice.findMany({
          where: { schoolId: school.id, status: { not: 'CANCELLED' }, ...(classId ? { student: { classId } } : {}), ...(sessionId ? { academicSessionId: sessionId } : {}), ...(hasRange ? { issueDate: range } : {}) },
          include: { student: { include: { classRoom: true } } }, orderBy: { issueDate: 'asc' }, take: 5000,
        });
        headers = ['Invoice #', 'Student', 'Class', 'Period', 'Issue Date', 'Due Date', 'Total', 'Discount', 'Late Fee', 'Paid', 'Balance', 'Status'];
        rows = invoices.map((i) => [i.invoiceNumber, `${i.student.firstName} ${i.student.lastName ?? ''}`, i.student.classRoom?.name ?? '', i.periodLabel ?? '', fmtDate(i.issueDate), i.dueDate ? fmtDate(i.dueDate) : '', rupeesPlain(i.total), rupeesPlain(i.discountTotal), rupeesPlain(i.lateFeeTotal), rupeesPlain(i.paidTotal), rupeesPlain(i.balance), i.status]);
        break;
      }
      case 'daily-collection': {
        const payments = await db.payment.findMany({
          where: { schoolId: school.id, status: 'CONFIRMED', ...(hasRange ? { paidAt: range } : { paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }) },
          include: { student: true, receiver: true }, orderBy: { paidAt: 'asc' }, take: 5000,
        });
        headers = ['Date', 'Receipt/Ref', 'Student', 'Mode', 'Amount (INR)', 'Received By'];
        rows = payments.map((p) => [fmtDate(p.paidAt ?? p.createdAt), p.receipts?.[0]?.receiptNumber ?? p.referenceNumber ?? '', `${p.student.firstName} ${p.student.lastName ?? ''}`, p.mode, rupeesPlain(p.amount), p.receiver?.name ?? '']);
        break;
      }
      case 'monthly-collection': {
        const payments = await db.payment.findMany({
          where: { schoolId: school.id, status: 'CONFIRMED', ...(hasRange ? { paidAt: range } : {}) },
          select: { amount: true, mode: true, paidAt: true },
        });
        const byMonth = new Map<string, number>();
        for (const p of payments) {
          const d = p.paidAt ?? new Date();
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
        }
        headers = ['Month', 'Collected (INR)'];
        rows = [...byMonth.entries()].sort().map(([m, v]) => [m, rupeesPlain(v)]);
        break;
      }
      case 'defaulters': {
        const invoices = await db.invoice.findMany({
          where: {
            schoolId: school.id, status: { in: ['OVERDUE', 'PARTIALLY_PAID', 'ISSUED'] },
            dueDate: { lt: new Date() }, ...(classId ? { student: { classId } } : {}),
          },
          include: { student: { include: { classRoom: true, section: true, guardians: { include: { guardian: true } } } } },
          orderBy: { dueDate: 'asc' }, take: 5000,
        });
        headers = ['Student', 'Admission #', 'Class-Section', 'Guardian Mobile', 'Invoice #', 'Period', 'Due Date', 'Balance (INR)', 'Status'];
        rows = invoices.map((i) => {
          const g = i.student.guardians.find((x) => x.isPrimary)?.guardian;
          return [`${i.student.firstName} ${i.student.lastName ?? ''}`, i.student.admissionNumber, `${i.student.classRoom?.name ?? ''}-${i.student.section?.name ?? ''}`, g?.mobile ?? '', i.invoiceNumber, i.periodLabel ?? '', i.dueDate ? fmtDate(i.dueDate) : '', rupeesPlain(i.balance), i.status];
        });
        break;
      }
      case 'student-ledger': {
        if (!studentId) return fail('studentId query parameter required', 422);
        const [student, invoices, payments, refunds] = await Promise.all([
          db.student.findFirst({ where: { id: studentId, schoolId: school.id } }),
          db.invoice.findMany({ where: { studentId }, orderBy: { issueDate: 'asc' } }),
          db.payment.findMany({ where: { studentId, status: { in: ['CONFIRMED', 'REFUNDED'] } }, orderBy: { paidAt: 'asc' } }),
          db.refund.findMany({ where: { studentId, status: 'PROCESSED' } }),
        ]);
        if (!student) return fail('Student not found', 404);
        const entries: { date: Date; desc: string; ref: string; debit: number; credit: number }[] = [
          ...invoices.map((i) => ({ date: i.issueDate, desc: `Invoice ${i.periodLabel ?? ''}`, ref: i.invoiceNumber, debit: i.total + i.lateFeeTotal - i.discountTotal, credit: 0 })),
          ...payments.map((p) => ({ date: p.paidAt ?? p.createdAt, desc: `Payment (${p.mode})${p.status === 'REFUNDED' ? ' — refunded' : ''}`, ref: p.referenceNumber ?? '', debit: 0, credit: p.amount })),
          ...refunds.map((r) => ({ date: r.processedAt ?? r.createdAt, desc: `Refund — ${r.reason}`, ref: r.referenceNumber ?? '', debit: r.amount, credit: 0 })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());
        let bal = 0;
        headers = ['Date', 'Description', 'Reference', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)'];
        rows = entries.map((e) => { bal += e.debit - e.credit; return [fmtDate(e.date), e.desc, e.ref, e.debit ? rupeesPlain(e.debit) : '', e.credit ? rupeesPlain(e.credit) : '', rupeesPlain(bal)]; });
        break;
      }
      case 'invoices': {
        const invoices = await db.invoice.findMany({
          where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}), ...(sessionId ? { academicSessionId: sessionId } : {}) },
          include: { student: true }, orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Invoice #', 'Student', 'Admission #', 'Total', 'Paid', 'Balance', 'Status', 'Generated'];
        rows = invoices.map((i) => [i.invoiceNumber, `${i.student.firstName} ${i.student.lastName ?? ''}`, i.student.admissionNumber, rupeesPlain(i.total), rupeesPlain(i.paidTotal), rupeesPlain(i.balance), i.status, fmtDate(i.createdAt)]);
        break;
      }
      case 'receipts': {
        const receipts = await db.receipt.findMany({
          where: { schoolId: school.id, ...(hasRange ? { issuedAt: range } : {}) },
          include: { student: true, payment: true }, orderBy: { issuedAt: 'desc' }, take: 5000,
        });
        headers = ['Receipt #', 'Student', 'Amount', 'Mode', 'Duplicate', 'Issued At'];
        rows = receipts.map((r) => [r.receiptNumber, `${r.student.firstName} ${r.student.lastName ?? ''}`, rupeesPlain(r.amount), r.payment.mode, r.isDuplicate ? `Yes (of ${r.duplicateOf ?? ''})` : 'No', fmtDate(r.issuedAt)]);
        break;
      }
      case 'concessions': {
        const items = await db.concession.findMany({
          where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) },
          include: { student: true }, orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Student', 'Type', 'Percent', 'Amount', 'Reason', 'Status', 'Requested', 'Approved At'];
        rows = items.map((c) => [`${c.student.firstName} ${c.student.lastName ?? ''}`, c.type, c.percent ? `${c.percent}%` : '', c.amount ? rupeesPlain(c.amount) : '', c.reason, c.status, fmtDate(c.createdAt), c.approvedAt ? fmtDate(c.approvedAt) : '']);
        break;
      }
      case 'refunds': {
        const items = await db.refund.findMany({
          where: { schoolId: school.id, ...(hasRange ? { createdAt: range } : {}) },
          include: { student: true, payment: true }, orderBy: { createdAt: 'desc' }, take: 5000,
        });
        headers = ['Student', 'Payment Mode', 'Amount', 'Reason', 'Status', 'Reference', 'Created'];
        rows = items.map((r) => [`${r.student.firstName} ${r.student.lastName ?? ''}`, r.payment.mode, rupeesPlain(r.amount), r.reason, r.status, r.referenceNumber ?? '', fmtDate(r.createdAt)]);
        break;
      }
      case 'payment-modes': {
        const payments = await db.payment.groupBy({
          by: ['mode'], where: { schoolId: school.id, status: 'CONFIRMED', ...(hasRange ? { paidAt: range } : {}) },
          _count: true, _sum: { amount: true },
        });
        headers = ['Mode', 'Count', 'Total (INR)'];
        rows = payments.map((g) => [g.mode, g._count, rupeesPlain(g._sum.amount ?? 0)]);
        break;
      }
      case 'attendance': {
        const records = await db.attendanceRecord.findMany({
          where: {
            attendanceSession: { schoolId: school.id, ...(classId ? { classId } : {}), ...(hasRange ? { date: range } : {}) },
            ...(studentId ? { studentId } : {}),
          },
          include: { student: true, attendanceSession: { include: { classRoom: true } } },
          orderBy: { attendanceSession: { date: 'asc' } }, take: 10000,
        });
        headers = ['Date', 'Class', 'Student', 'Admission #', 'Status', 'Remarks'];
        rows = records.map((r) => [fmtDate(r.attendanceSession.date), r.attendanceSession.classRoom.name, `${r.student.firstName} ${r.student.lastName ?? ''}`, r.student.admissionNumber, r.status, r.remarks ?? '']);
        break;
      }
      case 'audit-logs': {
        if (!can(user.roles, PERMISSIONS.AUDIT_READ)) return fail('Permission denied', 403);
        const logs = await db.auditLog.findMany({
          where: { ...(hasRange ? { createdAt: range } : {}) },
          orderBy: { createdAt: 'desc' }, take: 10000,
        });
        headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'IP'];
        rows = logs.map((l) => [l.createdAt.toISOString(), l.userId ?? '', l.userRole ?? '', l.action, l.entityType, l.entityId ?? '', l.ipAddress ?? '']);
        break;
      }
      default:
        return fail(`Unknown report type: ${type}`, 404);
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'EXPORT',
      entityType: 'report',
      entityId: type,
      after: { type, rows: rows.length, filters: { from: from?.toISOString(), to: to?.toISOString(), session: sessionId, class: classId } },
    });
    return csvResponse(`report-${type}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  },
);
