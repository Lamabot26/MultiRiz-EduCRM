import { db } from '@/lib/db';
import { ok, fail, withApi, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { csvResponse, toCsv } from '@/lib/csv';
import { fmtDateTime } from '@/lib/date-utils';

// =====================================================================
// GET /api/audit-logs — read-only audit trail (audit.read).
// Filters: q (entityId/action), entityType, action, userId,
//          dateFrom/dateTo (yyyy-mm-dd), page (50/page), format=csv.
// Append-only: there is intentionally no POST/PUT/DELETE here.
// =====================================================================

const PAGE_SIZE = 50;

export const GET = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.AUDIT_READ)) {
      return fail('You do not have permission to perform this action', 403);
    }

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const entityType = url.searchParams.get('entityType') ?? '';
    const action = url.searchParams.get('action') ?? '';
    const userId = url.searchParams.get('userId') ?? '';
    const dateFrom = url.searchParams.get('dateFrom') ?? '';
    const dateTo = url.searchParams.get('dateTo') ?? '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const format = url.searchParams.get('format') ?? '';

    const where = {
      ...(q
        ? {
            OR: [
              { entityId: { contains: q } },
              { action: { contains: q.toUpperCase() } },
            ],
          }
        : {}),
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
      ...(dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)
        ? { createdAt: { gte: new Date(`${dateFrom}T00:00:00`) } }
        : {}),
      ...(dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)
        ? {
            createdAt: {
              ...(dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)
                ? { gte: new Date(`${dateFrom}T00:00:00`) }
                : {}),
              lte: new Date(`${dateTo}T23:59:59.999`),
            },
          }
        : {}),
    };

    if (format === 'csv') {
      const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5000 });
      const userMap = await userMapFor(rows.map((r) => r.userId));
      const csv = toCsv(
        ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'IP', 'User Agent'],
        rows.map((r) => [
          fmtDateTime(r.createdAt),
          r.userId ? userMap.get(r.userId) ?? r.userId : 'System',
          r.userRole ?? '',
          r.action,
          r.entityType,
          r.entityId ?? '',
          r.ipAddress ?? '',
          r.userAgent ?? '',
        ]),
      );
      await writeAudit({
        ...auditFrom(user, ip, req),
        action: 'EXPORT',
        entityType: 'audit_log',
        after: { format: 'csv', rows: rows.length, filters: { q, entityType, action, userId, dateFrom, dateTo } },
      });
      return csvResponse(`audit-logs-${Date.now()}.csv`, csv);
    }

    const [rows, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.auditLog.count({ where }),
    ]);

    const userMap = await userMapFor(rows.map((r) => r.userId));
    if (!user) throw new ApiError('Authentication required', 401);

    return ok({
      logs: rows.map((r) => ({
        ...r,
        userName: r.userId ? userMap.get(r.userId) ?? r.userId : 'System',
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  },
);

async function userMapFor(ids: (string | null)[]): Promise<Map<string, string>> {
  const valid = ids.filter((x): x is string => Boolean(x));
  if (valid.length === 0) return new Map();
  const rows = await db.user.findMany({
    where: { id: { in: [...new Set(valid)] } },
    select: { id: true, name: true },
  });
  return new Map(rows.map((u) => [u.id, u.name]));
}
