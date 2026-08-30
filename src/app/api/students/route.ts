import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { studentCreateSchema } from '@/lib/validation';
import { DEFAULT_SETTINGS } from '@/lib/settings';

// =====================================================================
// GET  /api/students — filtered list (students.read.all | .limited)
// POST /api/students — admit a student (students.write)
//   - auto admission number: SPIS/{YY}/{seq} via NumberSequence key
//     "STUDENT:{sessionLabel}" when admissionNumber is omitted
//   - writes StudentStatusHistory(ACTIVE) + optional initial guardian
//   - audited: STUDENT_CREATE
// =====================================================================

const toDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const canReadAll = hasPermission(user, PERMISSIONS.STUDENTS_READ_ALL);
    const canReadLimited = hasPermission(user, PERMISSIONS.STUDENTS_READ_LIMITED);
    if (!canReadAll && !canReadLimited) return fail('You do not have permission to perform this action', 403);

    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const classId = url.searchParams.get('classId') ?? '';
    const sectionId = url.searchParams.get('sectionId') ?? '';
    const status = url.searchParams.get('status') ?? '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));

    const where = {
      schoolId: school.id,
      deletedAt: null,
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { middleName: { contains: q } },
              { lastName: { contains: q } },
              { admissionNumber: { contains: q } },
              { rollNumber: { contains: q } },
              { guardians: { some: { guardian: { mobile: { contains: q } } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          classRoom: { select: { id: true, name: true, level: true } },
          section: { select: { id: true, name: true } },
          guardians: {
            include: {
              guardian: {
                select: { id: true, fullName: true, relationship: true, mobile: true, email: true },
              },
            },
            orderBy: { isPrimary: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.student.count({ where }),
    ]);

    return ok({
      students: rows.map((s) => ({
        ...s,
        // financial fields are never included for limited-read callers
        hasFinancialAccess: canReadAll,
        primaryGuardian: s.guardians.find((g) => g.isPrimary) ?? s.guardians[0] ?? null,
      })),
      total,
      page,
      pageSize,
    });
  },
);

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.STUDENTS_WRITE)) {
      return fail('You do not have permission to perform this action', 403);
    }

    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const body = await parseBody(req, studentCreateSchema);

    // Resolve target academic session (explicit > current > fallback label).
    let session = body.academicSessionId
      ? await db.academicSession.findFirst({ where: { id: body.academicSessionId, schoolId: school.id } })
      : await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } })
        ?? await db.academicSession.findFirst({ where: { schoolId: school.id }, orderBy: { startDate: 'desc' } });
    const sessionLabel = session?.name ?? DEFAULT_SETTINGS.sessionLabel;

    // Validate class/section belong to this school.
    if (body.classId) {
      const cls = await db.classRoom.findFirst({ where: { id: body.classId, schoolId: school.id } });
      if (!cls) throw new ApiError('Selected class does not exist', 422);
    }
    if (body.sectionId) {
      const sec = await db.section.findFirst({ where: { id: body.sectionId, schoolId: school.id } });
      if (!sec) throw new ApiError('Selected section does not exist', 422);
    }

    const status = body.status ?? 'ACTIVE';

    let student;
    try {
      student = await db.$transaction(async (tx) => {
      // Admission number — auto-generate unless supplied.
      let admissionNumber = body.admissionNumber?.trim() ?? '';
      if (!admissionNumber) {
        const seqRow = await tx.numberSequence.upsert({
          where: { schoolId_key: { schoolId: school.id, key: `STUDENT:${sessionLabel}` } },
          create: { schoolId: school.id, key: `STUDENT:${sessionLabel}`, prefix: 'SPIS', currentValue: 1 },
          update: { currentValue: { increment: 1 } },
        });
        const startYear = parseInt(sessionLabel.split('-')[0], 10);
        const yy = Number.isNaN(startYear)
          ? String(new Date().getFullYear() % 100).padStart(2, '0')
          : String(startYear % 100).padStart(2, '0');
        admissionNumber = `SPIS/${yy}/${String(seqRow.currentValue).padStart(4, '0')}`;
      }

      const created = await tx.student.create({
        data: {
          schoolId: school.id,
          admissionNumber,
          academicSessionId: session?.id ?? null,
          rollNumber: body.rollNumber ?? null,
          firstName: body.firstName,
          middleName: body.middleName ?? null,
          lastName: body.lastName ?? null,
          dateOfBirth: toDate(body.dateOfBirth),
          gender: body.gender ?? null,
          bloodGroup: body.bloodGroup ?? null,
          nationality: body.nationality ?? null,
          religion: body.religion ?? null,
          categoryId: body.categoryId ?? null,
          admissionDate: toDate(body.admissionDate) ?? new Date(),
          classId: body.classId ?? null,
          sectionId: body.sectionId ?? null,
          house: body.house ?? null,
          transportRoute: body.transportRoute ?? null,
          hostelStatus: body.hostelStatus ?? null,
          previousSchool: body.previousSchool ?? null,
          status,
          createdById: user.id,
        },
      });

      await tx.studentStatusHistory.create({
        data: {
          studentId: created.id,
          fromStatus: null,
          toStatus: status,
          reason: 'Student admitted',
          changedBy: user.id,
        },
      });

      if (body.guardian) {
        const guardian = await tx.guardian.create({
          data: {
            schoolId: school.id,
            fullName: body.guardian.fullName,
            relationship: body.guardian.relationship,
            mobile: body.guardian.mobile,
            altMobile: body.guardian.altMobile ?? null,
            email: body.guardian.email ?? null,
            occupation: body.guardian.occupation ?? null,
            address: body.guardian.address ?? null,
            isPrimaryContact: body.guardian.isPrimaryContact ?? true,
            isEmergencyContact: body.guardian.isEmergencyContact ?? false,
            createdById: user.id,
          },
        });
        await tx.studentGuardian.create({
          data: { studentId: created.id, guardianId: guardian.id, isPrimary: body.guardian.isPrimaryContact ?? true },
        });
      }

      return created;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError('A student with this admission number already exists', 409);
      }
      throw err;
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'STUDENT_CREATE',
      entityType: 'student',
      entityId: student.id,
      after: { admissionNumber: student.admissionNumber, name: `${student.firstName} ${student.lastName ?? ''}`.trim(), status: student.status, classId: student.classId, sectionId: student.sectionId },
    });

    return ok(student, { status: 201 });
  },
);
