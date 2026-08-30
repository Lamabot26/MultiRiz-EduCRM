import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { generateInvoices } from '@/lib/fees';

// POST /api/fees/invoices/generate — bulk invoice generation (transactional).
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);

    const body = (await req.json()) as {
      feeStructureId: string;
      studentIds?: string[];
      classId?: string;
      sectionId?: string;
      periods?: number;
      dueDay?: number;
    };
    if (!body.feeStructureId) throw new ApiError('feeStructureId required', 422);

    let studentIds = body.studentIds ?? [];
    if (studentIds.length === 0 && body.classId) {
      const students = await db.student.findMany({
        where: {
          schoolId: school.id, status: 'ACTIVE', classId: body.classId,
          ...(body.sectionId ? { sectionId: body.sectionId } : {}),
        },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    }
    if (studentIds.length === 0) throw new ApiError('No students matched', 422);

    // ensure assignments exist for the target students (auto-assign)
    const structure = await db.feeStructure.findFirst({ where: { id: body.feeStructureId, schoolId: school.id } });
    if (!structure) throw new ApiError('Fee structure not found', 404);
    for (const sid of studentIds) {
      await db.studentFeeAssignment.upsert({
        where: { studentId_feeStructureId: { studentId: sid, feeStructureId: structure.id } },
        create: { studentId: sid, feeStructureId: structure.id, academicSessionId: structure.academicSessionId, assignedBy: user.id },
        update: {},
      });
    }

    const created = await generateInvoices({
      schoolId: school.id,
      academicSessionId: structure.academicSessionId,
      feeStructureId: structure.id,
      studentIds,
      periods: Math.min(Math.max(body.periods ?? 1, 1), 12),
      issuedBy: user.id,
      dueDay: body.dueDay ?? undefined,
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'INVOICE_GENERATE',
      entityType: 'invoice',
      after: {
        created: created.length,
        totalPaise: created.reduce((s, c) => s + c.total, 0),
        structure: structure.name,
        students: studentIds.length,
      },
    });
    return ok({ created: created.length, invoices: created.slice(0, 50) });
  },
  { permission: PERMISSIONS.FEES_INVOICES_GENERATE },
);
