import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { attendanceMarkSchema } from '@/lib/validation';

// =====================================================================
// GET  /api/attendance?classId&sectionId&date
//      → roster (active students) + existing FULL_DAY records +
//        last-7-school-days per-class summary.
//      Permission: attendance.mark OR attendance.read.
// POST /api/attendance — mark a day (attendance.mark). Upserts the
//      AttendanceSession (unique classId+sectionId+date+sessionType)
//      and every AttendanceRecord in one transaction.
//      Audited: ATTENDANCE_MARK with per-status counts.
// =====================================================================

const SESSION_TYPE = 'FULL_DAY';

function parseDateOnly(s: string | null): Date {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') ? s! : new Date().toISOString().slice(0, 10);
  return new Date(`${iso}T00:00:00.000Z`);
}

function lastNSchoolDays(n: number, endDate: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(endDate.getTime());
  while (days.length < n) {
    if (cursor.getUTCDay() !== 0) days.push(new Date(cursor.getTime())); // skip Sundays
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const canMark = hasPermission(user, PERMISSIONS.ATTENDANCE_MARK);
    const canRead = hasPermission(user, PERMISSIONS.ATTENDANCE_READ);
    if (!canMark && !canRead) return fail('You do not have permission to perform this action', 403);

    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const url = new URL(req.url);
    const classId = url.searchParams.get('classId') ?? '';
    const sectionId = url.searchParams.get('sectionId') ?? '';
    const date = parseDateOnly(url.searchParams.get('date'));

    const [classes, currentSession] = await Promise.all([
      db.classRoom.findMany({
        where: { schoolId: school.id },
        orderBy: { level: 'asc' },
        include: { sections: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
      }),
      db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } }),
    ]);

    const roster = classId
      ? await db.student.findMany({
          where: {
            schoolId: school.id,
            deletedAt: null,
            status: 'ACTIVE',
            classId,
            ...(sectionId ? { sectionId } : {}),
            OR: [
              // students assigned to this class-section in the current session…
              ...(currentSession
                ? [{
                    classAssignments: {
                      some: {
                        classId,
                        ...(sectionId ? { sectionId } : {}),
                        academicSessionId: currentSession.id,
                        isActive: true,
                      },
                    },
                  }]
                : []),
              // …or directly placed on the class/section
              { classId, ...(sectionId ? { sectionId } : {}) },
            ],
          },
          select: {
            id: true, admissionNumber: true, firstName: true, middleName: true,
            lastName: true, rollNumber: true, photoUrl: true,
          },
          orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
          take: 200,
        })
      : [];

    const session = classId
      ? await db.attendanceSession.findFirst({
          where: {
            schoolId: school.id,
            classId,
            sectionId: sectionId || null,
            date,
            sessionType: SESSION_TYPE,
          },
          include: { records: true },
        })
      : null;

    // Weekly summary — last 7 school days, per class average % present.
    const weekDays = lastNSchoolDays(7, date);
    const weekSessions = await db.attendanceSession.findMany({
      where: { schoolId: school.id, date: { gte: weekDays[weekDays.length - 1], lte: date } },
      include: { records: { select: { status: true } } },
    });
    const perClass = new Map<string, { present: number; total: number }>();
    for (const s of weekSessions) {
      const agg = perClass.get(s.classId) ?? { present: 0, total: 0 };
      for (const r of s.records) {
        if (r.status === 'HOLIDAY') continue;
        agg.total += 1;
        if (r.status === 'PRESENT') agg.present += 1;
      }
      perClass.set(s.classId, agg);
    }
    const classNames = new Map(classes.map((c) => [c.id, c.name]));
    const weeklySummary = [...perClass.entries()]
      .map(([cid, agg]) => ({
        classId: cid,
        className: classNames.get(cid) ?? 'Unknown',
        percentPresent: agg.total ? Math.round((agg.present / agg.total) * 100) : null,
        records: agg.total,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    return ok({
      date: date.toISOString().slice(0, 10),
      classes,
      roster,
      session: session
        ? { id: session.id, markedAt: session.markedAt, records: session.records.map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks })) }
        : null,
      weeklySummary,
      canMark,
    });
  },
);

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.ATTENDANCE_MARK)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const body = await parseBody(req, attendanceMarkSchema);
    const date = parseDateOnly(body.date);

    const cls = await db.classRoom.findFirst({ where: { id: body.classId, schoolId: school.id } });
    if (!cls) throw new ApiError('Class not found', 404);
    if (body.sectionId) {
      const sec = await db.section.findFirst({ where: { id: body.sectionId, schoolId: school.id } });
      if (!sec) throw new ApiError('Section not found', 404);
    }

    const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, HOLIDAY: 0 };

    const sessionId = await db.$transaction(async (tx) => {
      // Nullable sectionId makes Prisma's compound-unique upsert unreliable —
      // find-then-create inside the transaction instead.
      const existing = await tx.attendanceSession.findFirst({
        where: {
          classId: body.classId,
          sectionId: body.sectionId ?? null,
          date,
          sessionType: SESSION_TYPE,
        },
      });
      const sessionRow = existing
        ? await tx.attendanceSession.update({
            where: { id: existing.id },
            data: { markedBy: user.id, markedAt: new Date() },
          })
        : await tx.attendanceSession.create({
            data: {
              schoolId: school.id,
              classId: body.classId,
              sectionId: body.sectionId ?? null,
              date,
              sessionType: SESSION_TYPE,
              markedBy: user.id,
            },
          });

      for (const rec of body.records) {
        counts[rec.status] = (counts[rec.status] ?? 0) + 1;
        await tx.attendanceRecord.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: sessionRow.id,
              studentId: rec.studentId,
            },
          },
          create: {
            attendanceSessionId: sessionRow.id,
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks ?? null,
            markedBy: user.id,
          },
          update: {
            status: rec.status,
            remarks: rec.remarks ?? null,
            markedBy: user.id,
          },
        });
      }
      return sessionRow.id;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'ATTENDANCE_MARK',
      entityType: 'attendance',
      entityId: sessionId,
      after: {
        date: date.toISOString().slice(0, 10),
        classId: body.classId,
        sectionId: body.sectionId ?? null,
        sessionType: SESSION_TYPE,
        counts,
        total: body.records.length,
      },
    });

    return ok({ sessionId, counts, total: body.records.length });
  },
);
