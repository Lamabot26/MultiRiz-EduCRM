import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { UsersManager } from '@/components/users/users-manager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) redirect('/dashboard?denied=1');

  const users = await db.user.findMany({
    include: { userRoles: { include: { role: { select: { key: true } } } } },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">
          Staff accounts, role assignments and sign-in health.
        </p>
      </div>
      <UsersManager
        currentUserId={user.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
          failedLoginCount: u.failedLoginCount,
          roles: u.userRoles.map((ur) => ur.role.key),
          createdAt: u.createdAt,
        }))}
      />
    </div>
  );
}
