"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuditList } from "@/lib/hooks/admin/useAudit";
import { AuditTable } from "@/lib/components/admin/audit/AuditTable";
import { AuditTableSkeleton } from "@/lib/components/admin/audit/AuditTableSkeleton";
import { StatusFilter } from "@/lib/components/admin/audit/StatusFilter";
import { AuditDetailModal } from "@/lib/components/admin/audit/AuditDetailModal";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import { AdminEmptyState } from "@/lib/components/admin/common";
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

  const isEmpty =
    !listQuery.isLoading && listQuery.data?.data.length === 0 && !currentStatus;

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
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            }
            title="No audit requests"
            description="AI analysis audit records will appear here when images are submitted for detection review."
          />
        </div>
      ) : (
        <>
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

          {/* Detail modal */}
          {selectedRequestId && (
            <AuditDetailModal
              requestId={selectedRequestId}
              onClose={() => setSelectedRequestId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function AiAuditPage() {
  return (
    <Suspense fallback={<AuditTableSkeleton />}>
      <AiAuditContent />
    </Suspense>
  );
}
