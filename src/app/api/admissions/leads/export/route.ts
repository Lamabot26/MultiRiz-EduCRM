import { db } from '@/lib/db';
import { withApi, fail } from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { toCsv, csvResponse } from '@/lib/csv';
import { LEAD_SOURCE_LABELS } from '@/lib/constants';

// =====================================================================
// /api/admissions/leads/export — CSV export of the filtered lead list.
// Same filters as the list GET; respects read-scope (own leads for
// assigned-only users).
// =====================================================================

function leadReadScope(user: AuthUser, schoolId: string): Record<string, unknown> {
  if (hasPermission(user, PERMISSIONS.LEADS_READ_ALL)) return { schoolId };
  return { schoolId, OR: [{ assignedTo: user.id }, { createdById: user.id }] };
}

const HEADERS = [
  'Lead Number', 'Student Name', 'Guardian Name', 'Mobile', 'Email', 'Class Applying For',
  'City', 'Previous School', 'Source', 'Counsellor', 'Status', 'Priority',
  'Next Follow-up', 'Last Activity', 'Created At', 'Notes',
];

const d = (v: Date | null | undefined) => {
  if (!v) return '';
  const x = new Date(v);
  const dd = String(x.getDate()).padStart(2, '0');
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${x.getFullYear()}`;
};

export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  if (!canAny(user.roles, [PERMISSIONS.LEADS_IMPORT_EXPORT, PERMISSIONS.LEADS_READ_ALL])) {
    return fail('You do not have permission to perform this action', 403);
  }
  const school = await db.school.findFirst();
  if (!school) return fail('School not configured yet', 503);

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const source = url.searchParams.get('source') ?? '';
  const priority = url.searchParams.get('priority') ?? '';
  const assignedTo = url.searchParams.get('assignedTo') ?? '';

  const where = {
    ...leadReadScope(user, school.id),
    ...(status ? { status } : {}),
    ...(source ? { leadSource: { name: source } } : {}),
    ...(priority ? { priority } : {}),
    ...(assignedTo ? { assignedTo } : {}),
    ...(q
      ? {
          OR: [
            { studentName: { contains: q } },
            { guardianName: { contains: q } },
            { mobile: { contains: q } },
            { email: { contains: q } },
            { leadNumber: { contains: q } },
          ],
        }
      : {}),
  };

  const leads = await db.admissionLead.findMany({
    where,
    orderBy: { lastActivityAt: 'desc' },
    take: 5000,
    include: {
      leadSource: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  const rows = leads.map((l) => [
    l.leadNumber, l.studentName, l.guardianName, l.mobile, l.email ?? '',
    l.classApplyingFor ?? '', l.city ?? '', l.previousSchool ?? '',
    l.leadSource ? (LEAD_SOURCE_LABELS[l.leadSource.name] ?? l.leadSource.name) : '',
    l.assignee?.name ?? '', l.status, l.priority,
    d(l.nextFollowUpDate), d(l.lastActivityAt), d(l.createdAt), l.notes ?? '',
  ]);

  const stamp = d(new Date()).split('-').reverse().join('');
  return csvResponse(`leads-export-${stamp}.csv`, toCsv(HEADERS, rows));
});
