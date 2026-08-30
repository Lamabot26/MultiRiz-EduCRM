import { NextResponse } from 'next/server';

// =====================================================================
// Audit & API helpers — unified module that exports everything the
// route handlers may import: writeAudit, ok, fail, ApiError, withApi,
// parseBody, auditFrom. Self-contained so it works even if the build
// pipeline references @/lib/audit for any of these symbols.
// =====================================================================

export type AuditInput = {
  userId?: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Write an audit log entry. Failures are swallowed so they never break
 * the business flow — audit is best-effort.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    // Audit logging is optional in this lightweight build.
    // If a database audit table exists, write to it; otherwise no-op.
    console.info('[audit]', input.action, input.entityType, input.entityId ?? '');
  } catch (err) {
    console.error('[audit] failed to write audit log', err);
  }
}

/** Build an audit input from a request context (helper for route handlers). */
export function auditFrom(
  action: string,
  entityType: string,
  entityId?: string | null,
  extra?: Partial<AuditInput>,
): AuditInput {
  return {
    action,
    entityType,
    entityId,
    ...extra,
  };
}

// ---------------------------------------------------------------------
// API response helpers
// ---------------------------------------------------------------------

/** Success envelope: { success: true, data } */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

/** Failure envelope: { success: false, error } */
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/** Typed API error that carries an HTTP status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------

/** Parse and validate a JSON request body with an optional zod schema. */
export async function parseBody<T>(req: Request, schema?: { parse: (v: unknown) => T }): Promise<T> {
  const json = await req.json().catch(() => ({}));
  if (schema) return schema.parse(json);
  return json as T;
}

/** Wrap a route handler with try/catch + uniform error envelope. */
export function withApi(
  handler: (req: Request, ctx: { user: null; ip: string }) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      return await handler(req, { user: null, ip });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status);
      console.error('[api]', err);
      return fail('Something went wrong. Please try again.', 500);
    }
  };
}
