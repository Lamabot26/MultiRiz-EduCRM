import { db } from '@/lib/db';
import { csvResponse, toCsv } from '@/lib/csv';
import { fail, withApi, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { GENDER_LABELS } from '@/lib/constants';
import { fmtDate } from '@/lib/date-utils';

// =====================================================================
// GET /api/students/export — CSV of students (students.read.all ONLY).
// Columns: admission number, name, class, section, roll, dob, gender,
// guardian name, guardian mobile, status, admitted on.
// Audited: EXPORT.
// =====================================================================

export const GET = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.STUDENTS_READ_ALL)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const classId = url.searchParams.get('classId') ?? '';
    const sectionId = url.searchParams.get('sectionId') ?? '';
    const status = url.searchParams.get('status') ?? '';

    const rows = await db.student.findMany({
      where: {
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
                { guardians: { some: { guardian: { mobile: { contains: q } } } } },
              ],
            }
          : {}),
      },
      include: {
        classRoom: { select: { name: true } },
        section: { select: { name: true } },
        guardians: {
          include: { guardian: { select: { fullName: true, mobile: true } } },
          orderBy: { isPrimary: 'desc' },
        },
      },
      orderBy: { admissionNumber: 'asc' },
      take: 5000,
    });

    const csv = toCsv(
      ['Admission Number', 'Name', 'Class', 'Section', 'Roll Number', 'Date of Birth', 'Gender', 'Guardian Name', 'Guardian Mobile', 'Status', 'Admitted On'],
      rows.map((s) => {
        const primary = s.guardians.find((g) => g.isPrimary) ?? s.guardians[0];
        return [
          s.admissionNumber,
          [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' '),
          s.classRoom?.name ?? '',
          s.section?.name ?? '',
          s.rollNumber ?? '',
          fmtDate(s.dateOfBirth),
          s.gender ? GENDER_LABELS[s.gender] ?? s.gender : '',
          primary?.guardian.fullName ?? '',
          primary?.guardian.mobile ?? '',
          s.status,
          fmtDate(s.admissionDate),
        ];
      }),
    );

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'EXPORT',
      entityType: 'student',
      after: { format: 'csv', rows: rows.length, filters: { q, classId, sectionId, status } },
    });

    return csvResponse(`students-${Date.now()}.csv`, csv);
  },
);
