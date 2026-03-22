"use client";

import type { ServerLogEntry, LogLevel } from "@/lib/api/admin/server-logs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogTableProps {
  data: ServerLogEntry[];
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const LEVEL_BADGE_STYLES: Record<LogLevel, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  warn: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  debug:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const METHOD_STYLES: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PATCH: "text-yellow-600 dark:text-yellow-400",
  PUT: "text-yellow-600 dark:text-yellow-400",
  DELETE: "text-red-600 dark:text-red-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Returns the color class for an HTTP status code. */
function statusCodeColor(code: number): string {
  if (code >= 500) return "text-red-600 dark:text-red-400 font-medium";
  if (code >= 400) return "text-yellow-600 dark:text-yellow-400 font-medium";
  if (code >= 200) return "text-emerald-600 dark:text-emerald-400";
  return "text-gray-600 dark:text-gray-400";
}

/** Returns row background class for error-level entries. */
function rowBackground(entry: ServerLogEntry): string {
  if (entry.statusCode >= 500) {
    return "bg-red-50/50 dark:bg-red-900/10";
  }
  return "";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: LogLevel }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${LEVEL_BADGE_STYLES[level]}`}
    >
      {level}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Skeleton loader for the log table — 10 shimmer rows.
 */
export function LogTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex gap-4">
          {[120, 60, 60, 200, 80, 80, 200].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: w }}
            />
          ))}
        </div>
        {/* 10 data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-100 dark:border-gray-800 last:border-0 px-4 py-3 flex gap-4 items-center"
          >
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Table displaying server log entries with color-coded levels, methods,
 * and status codes. Error rows (5xx) get a subtle red background.
 */
export function LogTable({ data }: LogTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
          No log entries found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Time (ms)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr
                key={entry.id}
                className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${rowBackground(entry)}`}
              >
                {/* Timestamp */}
                <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatRelativeTime(entry.timestamp)}
                </td>

                {/* Level badge */}
                <td className="px-4 py-2">
                  <LevelBadge level={entry.level} />
                </td>

                {/* HTTP method */}
                <td className="px-4 py-2">
                  <span
                    className={`text-xs font-mono font-semibold ${METHOD_STYLES[entry.method] ?? "text-gray-600 dark:text-gray-400"}`}
                  >
                    {entry.method}
                  </span>
                </td>

                {/* Endpoint */}
                <td className="px-4 py-2">
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate max-w-[200px] block">
                    {entry.endpoint}
                  </span>
                </td>

                {/* Status code */}
                <td className="px-4 py-2">
                  <span
                    className={`text-xs font-mono tabular-nums ${statusCodeColor(entry.statusCode)}`}
                  >
                    {entry.statusCode}
                  </span>
                </td>

                {/* Response time */}
                <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                  {entry.responseTimeMs}ms
                </td>

                {/* Message (truncated) */}
                <td className="px-4 py-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[240px] block">
                    {entry.message}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
