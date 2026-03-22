"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuditList } from "@/lib/hooks/admin/useAudit";
import { AuditTable } from "@/lib/components/admin/audit/AuditTable";
import { AuditTableSkeleton } from "@/lib/components/admin/audit/AuditTableSkeleton";
import { StatusFilter } from "@/lib/components/admin/audit/StatusFilter";
import { AuditDetailModal } from "@/lib/components/admin/audit/AuditDetailModal";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import type { AuditStatus } from "@/lib/api/admin/audit";

// ─── Inner component (needs Suspense boundary for useSearchParams) ────────────

function AiAuditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read pagination and filter state from URL
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const statusParam = searchParams.get("status");
  const currentStatus =
    statusParam && statusParam !== ""
      ? (statusParam as AuditStatus)
      : undefined;

  // Modal state is local only (not URL-synced)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  // Fetch list data via React Query
  const listQuery = useAuditList({
    page: currentPage,
    perPage: 10,
    status: currentStatus,
  });

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
      router.replace(`/admin/ai-audit?${newParams.toString()}`);
    },
    [searchParams, router]
  );

  const handleStatusChange = useCallback(
    (status: AuditStatus | undefined) => {
      // Reset to page 1 when changing filter
      updateUrl({ status, page: "1" });
    },
    [updateUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: page.toString() });
    },
    [updateUrl]
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          AI Audit
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and manage AI analysis results
        </p>
      </div>

      {/* Status filter */}
      <StatusFilter
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
      />

      {/* Table with skeleton fallback */}
      {listQuery.isLoading ? (
        <AuditTableSkeleton />
      ) : listQuery.data ? (
        <>
          <AuditTable
            data={listQuery.data.data}
            onRowClick={setSelectedRequestId}
          />

          {listQuery.data.totalPages > 1 && (
            <Pagination
              currentPage={listQuery.data.page}
              totalPages={listQuery.data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <AuditTableSkeleton />
      )}

      {/* Detail modal (portal-like, mounted when a row is selected) */}
      {selectedRequestId && (
        <AuditDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

/**
 * AI Audit page — lists all AI analysis requests with status filtering and
 * pagination. Clicking a row opens a detail modal with image hotspots and
 * inline item editing.
 *
 * URL params: ?page=N&status=pending|completed|error|modified
 */
export default function AiAuditPage() {
  return (
    <Suspense fallback={<AuditTableSkeleton />}>
      <AiAuditContent />
    </Suspense>
  );
}
