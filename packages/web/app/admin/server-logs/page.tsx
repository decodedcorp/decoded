"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useServerLogs } from "@/lib/hooks/admin/useServerLogs";
import {
  LogFilters,
  timeRangeToFrom,
} from "@/lib/components/admin/server-logs/LogFilters";
import {
  LogTable,
  LogTableSkeleton,
} from "@/lib/components/admin/server-logs/LogTable";
import { LogStream } from "@/lib/components/admin/server-logs/LogStream";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import { AdminEmptyState } from "@/lib/components/admin/common";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const DEFAULT_TIME_RANGE = "24h";

// ─── Inner content (needs Suspense for useSearchParams) ───────────────────────

function ServerLogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read filter and pagination state from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const levelParam = searchParams.get("level") ?? undefined;
  const searchParam = searchParams.get("search") ?? "";
  const timeRange = searchParams.get("timeRange") ?? DEFAULT_TIME_RANGE;

  // Compute from ISO from time range preset
  const fromIso = timeRangeToFrom(timeRange);

  // Fetch log data via React Query
  const logsQuery = useServerLogs({
    level: levelParam,
    search: searchParam || undefined,
    from: fromIso,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // ─── URL helpers ────────────────────────────────────────────────────────────

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      router.replace(`/admin/server-logs?${newParams.toString()}`);
    },
    [searchParams, router]
  );

  const handleLevelChange = useCallback(
    (level: string | undefined) => {
      updateUrl({ level, page: "1" });
    },
    [updateUrl]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      updateUrl({ search, page: "1" });
    },
    [updateUrl]
  );

  const handleTimeRangeChange = useCallback(
    (range: string) => {
      updateUrl({ timeRange: range, page: "1" });
    },
    [updateUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: page.toString() });
    },
    [updateUrl]
  );

  // ─── Pagination calculation ──────────────────────────────────────────────────

  const totalPages = logsQuery.data
    ? Math.max(1, Math.ceil(logsQuery.data.total / PAGE_SIZE))
    : 1;

  const isEmpty = !logsQuery.isLoading && logsQuery.data?.total === 0;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Server Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          API request logs, error tracking, and real-time monitoring
        </p>
      </div>

      {isEmpty ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <AdminEmptyState
            icon={
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            }
            title="No server logs available"
            description="Server request logs will appear here when the logging infrastructure is connected."
          />
        </div>
      ) : (
        <>
          {/* ── Section 1: API Request Logs ─────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
              API Request Logs
            </h2>

            {/* Filters */}
            <LogFilters
              level={levelParam}
              search={searchParam}
              timeRange={timeRange}
              onLevelChange={handleLevelChange}
              onSearchChange={handleSearchChange}
              onTimeRangeChange={handleTimeRangeChange}
            />

            {/* Table with skeleton fallback on loading or error */}
            {logsQuery.isLoading || logsQuery.isError ? (
              <LogTableSkeleton />
            ) : logsQuery.data ? (
              <>
                <LogTable data={logsQuery.data.data} />
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <LogTableSkeleton />
            )}
          </section>

          {/* ── Section 2: Live Stream ──────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
              Live Stream
            </h2>
            <LogStream />
          </section>
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ServerLogsPage() {
  return (
    <Suspense fallback={<LogTableSkeleton />}>
      <ServerLogsContent />
    </Suspense>
  );
}
