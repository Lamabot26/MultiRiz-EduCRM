import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Kuberns liveness/readiness probe. Never leaks internals.
export async function GET() {
  const checks: Record<string, string> = { app: 'ok' };
  let status = 200;
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'unreachable';
    status = 503;
  }
  return NextResponse.json(
    { status: status === 200 ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status },
  );
}
