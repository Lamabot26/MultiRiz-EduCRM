import { db } from './db';

// =====================================================================
// Audit framework — every sensitive action MUST call writeAudit().
// Audit rows are append-only; never updated or deleted by the app.
// =====================================================================

export type AuditInput = {
  userId?: string | null;
  userRole?: string | null;
  action: string; // LOGIN | LOGIN_FAILED | LOGOUT | USER_CREATE | STUDENT_CREATE | ...
  entityType: string; // user | lead | student | invoice | payment | ...
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        userRole: input.userRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeData: input.before !== undefined ? JSON.stringify(summarize(input.before)) : null,
        afterData: input.after !== undefined ? JSON.stringify(summarize(input.after)) : null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // Never let audit failures break business flow — log to error table too.
    console.error('[audit] failed to write audit log', err);
    try {
      await db.errorLog.create({
        data: { level: 'error', message: 'audit_write_failed', context: JSON.stringify({ action: input.action, entityType: input.entityType }) },
      });
    } catch { /* ignore */ }
  }
}

const SENSITIVE_KEYS = ['passwordHash', 'password', 'signature', 'gatewaySignature', 'token'];
const MAX_JSON = 4000;

function summarize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  const clone: Record<string, unknown> = Array.isArray(value)
    ? (value as unknown[])[0] as Record<string, unknown> ?? {}
    : { ...(value as Record<string, unknown>) };
  for (const k of SENSITIVE_KEYS) delete clone[k];
  const json = JSON.stringify(clone);
  if (json && json.length > MAX_JSON) return { _truncated: true };
  return clone;
}
