"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import {
  AdminDataTable,
  type Column,
} from "@/lib/components/admin/common/AdminDataTable";
import { AdminBulkActionBar } from "@/lib/components/admin/common/AdminBulkActionBar";
import { AdminImagePreview } from "@/lib/components/admin/common/AdminImagePreview";
import { AdminPagination } from "@/lib/components/admin/common/AdminPagination";
import {
  useApproveCandidate,
  useRejectCandidate,
  type Candidate,
} from "@/lib/api/admin/candidates";

// ─── API hook ─────────────────────────────────────────────────────────────────

interface ReviewQueueResponse {
  data: Candidate[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

function useReviewQueue(page: number, perPage = 20) {
  return useQuery<ReviewQueueResponse>({
    queryKey: ["admin", "review", "list", page, perPage],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      return fetch(`/api/admin/review?${params}`, { signal }).then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      });
    },
    staleTime: 30_000,
  });
}

// ─── Inner content ────────────────────────────────────────────────────────────

function ReviewQueueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<"approve" | "reject" | null>(
    null
  );

  const reviewQuery = useReviewQueue(currentPage);
  const approveMutation = useApproveCandidate();
  const rejectMutation = useRejectCandidate();

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.replace(`/admin/review?${params.toString()}`);
      setSelectedIds(new Set());
    },
    [searchParams, router]
  );

  const handleApprove = useCallback(
    (id: string) => {
      approveMutation.mutate(id, {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: ["admin", "review"] }),
      });
    },
    [approveMutation, qc]
  );

  const handleReject = useCallback(
    (id: string) => {
      rejectMutation.mutate(id, {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: ["admin", "review"] }),
      });
    },
    [rejectMutation, qc]
  );

  const handleBulkApprove = useCallback(async () => {
    if (bulkLoading) return;
    setBulkLoading("approve");
    for (const id of selectedIds) {
      await fetch(`/api/admin/candidates/${id}/approve`, { method: "POST" });
    }
    setSelectedIds(new Set());
    setBulkLoading(null);
    qc.invalidateQueries({ queryKey: ["admin", "review"] });
  }, [bulkLoading, selectedIds, qc]);

  const handleBulkReject = useCallback(async () => {
    if (bulkLoading) return;
    setBulkLoading("reject");
    for (const id of selectedIds) {
      await fetch(`/api/admin/candidates/${id}/reject`, { method: "POST" });
    }
    setSelectedIds(new Set());
    setBulkLoading(null);
    qc.invalidateQueries({ queryKey: ["admin", "review"] });
  }, [bulkLoading, selectedIds, qc]);

  const columns: Column<Candidate>[] = [
    {
      key: "image",
      label: "Image",
      render: (row) =>
        row.image_url ? (
          <AdminImagePreview src={row.image_url} alt="candidate" size="md" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
            N/A
          </div>
        ),
    },
    {
      key: "context",
      label: "Context",
      className: "max-w-xs",
      render: (row) =>
        row.context ? (
          <span
            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3"
            title={row.context}
          >
            {row.context}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "artist_account_id",
      label: "Artist",
      render: (row) =>
        row.artist_account_id ? (
          <span
            className="font-mono text-xs text-gray-500 truncate block max-w-[140px]"
            title={row.artist_account_id}
          >
            {row.artist_account_id.slice(0, 12)}…
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleApprove(row.id)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
            title="Approve"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => handleReject(row.id)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
            title="Reject"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      ),
    },
  ];

  const pendingCount = reviewQuery.data?.pagination.total_items ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Review Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Approve or reject candidates pending review
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Error states */}
      {approveMutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          Approve failed: {approveMutation.error.message}
        </div>
      )}
      {rejectMutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          Reject failed: {rejectMutation.error.message}
        </div>
      )}

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={reviewQuery.data?.data ?? []}
        rowKey={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        isLoading={reviewQuery.isLoading}
        skeletonRows={5}
        emptyMessage="All caught up! No items pending review."
      />

      {/* Pagination */}
      {reviewQuery.data && (
        <AdminPagination
          currentPage={reviewQuery.data.pagination.current_page}
          totalPages={reviewQuery.data.pagination.total_pages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Bulk action bar */}
      <AdminBulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            key: "bulk-approve",
            label: "Approve All Selected",
            onClick: handleBulkApprove,
            loading: bulkLoading === "approve",
          },
          {
            key: "bulk-reject",
            label: "Reject All Selected",
            variant: "danger",
            onClick: handleBulkReject,
            loading: bulkLoading === "reject",
          },
        ]}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-72 mt-1 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
          </div>
          <div className="h-64 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse" />
        </div>
      }
    >
      <ReviewQueueContent />
    </Suspense>
  );
}
