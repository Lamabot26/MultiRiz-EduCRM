import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { guardianSchema } from '@/lib/validation';
import { APPROVAL_STATUSES } from '@/lib/constants';

// =====================================================================
// POST /api/students/[id]/guardians — create + link a guardian
//   (students.write). If primary, other links for this student are
//   demoted so exactly one primary remains.
// PATCH /api/students/[id]/guardians — minimal updates: isPrimary /
//   isEmergencyContact / consentStatus (students.write).
// Audited: STUDENT_GUARDIAN_ADD | STUDENT_GUARDIAN_UPDATE
// =====================================================================

const guardianPatchSchema = z.object({
  studentGuardianId: z.string().uuid().optional(),
  guardianId: z.string().uuid().optional(),
  isPrimary: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  consentStatus: z.enum(APPROVAL_STATUSES).optional(),
});

async function requireStudent(id: string) {
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured', 500);
  const student = await db.student.findFirst({ where: { id, schoolId: school.id, deletedAt: null } });
  if (!student) throw new ApiError('Student not found', 404);
  return student;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_WRITE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const student = await requireStudent(id);
      const body = await parseBody(r, guardianSchema);

      const isPrimary = body.isPrimaryContact ?? false;
      const result = await db.$transaction(async (tx) => {
        if (isPrimary) {
          await tx.studentGuardian.updateMany({ where: { studentId: student.id }, data: { isPrimary: false } });
        }
        const guardian = await tx.guardian.create({
          data: {
            schoolId: student.schoolId,
            fullName: body.fullName,
            relationship: body.relationship,
            mobile: body.mobile,
            altMobile: body.altMobile ?? null,
            email: body.email ?? null,
            occupation: body.occupation ?? null,
            address: body.address ?? null,
            isPrimaryContact: isPrimary,
            isEmergencyContact: body.isEmergencyContact ?? false,
            createdById: user.id,
          },
        });
        await tx.studentGuardian.create({
          data: { studentId: student.id, guardianId: guardian.id, isPrimary },
        });
        return guardian;
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'STUDENT_GUARDIAN_ADD',
        entityType: 'student',
        entityId: student.id,
        after: { guardianId: result.id, fullName: result.fullName, relationship: result.relationship, mobile: result.mobile, isPrimary },
      });

      return ok(result, { status: 201 });
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
      const student = await requireStudent(id);
      const body = await parseBody(r, guardianPatchSchema);

      // StudentGuardian rows use a composite key (studentId, guardianId);
      // callers may pass either field name — both identify the guardian.
      const guardianId = body.guardianId ?? body.studentGuardianId;
      if (!guardianId) throw new ApiError('studentGuardianId or guardianId is required', 422);

      const existsLink = await db.studentGuardian.findUnique({
        where: { studentId_guardianId: { studentId: student.id, guardianId } },
      });
      if (!existsLink) throw new ApiError('Guardian is not linked to this student', 404);

      const guardian = await db.guardian.findFirst({ where: { id: guardianId } });
      if (!guardian) throw new ApiError('Guardian not found', 404);

      const before = {
        isPrimary: existsLink.isPrimary,
        isEmergencyContact: guardian.isEmergencyContact,
        consentStatus: guardian.consentStatus,
      };

      const result = await db.$transaction(async (tx) => {
        if (body.isPrimary === true) {
          await tx.studentGuardian.updateMany({ where: { studentId: student.id }, data: { isPrimary: false } });
          await tx.studentGuardian.update({
            where: { studentId_guardianId: { studentId: student.id, guardianId: guardian.id } },
            data: { isPrimary: true },
          });
        } else if (body.isPrimary === false) {
          await tx.studentGuardian.update({
            where: { studentId_guardianId: { studentId: student.id, guardianId: guardian.id } },
            data: { isPrimary: false },
          });
        }
        return tx.guardian.update({
          where: { id: guardian.id },
          data: {
            ...(body.isPrimary !== undefined ? { isPrimaryContact: body.isPrimary } : {}),
            ...(body.isEmergencyContact !== undefined ? { isEmergencyContact: body.isEmergencyContact } : {}),
            ...(body.consentStatus !== undefined
              ? { consentStatus: body.consentStatus, consentAt: body.consentStatus === 'APPROVED' ? new Date() : null }
              : {}),
          },
        });
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'STUDENT_GUARDIAN_UPDATE',
        entityType: 'student',
        entityId: student.id,
        before,
        after: { guardianId: guardian.id, isPrimary: body.isPrimary, isEmergencyContact: body.isEmergencyContact, consentStatus: body.consentStatus },
      });

      return ok({ guardian: result, isPrimary: body.isPrimary ?? existsLink.isPrimary });
    },
  )(req);
}
