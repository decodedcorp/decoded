const requestLog = new Map<string, number[]>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * In-memory sliding window rate limiter.
 * NOTE: State is per-process — not shared across serverless instances.
 * Acceptable for single-server deployment (Redis excluded per REQUIREMENTS.md).
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length <= opts.max;
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export function rateLimitResponse(retryAfterSeconds = 60): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}
