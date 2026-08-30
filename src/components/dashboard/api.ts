'use client';

// =====================================================================
// Shared client fetch helper — uniform error handling for all dashboard
// client islands. Every API route replies with the envelope
// { success, data?, error? } from src/lib/api-helpers.ts.
// =====================================================================

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
} & Record<string, unknown>;

export type ApiFetchError = Error & {
  status?: number;
  data?: ApiEnvelope;
};

/**
 * apiFetch — relative-URL fetch that returns the parsed envelope on
 * success and throws an Error (with .status / .data attached) on failure,
 * so forms can `toast({ title: err.message })` uniformly.
 */
export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body && !(typeof init.body === 'string') ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Network error — please check your connection and try again.');
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok || !json?.success) {
    const err = new Error(
      (json?.error as string) || `Request failed (${res.status})`,
    ) as ApiFetchError;
    err.status = res.status;
    err.data = json ?? undefined;
    throw err;
  }
  return json;
}
