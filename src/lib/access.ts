import { db } from '@/lib/db';
import type { AuthUser } from '../auth-guard';

// Access guard: can this user view this student's data?
// Staff with fees.ledger.read → yes. PARENT → only via guardian link.
// STUDENT → only own record.
export async function canAccessStudentFees(user: AuthUser, studentId: string): Promise<boolean> {
  const staffRoles = ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'IT_ADMIN', 'CLASS_TEACHER'];
  if (user.roles.some((r) => staffRoles.includes(r))) return true;
  if (user.roles.includes('PARENT')) {
    const link = await db.studentGuardian.findFirst({
      where: { studentId, guardian: { userId: user.id } },
      select: { studentId: true },
    });
    return Boolean(link);
  }
  if (user.roles.includes('STUDENT')) {
    const s = await db.student.findFirst({ where: { id: studentId, userId: user.id }, select: { id: true } });
    return Boolean(s);
  }
  return false;
}

export async function getParentStudentIds(userId: string): Promise<string[]> {
  const rows = await db.studentGuardian.findMany({
    where: { guardian: { userId } },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}

export async function getOwnStudentId(userId: string): Promise<string | null> {
  const s = await db.student.findFirst({ where: { userId }, select: { id: true } });
  return s?.id ?? null;
}
