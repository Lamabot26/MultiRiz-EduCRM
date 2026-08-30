import { db } from '@/lib/db';
import { withApi, ok, fail } from '@/lib/api-helpers';

// =====================================================================
// /api/sessions — list academic sessions for the school (staff util
// shared by several dashboards). Login required.
// =====================================================================

export const GET = withApi(async (_req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  const school = await db.school.findFirst();
  if (!school) return fail('School not configured yet', 503);

  const sessions = await db.academicSession.findMany({
    where: { schoolId: school.id },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    select: {
      id: true,
      name: true,
      isCurrent: true,
      isActive: true,
      startDate: true,
      endDate: true,
    },
  });
  return ok({ items: sessions });
});
