import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { userUpdateSchema } from '@/lib/validation';
import { ROLES } from '@/lib/constants';

// =====================================================================
// PATCH /api/users/[id] — edit name/phone/roles/password/isActive
//   (users.manage). Server-enforced protections:
//     • cannot deactivate yourself
//     • cannot demote / deactivate the last active SUPER_ADMIN
//   Audited: USER_UPDATE with before/after roles.
// =====================================================================

const VALID_ROLES = new Set<string>(Object.values(ROLES));

async function superAdminCount(excludeUserId?: string): Promise<number> {
  return db.user.count({
    where: {
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      userRoles: { some: { role: { key: ROLES.SUPER_ADMIN } } },
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }

      const target = await db.user.findUnique({
        where: { id },
        include: { userRoles: { include: { role: { select: { key: true, name: true } } } } },
      });
      if (!target) throw new ApiError('User not found', 404);

      const body = await parseBody(r, userUpdateSchema);

      if (body.roles) {
        const invalid = body.roles.filter((x) => !VALID_ROLES.has(x));
        if (invalid.length) throw new ApiError(`Unknown role(s): ${invalid.join(', ')}`, 422);
      }

      const beforeRoles = target.userRoles.map((ur) => ur.role.key);
      // Any change (role edit or deactivation) that would strip the last
      // active SUPER_ADMIN is rejected — self-demotions included.
      const losingLastSuperAdmin =
        beforeRoles.includes(ROLES.SUPER_ADMIN) &&
        (
          (body.roles !== undefined && !body.roles.includes(ROLES.SUPER_ADMIN)) ||
          (body.isActive === false)
        );

      if (body.isActive === false && id === user.id) {
        throw new ApiError('You cannot deactivate your own account', 400);
      }
      if (losingLastSuperAdmin && (await superAdminCount(target.id)) === 0) {
        throw new ApiError('At least one active Super Admin must remain', 400);
      }

      const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;

      const updated = await db.$transaction(async (tx) => {
        if (body.roles) {
          const roleRows = await tx.role.findMany({ where: { key: { in: body.roles } } });
          await tx.userRole.deleteMany({ where: { userId: target.id } });
          if (roleRows.length) {
            await tx.userRole.createMany({
              data: roleRows.map((rr) => ({ userId: target.id, roleId: rr.id, assignedBy: user.id })),
            });
          }
        }
        return tx.user.update({
          where: { id: target.id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.phone !== undefined ? { phone: body.phone ?? null } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
            ...(passwordHash ? { passwordHash } : {}),
          },
          include: { userRoles: { include: { role: { select: { key: true, name: true } } } } },
        });
      });

      const afterRoles = updated.userRoles.map((ur) => ur.role.key);

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'USER_UPDATE',
        entityType: 'user',
        entityId: updated.id,
        before: { name: target.name, phone: target.phone, isActive: target.isActive, roles: beforeRoles, passwordReset: false },
        after: {
          name: updated.name, phone: updated.phone, isActive: updated.isActive, roles: afterRoles,
          passwordReset: Boolean(body.password),
          roleActorIsSelf: id === user.id,
        },
      });

      return ok({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        isActive: updated.isActive,
        roles: afterRoles,
      });
    },
  )(req);
}
