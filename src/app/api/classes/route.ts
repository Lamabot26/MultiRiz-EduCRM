import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission, isStaff } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { classCreateSchema } from '@/lib/validation';
import { Prisma } from '@prisma/client';

// =====================================================================
// GET  /api/classes — class list with sections, active-student counts
//      and class-teacher names. Any staff member may read.
// POST /api/classes — create class (classes.manage). Audited: CLASS_CREATE.
// =====================================================================

export const GET = withApi(
  async (_req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    if (!isStaff(user)) return fail('You do not have permission to perform this action', 403);

    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const classes = await db.classRoom.findMany({
      where: { schoolId: school.id },
      orderBy: { level: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: { classTeacher: { select: { id: true, name: true } } },
        },
      },
    });

    const counts = await db.student.groupBy({
      by: ['sectionId'],
      where: { schoolId: school.id, deletedAt: null, status: 'ACTIVE', sectionId: { not: null } },
      _count: { _all: true },
    });
    const countBySection = new Map(counts.map((c) => [c.sectionId as string, c._count._all]));

    const rows = classes.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      description: c.description,
      isActive: c.isActive,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        classTeacherId: s.classTeacherId,
        classTeacherName: s.classTeacher?.name ?? null,
        strength: countBySection.get(s.id) ?? 0,
      })),
    }));

    return ok(rows);
  },
);

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.CLASSES_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const body = await parseBody(req, classCreateSchema);

    let created;
    try {
      created = await db.classRoom.create({
        data: {
          schoolId: school.id,
          name: body.name,
          level: body.level,
          description: body.description ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError('A class with this name already exists', 409);
      }
      throw err;
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'CLASS_CREATE',
      entityType: 'class',
      entityId: created.id,
      after: { name: created.name, level: created.level },
    });

    return ok(created, { status: 201 });
  },
);
