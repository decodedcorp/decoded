"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePipelines } from "@/lib/hooks/admin/usePipeline";
import {
  PipelineTable,
  PipelineTableSkeleton,
} from "@/lib/components/admin/pipeline/PipelineTable";
import { PipelineStatusFilter } from "@/lib/components/admin/pipeline/PipelineStatusFilter";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import type { PipelineStatus } from "@/lib/api/admin/pipeline";

// ─── Inner component (needs Suspense boundary for useSearchParams) ────────────

function PipelineLogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read pagination and filter state from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const statusParam = searchParams.get("status");
  const currentStatus =
    statusParam && statusParam !== ""
      ? (statusParam as PipelineStatus)
      : undefined;

  // Accordion expansion is local state only (not URL-synced — per-session UX)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch list data via React Query
  const pipelinesQuery = usePipelines(currentStatus, currentPage, 15);

  // ─── URL helpers ───────────────────────────────────────────────────────────

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
      router.replace(`/admin/pipeline-logs?${newParams.toString()}`);
    },
    [searchParams, router]
  );

  const handleStatusChange = useCallback(
    (status: PipelineStatus | undefined) => {
      // Reset to page 1 when changing filter; collapse any expanded row
      setExpandedId(null);
      updateUrl({ status, page: "1" });
    },
    [updateUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setExpandedId(null);
      updateUrl({ page: page.toString() });
    },
    [updateUrl]
  );

  const handleSelectPipeline = useCallback((id: string) => {
    // Toggle expansion: clicking an already-expanded row collapses it
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const totalPages = pipelinesQuery.data
    ? Math.ceil(pipelinesQuery.data.total / pipelinesQuery.data.pageSize)
    : 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Pipeline Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI processing pipeline execution logs
        </p>
      </div>

      {/* Status filter */}
      <PipelineStatusFilter
        value={currentStatus}
        onChange={handleStatusChange}
      />

      {/* Table with skeleton fallback */}
      {pipelinesQuery.isLoading || pipelinesQuery.isError ? (
        <PipelineTableSkeleton />
      ) : pipelinesQuery.data ? (
        <>
          <PipelineTable
            data={pipelinesQuery.data.data}
            onSelectPipeline={handleSelectPipeline}
            expandedId={expandedId}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <PipelineTableSkeleton />
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

/**
 * Pipeline Logs page — lists all AI pipeline executions with status filtering,
 * URL-synced pagination, and expandable step-by-step accordion rows.
 *
 * Satisfies: PIPE-01 (list), PIPE-02 (step detail), PIPE-03 (error filter + retry)
 * URL params: ?page=N&status=completed|running|failed
 */
export default function PipelineLogsPage() {
  return (
    <Suspense fallback={<PipelineTableSkeleton />}>
      <PipelineLogsContent />
    </Suspense>
  );
}
