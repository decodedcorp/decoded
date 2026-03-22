/**
 * Admin server logs data fetching layer (server-side only).
 *
 * All data is mock — no real server log tables exist in the database.
 * Provides paginated list retrieval with level/search/date filtering,
 * and a stream endpoint for real-time polling.
 */

import {
  generateServerLogs,
  generateStreamLogs,
  type ServerLogEntry,
  type LogLevel,
} from "./server-logs-mock-data";

// Re-export types so consumers only need to import from this module
export type { ServerLogEntry, LogLevel };

// ─── Request/response types ───────────────────────────────────────────────────

export interface ServerLogListParams {
  /** 1-based page number (default 1) */
  page?: number;
  /** Items per page (default 50) */
  pageSize?: number;
  /** Filter by log level (optional, undefined = all) */
  level?: LogLevel;
  /** Search text — matches against message and endpoint (case-insensitive) */
  search?: string;
  /** Start of date range (ISO 8601 string, optional) */
  from?: string;
  /** End of date range (ISO 8601 string, optional) */
  to?: string;
}

export interface ServerLogListResponse {
  data: ServerLogEntry[];
  /** Total matching records (for pagination) */
  total: number;
  page: number;
  pageSize: number;
}

export interface ServerLogStreamResponse {
  entries: ServerLogEntry[];
  /** ID of the most recent entry in this batch */
  latestId: string;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, filtered list of server log entries.
 *
 * Supports filtering by level, free-text search (message + endpoint),
 * and date range (from/to ISO 8601 strings).
 * Results are sorted by timestamp descending (most recent first).
 */
export async function fetchServerLogs(
  params: ServerLogListParams
): Promise<ServerLogListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));

  let logs = generateServerLogs();

  // Apply level filter
  if (params.level !== undefined) {
    logs = logs.filter((l) => l.level === params.level);
  }

  // Apply free-text search (message or endpoint, case-insensitive)
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.message.toLowerCase().includes(searchLower) ||
        l.endpoint.toLowerCase().includes(searchLower)
    );
  }

  // Apply date range filter
  if (params.from) {
    const fromTime = new Date(params.from).getTime();
    if (!isNaN(fromTime)) {
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= fromTime);
    }
  }
  if (params.to) {
    const toTime = new Date(params.to).getTime();
    if (!isNaN(toTime)) {
      logs = logs.filter((l) => new Date(l.timestamp).getTime() <= toTime);
    }
  }

  // Sort by timestamp descending (most recent first)
  logs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const total = logs.length;

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const pageSlice = logs.slice(startIndex, startIndex + pageSize);

  return {
    data: pageSlice,
    total,
    page,
    pageSize,
  };
}

/**
 * Fetches fresh log entries for streaming/polling.
 *
 * Returns 1-3 new entries per call — non-deterministic by design.
 * The UI calls this endpoint every 2-3 seconds to simulate live log tailing.
 *
 * @param sinceId - Optional ID of the last seen entry (for deduplication in UI)
 */
export async function fetchLogStream(
  sinceId?: string
): Promise<ServerLogStreamResponse> {
  const entries = generateStreamLogs(sinceId);
  const latestId = entries.length > 0 ? entries[entries.length - 1].id : "";
  return { entries, latestId };
}
