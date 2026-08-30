import { db } from '@/lib/db';
import { withApi, ok, fail } from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';

// GET /api/fees/invoices?student=&open=1&status=&q=&class=&page=&pageSize=
export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    if (!canAny(user.roles, [PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.FEES_LEDGER_READ, PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.PORTAL_ACCESS])) {
      return fail('You do not have permission to view invoices', 403);
    }
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured', 503);
    const url = new URL(req.url);
    const studentId = url.searchParams.get('student') ?? undefined;
    const open = url.searchParams.get('open') === '1';
    const status = url.searchParams.get('status') ?? undefined;
    const q = url.searchParams.get('q') ?? undefined;
    const classId = url.searchParams.get('class') ?? undefined;
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));

    const where = {
      schoolId: school.id,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(open ? { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] }, balance: { gt: 0 } } : {}),
      ...(classId ? { student: { classId } } : {}),
      ...(q ? { OR: [{ invoiceNumber: { contains: q } }, { student: { firstName: { contains: q } } }, { student: { lastName: { contains: q } } }, { student: { admissionNumber: { contains: q } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      db.invoice.findMany({
        where, include: { student: { include: { classRoom: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      db.invoice.count({ where }),
    ]);
    return ok({ items, total, page, pageSize });
  },
);
