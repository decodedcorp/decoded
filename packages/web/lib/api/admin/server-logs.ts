/**
 * Admin server logs data fetching layer (server-side only).
 *
 * No server log tables exist in the database yet.
 * Returns empty data — UI shows an empty state placeholder.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface ServerLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ServerLogListParams {
  page?: number;
  pageSize?: number;
  level?: LogLevel;
  search?: string;
  from?: string;
  to?: string;
}

export interface ServerLogListResponse {
  data: ServerLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServerLogStreamResponse {
  entries: ServerLogEntry[];
  latestId: string;
}

// ─── Data fetchers (empty — no tables yet) ───────────────────────────────────

export async function fetchServerLogs(
  params: ServerLogListParams
): Promise<ServerLogListResponse> {
  return {
    data: [],
    total: 0,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
  };
}

export async function fetchLogStream(
  _sinceId?: string
): Promise<ServerLogStreamResponse> {
  return { entries: [], latestId: "" };
}
