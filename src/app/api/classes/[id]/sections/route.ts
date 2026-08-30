import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { ROLES } from '@/lib/constants';
import { sectionCreateSchema } from '@/lib/validation';

// =====================================================================
// POST /api/classes/[id]/sections — add a section (classes.manage).
// The chosen class teacher must hold the TEACHER or CLASS_TEACHER role.
// Audited: SECTION_CREATE.
// =====================================================================

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.CLASSES_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);

      const cls = await db.classRoom.findFirst({ where: { id, schoolId: school.id } });
      if (!cls) throw new ApiError('Class not found', 404);

      const body = await parseBody(r, sectionCreateSchema.omit({ classId: true }));

      if (body.classTeacherId) {
        const teacher = await db.user.findUnique({
          where: { id: body.classTeacherId },
          include: { userRoles: { include: { role: true } } },
        });
        if (!teacher) throw new ApiError('Selected teacher does not exist', 422);
        const roleKeys = teacher.userRoles.map((ur) => ur.role.key);
        const isTeacher = roleKeys.includes(ROLES.TEACHER) || roleKeys.includes(ROLES.CLASS_TEACHER);
        if (!isTeacher) throw new ApiError('Selected user does not hold a teacher role', 422);
      }

      const section = await db.section.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          name: body.name,
          capacity: body.capacity ?? null,
          classTeacherId: body.classTeacherId ?? null,
        },
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'SECTION_CREATE',
        entityType: 'section',
        entityId: section.id,
        after: { classId: cls.id, className: cls.name, name: section.name, capacity: section.capacity, classTeacherId: section.classTeacherId },
      });

      return ok(section, { status: 201 });
    },
  )(req);
}
