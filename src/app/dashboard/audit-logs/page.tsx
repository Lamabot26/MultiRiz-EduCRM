import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AuditLogFilters } from '@/components/audit/audit-log-filters';
import { CopyButton } from '@/components/audit/copy-button';
import { fmtDateTime } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

const COMMON_ACTIONS = [
  'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
  'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_GUARDIAN_ADD', 'STUDENT_GUARDIAN_UPDATE',
  'STUDENT_DOCUMENT_CREATE', 'STUDENT_DOCUMENT_DELETE',
  'APPROVED_CONTACT_CREATE', 'APPROVED_CONTACT_DECISION', 'APPROVED_CONTACT_REMOVED',
  'ATTENDANCE_MARK', 'CLASS_CREATE', 'SECTION_CREATE', 'SESSION_CREATE',
  'USER_CREATE', 'USER_UPDATE', 'SETTINGS_UPDATE',
  'NOTICE_CREATE', 'NOTICE_UPDATE', 'NOTICE_DELETE',
  'EVENT_CREATE', 'EVENT_UPDATE', 'EVENT_DELETE',
  'EXPORT',
];

const ENTITY_TYPES = [
  'user', 'student', 'guardian', 'approved_contact', 'student_document',
  'attendance', 'class', 'section', 'academic_session',
  'notice', 'event', 'invoice', 'payment', 'lead', 'application', 'setting', 'audit_log',
];

type SP = {
  q?: string; entityType?: string; action?: string; userId?: string;
  dateFrom?: string; dateTo?: string; page?: string;
};

function trunc(v: string | null | undefined, n: number): string {
  if (!v) return '';
  return v.length > n ? `${v.slice(0, n)}…` : v;
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.AUDIT_READ)) redirect('/dashboard?denied=1');

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const entityType = sp.entityType ?? '';
  const action = sp.action ?? '';
  const userId = sp.userId ?? '';
  const dateFrom = sp.dateFrom ?? '';
  const dateTo = sp.dateTo ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

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

  const [logs, total, users] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 200 }),
  ]);

  const nameMap = new Map(users.map((u) => [u.id, u.name]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportParams = new URLSearchParams({ format: 'csv' });
  if (q) exportParams.set('q', q);
  if (entityType) exportParams.set('entityType', entityType);
  if (action) exportParams.set('action', action);
  if (userId) exportParams.set('userId', userId);
  if (dateFrom) exportParams.set('dateFrom', dateFrom);
  if (dateTo) exportParams.set('dateTo', dateTo);

  const pageParams = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (entityType) params.set('entityType', entityType);
    if (action) params.set('action', action);
    if (userId) params.set('userId', userId);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(p));
    return `/dashboard/audit-logs?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Append-only trail of every sensitive action. Read-only — nothing here can be edited or deleted.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/audit-logs?${exportParams.toString()}`}>
            <Download className="mr-2 h-4 w-4" aria-hidden /> Export CSV
          </a>
        </Button>
      </div>

      <AuditLogFilters users={users} entityTypes={ENTITY_TYPES} actions={COMMON_ACTIONS} />

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No audit entries match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Before → After</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>User agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="align-top">
                      <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(log.createdAt)}</TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{log.userId ? nameMap.get(log.userId) ?? trunc(log.userId, 10) : 'System'}</p>
                        {log.userRole && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">{log.userRole}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-muted-foreground">{log.entityType}</p>
                        {log.entityId && (
                          <div className="flex items-center gap-1">
                            <code className="max-w-[110px] truncate font-mono text-[10px]" title={log.entityId}>{log.entityId}</code>
                            <CopyButton value={log.entityId} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.beforeData || log.afterData ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              {trunc(log.beforeData ?? '(none)', 60)} → {trunc(log.afterData ?? '(none)', 60)}
                            </summary>
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold">Before</p>
                              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-[10px]">{log.beforeData ?? '(none)'}</pre>
                              <p className="font-semibold">After</p>
                              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-[10px]">{log.afterData ?? '(none)'}</pre>
                            </div>
                          </details>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress ?? '—'}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={log.userAgent ?? undefined}>
                        {log.userAgent ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} entries</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? <a href={pageParams(page - 1)}>Previous</a> : <span>Previous</span>}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? <a href={pageParams(page + 1)}>Next</a> : <span>Next</span>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
