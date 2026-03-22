/**
 * Mock data generators for server request logs.
 *
 * No real server log tables exist in the database — all log data is
 * generated deterministically so that the same entry index always produces
 * the same values across server restarts and requests.
 *
 * Uses the same djb2-style hashing as other admin mock-data files.
 * The stream endpoint intentionally generates non-deterministic entries
 * for a realistic real-time polling experience.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface ServerLogEntry {
  /** Unique log entry ID */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  level: LogLevel;
  /** Human-readable log message */
  message: string;
  /** HTTP method */
  method: string;
  /** API endpoint path */
  endpoint: string;
  /** HTTP status code */
  statusCode: number;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Requesting user ID (optional) */
  userId?: string;
  /** User agent string (optional) */
  userAgent?: string;
  /** Client IP address (optional) */
  ip?: string;
}

// ─── Deterministic hash ───────────────────────────────────────────────────────

/**
 * Simple deterministic hash of a string → integer in [0, modulo).
 * Uses djb2-style hashing so the same input always returns the same output.
 * Reimplemented locally — not a shared import (matches ai-cost-mock-data.ts pattern).
 */
function deterministicInt(seed: string, modulo: number): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % modulo;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

const ENDPOINT_POOL = [
  "/api/v1/posts",
  "/api/v1/posts/{id}",
  "/api/v1/users/me",
  "/api/v1/categories",
  "/api/v1/posts/analyze",
  "/api/v1/posts/upload",
  "/api/v1/solutions/{id}",
  "/api/v1/spots/{id}",
  "/api/v1/search",
];

const HTTP_METHODS = ["GET", "POST", "PATCH", "DELETE"];

/** HTTP method weights: GET 60%, POST 25%, PATCH 10%, DELETE 5% */
const METHOD_WEIGHTS = [60, 85, 95, 100]; // cumulative thresholds out of 100

const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Decoded-iOS/2.1.0 (iPhone; iOS 17.2)",
  "Decoded-Android/2.1.0 (Android 14)",
];

const IP_ADDRESSES = [
  "203.0.113.42",
  "198.51.100.17",
  "192.0.2.88",
  "203.0.113.101",
  "198.51.100.254",
  "192.0.2.33",
  "203.0.113.200",
  "198.51.100.9",
];

// ─── Level distribution ───────────────────────────────────────────────────────

/**
 * Returns a log level based on a deterministic value in [0, 100).
 * Distribution: ~60% info, ~20% warn, ~12% error, ~8% debug
 */
function levelForValue(value: number): LogLevel {
  if (value < 60) return "info";
  if (value < 80) return "warn";
  if (value < 92) return "error";
  return "debug";
}

// ─── Derived data helpers ─────────────────────────────────────────────────────

/** Returns the HTTP method based on a deterministic value in [0, 100) */
function methodForValue(value: number): string {
  for (let i = 0; i < METHOD_WEIGHTS.length; i++) {
    if (value < METHOD_WEIGHTS[i]) return HTTP_METHODS[i];
  }
  return "GET";
}

/** Returns status code appropriate for the log level */
function statusCodeForLevel(level: LogLevel, seed: string): number {
  if (level === "info") {
    // 200 or 201
    return deterministicInt(seed + ":sc", 2) === 0 ? 200 : 201;
  }
  if (level === "warn") {
    const codes = [400, 401, 403, 404];
    return codes[deterministicInt(seed + ":sc", codes.length)];
  }
  if (level === "error") {
    const codes = [500, 502, 503];
    return codes[deterministicInt(seed + ":sc", codes.length)];
  }
  // debug: typically 200
  return 200;
}

/** Returns response time (ms) appropriate for the log level */
function responseTimeForLevel(level: LogLevel, seed: string): number {
  if (level === "info") {
    return 50 + deterministicInt(seed + ":rt", 251); // 50-300ms
  }
  if (level === "warn") {
    return 200 + deterministicInt(seed + ":rt", 601); // 200-800ms
  }
  if (level === "error") {
    return 500 + deterministicInt(seed + ":rt", 4501); // 500-5000ms
  }
  // debug: fast
  return 10 + deterministicInt(seed + ":rt", 91); // 10-100ms
}

/** Builds a realistic log message from level, method, endpoint, status, and response time */
function buildMessage(
  level: LogLevel,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number
): string {
  if (level === "info") {
    return `${method} ${endpoint} ${statusCode} ${responseTimeMs}ms`;
  }
  if (level === "warn") {
    if (responseTimeMs > 600) {
      return `Slow query: ${method} ${endpoint} ${responseTimeMs}ms`;
    }
    if (statusCode === 401) {
      return `Unauthorized request: ${method} ${endpoint}`;
    }
    if (statusCode === 403) {
      return `Forbidden: insufficient permissions for ${method} ${endpoint}`;
    }
    return `Client error: ${method} ${endpoint} ${statusCode} ${responseTimeMs}ms`;
  }
  if (level === "error") {
    if (statusCode === 500) {
      return `Internal server error: database connection timeout`;
    }
    if (statusCode === 502) {
      return `Bad gateway: upstream service unavailable for ${endpoint}`;
    }
    return `Service unavailable: ${endpoint} exceeded retry limit`;
  }
  // debug
  return `[DEBUG] ${method} ${endpoint} → cache ${Math.random() > 0.5 ? "HIT" : "MISS"} ${responseTimeMs}ms`;
}

