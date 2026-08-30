import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';

// POST /api/fees/structures/[id]/assign — assign a structure to students
// (by class+section or explicit studentIds). Skips existing assignments.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const structureId = parts[parts.indexOf('structures') + 1] ?? '';
    const structure = await db.feeStructure.findFirst({
      where: { id: structureId, schoolId: school.id, status: 'ACTIVE' },
    });
    if (!structure) throw new ApiError('Active fee structure not found', 404);

    const body = (await req.json()) as { classId?: string; sectionId?: string; studentIds?: string[] };
    let students: { id: string }[] = [];
    if (body.studentIds?.length) {
      students = await db.student.findMany({
        where: { id: { in: body.studentIds }, schoolId: school.id, status: 'ACTIVE' },
        select: { id: true },
      });
    } else if (body.classId) {
      students = await db.student.findMany({
        where: {
          schoolId: school.id, status: 'ACTIVE', classId: body.classId,
          ...(body.sectionId ? { sectionId: body.sectionId } : {}),
        },
        select: { id: true },
      });
    } else {
      throw new ApiError('Provide classId or studentIds', 422);
    }

    let assigned = 0;
    for (const s of students) {
      const exists = await db.studentFeeAssignment.findUnique({
        where: { studentId_feeStructureId: { studentId: s.id, feeStructureId: structure.id } },
      });
      if (exists) continue;
      await db.studentFeeAssignment.create({
        data: { studentId: s.id, feeStructureId: structure.id, academicSessionId: structure.academicSessionId, assignedBy: user.id },
      });
      assigned++;
    }
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FEE_STRUCTURE_ASSIGN',
      entityType: 'fee_structure',
      entityId: structure.id,
      after: { assigned, eligible: students.length },
    });
    return ok({ assigned, eligible: students.length });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);
