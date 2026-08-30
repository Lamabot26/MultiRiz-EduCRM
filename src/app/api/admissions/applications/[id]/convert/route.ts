import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';

// =====================================================================
// /api/admissions/applications/[id]/convert — create the Student record
// from an ACCEPTED application (idempotent via convertedStudentId).
// Admission number: SPIS/<session>/<seq> from sequence key
// "STUDENT:<session>" (prefix SPIS) — nextNumberTx's kind union doesn't
// include STUDENT, so the sequence is incremented inline with the same
// upsert semantics.
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('applications');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

function splitName(full: string): { firstName: string; lastName: string | null } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? full, lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!canAny(user.roles, [PERMISSIONS.LEADS_CONVERT, PERMISSIONS.APPLICATIONS_MANAGE])) {
      return fail('You do not have permission to perform this action', 403);
    }

    const id = idFromUrl(req);
    if (!id) throw new ApiError('Application id missing', 400);
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);
    const app = await db.admissionApplication.findUnique({ where: { id } });
    if (!app || app.schoolId !== school.id) throw new ApiError('Application not found', 404);

    // Idempotency guard — already converted.
    if (app.convertedStudentId) {
      const student = await db.student.findUnique({ where: { id: app.convertedStudentId } });
      return ok({
        studentId: app.convertedStudentId,
        admissionNumber: student?.admissionNumber ?? null,
        reused: true,
      });
    }
    if (app.status !== 'ACCEPTED') {
      throw new ApiError('Only ACCEPTED applications can be converted to students', 422);
    }

    const session = await db.academicSession.findFirst({ where: { id: app.academicSessionId } });
    if (!session) throw new ApiError('Academic session not found', 422);
    const sessionLabel = session.name;

    // Match classApplyingFor to a ClassRoom by name when possible.
    const classRoom = await db.classRoom.findFirst({
      where: { schoolId: school.id, name: app.classApplyingFor },
    });

    const { firstName, lastName } = splitName(app.studentName);

    const student = await db.$transaction(async (tx) => {
      const seq = await tx.numberSequence.upsert({
        where: { schoolId_key: { schoolId: school.id, key: `STUDENT:${sessionLabel}` } },
        create: { schoolId: school.id, key: `STUDENT:${sessionLabel}`, prefix: 'SPIS', currentValue: 1 },
        update: { currentValue: { increment: 1 } },
      });
      const admissionNumber = `SPIS/${sessionLabel}/${String(seq.currentValue).padStart(4, '0')}`;

      const created = await tx.student.create({
        data: {
          schoolId: school.id,
          admissionNumber,
          academicSessionId: session.id,
          firstName,
          lastName,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          admissionDate: new Date(),
          classId: classRoom?.id ?? null,
          previousSchool: app.previousSchool,
          status: 'ACTIVE',
          createdById: user.id,
        },
      });

      await tx.admissionApplication.update({
        where: { id: app.id },
        data: { status: 'ACCEPTED', convertedStudentId: created.id },
      });

      return created;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'STUDENT_CREATE_FROM_APPLICATION',
      entityType: 'student',
      entityId: student.id,
      after: {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
      },
    });

    return ok({ studentId: student.id, admissionNumber: student.admissionNumber }, { status: 201 });
  },
  { rateLimit: { key: 'application-convert', limit: 30, windowMs: 60_000 } },
);
