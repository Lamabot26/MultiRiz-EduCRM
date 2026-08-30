import { db } from '@/lib/db';
import { withApi, ok, fail } from '@/lib/api-helpers';
import { STAFF_ROLES } from '@/lib/constants';

// =====================================================================
// /api/admissions/counsellors — list active users holding the
// ADMISSION_COUNSELLOR or FRONT_DESK roles (assignment dropdowns).
// Access: any staff role.
// =====================================================================

export const GET = withApi(
  async () => {
    const users = await db.user.findMany({
      where: {
        isActive: true,
        userRoles: { some: { role: { key: { in: ['ADMISSION_COUNSELLOR', 'FRONT_DESK'] } } } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userRoles: { select: { role: { select: { key: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    const items = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roles: u.userRoles.map((ur) => ur.role.key),
    }));
    return ok({ items });
  },
  { roles: STAFF_ROLES },
);
