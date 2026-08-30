import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission, isStaff } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { userCreateSchema } from '@/lib/validation';
import { ROLES } from '@/lib/constants';

// =====================================================================
// GET  /api/users?role=TEACHER — full list for users.manage; any other
//      staff gets minimal fields (id, name, roles, isActive) so teacher
//      pickers work without leaking account details.
// POST /api/users — create (users.manage). bcrypt(12). Duplicate email
//      → 409. Audited: USER_CREATE.
// =====================================================================

const VALID_ROLES = new Set<string>(Object.values(ROLES));

export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    if (!isStaff(user)) return fail('You do not have permission to perform this action', 403);
    const canManage = hasPermission(user, PERMISSIONS.USERS_MANAGE);

    const role = new URL(req.url).searchParams.get('role') ?? '';

    const users = await db.user.findMany({
      where: {
        isActive: true,
        ...(role ? { userRoles: { some: { role: { key: role } } } } : {}),
      },
      include: { userRoles: { include: { role: { select: { key: true, name: true } } } } },
      orderBy: { name: 'asc' },
      take: 500,
    });

    if (!canManage) {
      return ok(users.map((u) => ({
        id: u.id, name: u.name, roles: u.userRoles.map((ur) => ur.role.key), isActive: u.isActive,
      })));
    }

    return ok(users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      failedLoginCount: u.failedLoginCount,
      lockedUntil: u.lockedUntil,
      roles: u.userRoles.map((ur) => ur.role.key),
      createdAt: u.createdAt,
    })));
  },
);

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }

    const body = await parseBody(req, userCreateSchema);
    const invalid = body.roles.filter((r) => !VALID_ROLES.has(r));
    if (invalid.length) throw new ApiError(`Unknown role(s): ${invalid.join(', ')}`, 422);

    const email = body.email.toLowerCase().trim();
    const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) throw new ApiError('A user with this email already exists', 409);

    const roleRows = await db.role.findMany({ where: { key: { in: body.roles } } });
    if (roleRows.length === 0) throw new ApiError('No valid roles found — run the seed first', 422);

    const passwordHash = await bcrypt.hash(body.password, 12);

    let created;
    try {
      created = await db.user.create({
        data: {
          email,
          name: body.name,
          phone: body.phone ?? null,
          passwordHash,
          userRoles: {
            create: roleRows.map((r) => ({ roleId: r.id, assignedBy: user.id })),
          },
        },
        include: { userRoles: { include: { role: { select: { key: true, name: true } } } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError('A user with this email already exists', 409);
      }
      throw err;
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: created.id,
      after: { email: created.email, name: created.name, roles: created.userRoles.map((ur) => ur.role.key), isActive: created.isActive },
    });

    return ok({
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      isActive: created.isActive,
      roles: created.userRoles.map((ur) => ur.role.key),
    }, { status: 201 });
  },
);
