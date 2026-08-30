import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { db } from './db';
import { writeAudit } from './audit';
import { getApiUser, hasPermission, type AuthUser } from './auth-guard';
import { type PermissionKey } from './rbac';
import { rateLimit, clientIp } from './rate-limit';

// =====================================================================
// API helpers — uniform JSON envelope, zod validation, RBAC guard,
// rate limiting and error handling for every route handler.
// =====================================================================

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type HandlerOptions = {
  permission?: PermissionKey;
  roles?: string[];
  rateLimit?: { key: string; limit: number; windowMs: number };
};

/** Wraps a route handler with auth + permission + rate limit + error envelope. */
export function withApi(
  handler: (req: Request, ctx: { user: AuthUser | null; ip: string }) => Promise<Response>,
  options: HandlerOptions = {},
) {
  return async (req: Request): Promise<Response> => {
    try {
      const ip = clientIp(new Headers(req.headers));
      if (options.rateLimit) {
        const rl = rateLimit(`${options.rateLimit.key}:${ip}`, options.rateLimit.limit, options.rateLimit.windowMs);
        if (!rl.allowed) return fail('Too many requests. Please try again later.', 429, { retryAfterMs: rl.retryAfterMs });
      }
      const user = await getApiUser();
      if (options.permission && !user) return fail('Authentication required', 401);
      if (options.permission && user && !hasPermission(user, options.permission)) {
        return fail('You do not have permission to perform this action', 403);
      }
      if (options.roles && (!user || !options.roles.some((r) => user.roles.includes(r)))) {
        return fail('You do not have permission to perform this action', 403);
      }
      return await handler(req, { user, ip });
    } catch (err) {
      return handleError(err, req);
    }
  };
}

export function handleError(err: unknown, req?: Request): Response {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return fail(first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input', 422);
  }
  if (err instanceof ApiError) return fail(err.message, err.status);
  console.error('[api]', err);
  // persist for ops dashboards
  db.errorLog.create({
    data: {
      level: 'error',
      message: err instanceof Error ? err.message.slice(0, 500) : 'unknown_error',
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
      path: req?.url ? new URL(req.url).pathname : undefined,
    },
  }).catch(() => {});
  return fail('Something went wrong. Please try again.', 500);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError('Invalid JSON body', 400);
  }
  return schema.parse(json);
}

export function auditFrom(user: AuthUser | null, ip: string, req?: Request) {
  return {
    userId: user?.id ?? null,
    userRole: user?.roles?.[0] ?? null,
    ipAddress: ip,
    userAgent: req ? new Headers(req.headers).get('user-agent') ?? null : null,
  };
}

export { writeAudit };
