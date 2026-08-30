import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { db } from './db';
import { can, canAny, type PermissionKey } from './rbac';
import { redirect } from 'next/navigation';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

export async function getSessionUser(): Promise<AuthUser | null> {
  const session: Session | null = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as unknown as { id?: string; email?: string; name?: string; roles?: string[] };
  if (!u.id) return null;
  return { id: u.id, email: u.email ?? '', name: u.name ?? '', roles: u.roles ?? [] };
}

/** For server components: requires login, else redirects to /login. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** For server components: requires one of the roles, else redirects home with 403-style page. */
export async function requireRole(roles: string[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.some((r) => user.roles.includes(r))) redirect('/dashboard?denied=1');
  return user;
}

export async function requirePermission(permission: PermissionKey): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user.roles, permission)) redirect('/dashboard?denied=1');
  return user;
}

/** For route handlers: returns user or null — caller decides 401/403. */
export async function getApiUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

export function hasPermission(user: AuthUser, permission: PermissionKey): boolean {
  return can(user.roles, permission);
}

export function hasAnyPermission(user: AuthUser, permissions: PermissionKey[]): boolean {
  return canAny(user.roles, permissions);
}

export function isStaff(user: AuthUser): boolean {
  return !user.roles.includes('PARENT') && !user.roles.includes('STUDENT');
}

/** Resolve staff context: which class-sections this teacher may touch. */
export async function getStaffContext(userId: string) {
  const teacherSections = await db.section.findMany({ where: { classTeacherId: userId } });
  return { isClassTeacher: teacherSections.length > 0, teacherSections };
}
