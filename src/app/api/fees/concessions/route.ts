import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { concessionSchema } from '@/lib/validation';

// GET /api/fees/concessions?status= — list concessions.
export const GET = withApi(
  async (req) => {
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const concessions = await db.concession.findMany({
      where: { schoolId: school.id, ...(status ? { status } : {}) },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok({ items: concessions });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);

// POST /api/fees/concessions — request a concession (approval workflow).
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const body = await parseBody(req, concessionSchema);

    const student = await db.student.findFirst({ where: { id: body.studentId, schoolId: school.id } });
    if (!student) throw new ApiError('Student not found', 404);
    if (!body.percent && !body.amount) throw new ApiError('Provide percent or amount', 422);

    const concession = await db.concession.create({
      data: {
        schoolId: school.id,
        studentId: body.studentId,
        invoiceId: body.invoiceId ?? null,
        type: body.type,
        percent: body.percent ?? null,
        amount: body.amount ?? null,
        reason: body.reason,
        status: 'PENDING',
        requestedBy: user.id,
      },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'CONCESSION_CREATE',
      entityType: 'concession',
      entityId: concession.id,
      after: { type: concession.type, percent: concession.percent, amount: concession.amount, studentId: concession.studentId },
    });
    return ok({ concession });
  },
  { permission: PERMISSIONS.FEES_CONCESSION_REQUEST },
);
