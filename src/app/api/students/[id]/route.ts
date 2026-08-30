import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { studentUpdateSchema } from '@/lib/validation';
import { STUDENT_STATUSES } from '@/lib/constants';

// =====================================================================
// GET   /api/students/[id] — full profile. Callers with only
//       students.read.limited get fee/financial data stripped.
// PATCH /api/students/[id] — edit (students.write). Status transitions
//       append StudentStatusHistory rows. Audited: STUDENT_UPDATE.
// =====================================================================

const toDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

async function getStudent(id: string, includeFinancial: boolean) {
  return db.student.findFirst({
    where: { id, deletedAt: null },
    include: {
      school: true,
      academicSession: true,
      classRoom: true,
      section: true,
      portalUser: { select: { id: true, name: true, email: true } },
      guardians: {
        include: { guardian: true },
        orderBy: { isPrimary: 'desc' },
      },
      approvedContacts: {
        include: { audits: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { changedAt: 'desc' } },
      classAssignments: {
        include: { classRoom: true, section: true, academicSession: true },
        orderBy: { assignedAt: 'desc' },
      },
      ...(includeFinancial
        ? {
            invoices: {
              orderBy: { issueDate: 'desc' },
              take: 50,
            },
            feeAssignments: {
              where: { isActive: true },
              include: { feeStructure: true, academicSession: true },
            },
          }
        : {}),
    },
  });
}

async function getAttendanceContext(studentId: string) {
  const school = await db.school.findFirst();
  const session = await db.academicSession.findFirst({ where: { schoolId: school?.id ?? '', isCurrent: true } });
  const records = await db.attendanceRecord.findMany({
    where: {
      studentId,
      ...(session
        ? { attendanceSession: { date: { gte: session.startDate, lte: new Date(session.endDate.getTime() + 24 * 3600 * 1000) } } }
        : {}),
    },
    include: { attendanceSession: { include: { classRoom: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } } } },
    orderBy: { attendanceSession: { date: 'desc' } },
    take: 40,
  });
  const counted = records.filter((r) => r.status !== 'HOLIDAY');
  const present = counted.filter((r) => r.status === 'PRESENT').length;
  const percent = counted.length ? Math.round((present / counted.length) * 100) : null;
  return { records, summary: { total: counted.length, present, percentPresent: percent } };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (_req, { user }) => {
      if (!user) return fail('Authentication required', 401);
      const canReadAll = hasPermission(user, PERMISSIONS.STUDENTS_READ_ALL);
      const canReadLimited = hasPermission(user, PERMISSIONS.STUDENTS_READ_LIMITED);
      if (!canReadAll && !canReadLimited) return fail('You do not have permission to perform this action', 403);

      const canSeeFees = canReadAll && hasPermission(user, PERMISSIONS.FEES_PAYMENTS_READ);
      const student = await getStudent(id, canSeeFees);
      if (!student) throw new ApiError('Student not found', 404);

      if (!canSeeFees) {
        // strip financial surfaces for limited readers
        const { invoices: _i, feeAssignments: _f, ...rest } = student as typeof student & { invoices?: unknown; feeAssignments?: unknown };
        void _i; void _f;
        const attendance = await getAttendanceContext(id);
        return ok({ student: rest, financialAccess: false, attendance });
      }
      const payments = await db.payment.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const attendance = await getAttendanceContext(id);
      return ok({ student, payments, financialAccess: true, attendance });
    },
  )(req);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_WRITE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);

      const body = await parseBody(r, studentUpdateSchema);

      const existing = await db.student.findFirst({ where: { id, schoolId: school.id, deletedAt: null } });
      if (!existing) throw new ApiError('Student not found', 404);

      if (body.classId) {
        const cls = await db.classRoom.findFirst({ where: { id: body.classId, schoolId: school.id } });
        if (!cls) throw new ApiError('Selected class does not exist', 422);
      }
      if (body.sectionId) {
        const sec = await db.section.findFirst({ where: { id: body.sectionId, schoolId: school.id } });
        if (!sec) throw new ApiError('Selected section does not exist', 422);
      }
      if (body.status && !STUDENT_STATUSES.includes(body.status as (typeof STUDENT_STATUSES)[number])) {
        throw new ApiError('Invalid status', 422);
      }

      const { reason, ...fields } = body;
      void reason; // reason is consumed for the status-history row below

      const statusChanged = Boolean(fields.status && fields.status !== existing.status);

      const updated = await db.$transaction(async (tx) => {
        const row = await tx.student.update({
          where: { id: existing.id },
          data: {
            ...(fields.academicSessionId !== undefined ? { academicSessionId: fields.academicSessionId ?? null } : {}),
            ...(fields.rollNumber !== undefined ? { rollNumber: fields.rollNumber ?? null } : {}),
            ...(fields.firstName !== undefined ? { firstName: fields.firstName } : {}),
            ...(fields.middleName !== undefined ? { middleName: fields.middleName ?? null } : {}),
            ...(fields.lastName !== undefined ? { lastName: fields.lastName ?? null } : {}),
            ...(fields.dateOfBirth !== undefined ? { dateOfBirth: toDate(fields.dateOfBirth) } : {}),
            ...(fields.gender !== undefined ? { gender: fields.gender ?? null } : {}),
            ...(fields.bloodGroup !== undefined ? { bloodGroup: fields.bloodGroup ?? null } : {}),
            ...(fields.nationality !== undefined ? { nationality: fields.nationality ?? null } : {}),
            ...(fields.religion !== undefined ? { religion: fields.religion ?? null } : {}),
            ...(fields.categoryId !== undefined ? { categoryId: fields.categoryId ?? null } : {}),
            ...(fields.admissionDate !== undefined ? { admissionDate: toDate(fields.admissionDate) } : {}),
            ...(fields.classId !== undefined ? { classId: fields.classId ?? null } : {}),
            ...(fields.sectionId !== undefined ? { sectionId: fields.sectionId ?? null } : {}),
            ...(fields.house !== undefined ? { house: fields.house ?? null } : {}),
            ...(fields.transportRoute !== undefined ? { transportRoute: fields.transportRoute ?? null } : {}),
            ...(fields.hostelStatus !== undefined ? { hostelStatus: fields.hostelStatus ?? null } : {}),
            ...(fields.previousSchool !== undefined ? { previousSchool: fields.previousSchool ?? null } : {}),
            ...(fields.status !== undefined ? { status: fields.status } : {}),
          },
        });

        if (statusChanged) {
          await tx.studentStatusHistory.create({
            data: {
              studentId: existing.id,
              fromStatus: existing.status,
              toStatus: fields.status!,
              reason: reason ?? null,
              changedBy: user.id,
            },
          });
        }
        return row;
      });

      const before = {
        firstName: existing.firstName, lastName: existing.lastName, status: existing.status,
        classId: existing.classId, sectionId: existing.sectionId, rollNumber: existing.rollNumber,
        dateOfBirth: existing.dateOfBirth, gender: existing.gender,
      };
      const after = {
        firstName: updated.firstName, lastName: updated.lastName, status: updated.status,
        classId: updated.classId, sectionId: updated.sectionId, rollNumber: updated.rollNumber,
        dateOfBirth: updated.dateOfBirth, gender: updated.gender,
      };

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'STUDENT_UPDATE',
        entityType: 'student',
        entityId: updated.id,
        before,
        after: statusChanged ? { ...after, statusChangeReason: reason ?? null } : after,
      });

      return ok(updated);
    },
  )(req);
}