// ─── Timestamp generator ──────────────────────────────────────────────────────

/**
 * Generates a deterministic timestamp for a log entry index.
 * Spreads 200 entries over the last 24 hours with higher density for recent entries.
 * Index 0 is most recent; index 199 is oldest.
 */
function timestampForIndex(index: number): string {
  // Non-linear distribution: more recent entries cluster near index 0
  // First 50 entries within last 2 hours, rest spread over 24 hours
  const maxMinutes = index < 50 ? 120 : 1440;
  const minutesAgo =
    deterministicInt(`slog-${index}:min`, maxMinutes) +
    Math.floor((index / 200) * maxMinutes * 0.5);

  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  d.setSeconds(deterministicInt(`slog-${index}:sec`, 60), 0);
  return d.toISOString();
}

// ─── Main generators ──────────────────────────────────────────────────────────

let _cachedLogs: ServerLogEntry[] | null = null;

/**
 * Generates deterministic server log entries.
 *
 * Results are cached in-process for performance (module-level singleton).
 * Level distribution: ~60% info | ~20% warn | ~12% error | ~8% debug
 *
 * @param count - Number of entries to generate (default 200)
 */
export function generateServerLogs(count: number = 200): ServerLogEntry[] {
  if (_cachedLogs) return _cachedLogs;

  const logs: ServerLogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const base = `slog-${i}`;

    // Level: 0-99 value mapped to distribution
    const levelValue = deterministicInt(base + ":level", 100);
    const level = levelForValue(levelValue);

    // Method: weighted random
    const methodValue = deterministicInt(base + ":method", 100);
    const method = methodForValue(methodValue);

    // Endpoint
    const endpointIndex = deterministicInt(
      base + ":endpoint",
      ENDPOINT_POOL.length
    );
    const endpoint = ENDPOINT_POOL[endpointIndex];

    // Status code, response time
    const statusCode = statusCodeForLevel(level, base);
    const responseTimeMs = responseTimeForLevel(level, base);

    // Message
    const message = buildMessage(
      level,
      method,
      endpoint,
      statusCode,
      responseTimeMs
    );

    // Optional fields (70% have userId, 80% have userAgent, 90% have IP)
    const hasUserId = deterministicInt(base + ":has-uid", 10) < 7;
    const hasUserAgent = deterministicInt(base + ":has-ua", 10) < 8;
    const hasIp = deterministicInt(base + ":has-ip", 10) < 9;

    const entry: ServerLogEntry = {
      id: `slog-${3001 + i}`,
      timestamp: timestampForIndex(i),
      level,
      message,
      method,
      endpoint,
      statusCode,
      responseTimeMs,
    };

    if (hasUserId) {
      entry.userId = `user-${1000 + deterministicInt(base + ":uid", 999)}`;
    }
    if (hasUserAgent) {
      const uaIndex = deterministicInt(base + ":ua", USER_AGENTS.length);
      entry.userAgent = USER_AGENTS[uaIndex];
    }
    if (hasIp) {
      const ipIndex = deterministicInt(base + ":ip", IP_ADDRESSES.length);
      entry.ip = IP_ADDRESSES[ipIndex];
    }

    logs.push(entry);
  }

  _cachedLogs = logs;
  return logs;
}

// ─── Stream generator ─────────────────────────────────────────────────────────

/** Counter to generate unique stream IDs */
let _streamCounter = 0;

/**
 * Generates 1-3 fresh log entries for the streaming/polling endpoint.
 *
 * Intentionally NON-deterministic — uses Date.now() for realistic streaming.
 * Each call produces new entries as if they just arrived from the server.
 *
 * @param sinceId - Optional: only return entries after this ID
 */
export function generateStreamLogs(sinceId?: string): ServerLogEntry[] {
  const count = 1 + Math.floor(Math.random() * 3); // 1-3 entries
  const entries: ServerLogEntry[] = [];

  const levels: LogLevel[] = ["info", "info", "info", "warn", "error", "debug"];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    _streamCounter++;
    const id = `slog-stream-${Date.now()}-${_streamCounter}`;

    const level = levels[Math.floor(Math.random() * levels.length)];
    const method = methodForValue(Math.floor(Math.random() * 100));
    const endpoint =
      ENDPOINT_POOL[Math.floor(Math.random() * ENDPOINT_POOL.length)];
    const statusCode = statusCodeForLevel(level, id);
    const responseTimeMs = responseTimeForLevel(level, id);
    const message = buildMessage(
      level,
      method,
      endpoint,
      statusCode,
      responseTimeMs
    );

    // Stagger timestamps slightly so each entry in this batch has a unique time
    const entryTime = new Date(now.getTime() - (count - i - 1) * 100);

    entries.push({
      id,
      timestamp: entryTime.toISOString(),
      level,
      message,
      method,
      endpoint,
      statusCode,
      responseTimeMs,
      ip: IP_ADDRESSES[Math.floor(Math.random() * IP_ADDRESSES.length)],
    });
  }

  return entries;
}
