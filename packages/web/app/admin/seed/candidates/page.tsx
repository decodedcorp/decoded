"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminBulkActionBar,
  type BulkAction,
  AdminImagePreview,
  AdminPagination,
} from "@/lib/components/admin/common";
import {
  useCandidateList,
  useApproveCandidate,
  useRejectCandidate,
  type Candidate,
} from "@/lib/api/admin/candidates";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Ready", value: "ready" },
  { label: "Published", value: "published" },
  { label: "Rejected", value: "rejected" },
  { label: "Error", value: "error" },
];

function CandidatesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? 1);
  const currentStatus = searchParams.get("status") ?? "";
  const searchQuery = searchParams.get("search") ?? "";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useCandidateList(currentPage, 20, currentStatus, searchQuery);
  const approveCandidate = useApproveCandidate();
  const rejectCandidate = useRejectCandidate();

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`/admin/seed/candidates?${next.toString()}`);
    },
    [searchParams, router]
  );

  const handleApproveSelected = () => {
    Array.from(selectedIds).forEach((id) => approveCandidate.mutate(id));
    setSelectedIds(new Set());
  };

  const handleRejectSelected = () => {
    Array.from(selectedIds).forEach((id) => rejectCandidate.mutate(id));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const candidates = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: Column<Candidate>[] = [
    {
      key: "select",
      label: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
        />
      ),
    },
    {
      key: "image_url",
      label: "Image",
      render: (row) => (
        <AdminImagePreview src={row.image_url} alt="candidate" size="md" />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "context",
      label: "Context",
      render: (row) =>
        row.context ? (
          <span className="text-sm text-gray-300 line-clamp-2 max-w-xs">
            {row.context.length > 80 ? row.context.slice(0, 80) + "…" : row.context}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
    {
      key: "artist_account_id",
      label: "Artist Account",
      render: (row) =>
        row.artist_account_id ? (
          <span className="font-mono text-xs text-gray-400">
            {row.artist_account_id.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => (
        <span className="text-xs text-gray-400">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: "approve",
      label: "Approve Selected",
      icon: CheckCircle,
      onClick: handleApproveSelected,
      loading: approveCandidate.isPending,
    },
    {
      key: "reject",
      label: "Reject Selected",
      variant: "danger",
      icon: XCircle,
      onClick: handleRejectSelected,
      loading: rejectCandidate.isPending,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Candidates</h1>
        <p className="text-sm text-gray-400 mt-1">
          Seed post candidates for curation
          {pagination && (
            <span className="ml-2 text-gray-500">({pagination.total_items} total)</span>
          )}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateUrl({ status: tab.value || undefined, page: "1" })}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              currentStatus === tab.value
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={candidates}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/admin/seed/candidates/${row.id}`)}
        emptyMessage="No candidates found"
      />

      {/* Pagination */}
      {pagination && (
        <AdminPagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(page) => updateUrl({ page: String(page) })}
        />
      )}

      {/* Bulk Action Bar */}
      <AdminBulkActionBar
        selectedCount={selectedIds.size}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}>
      <CandidatesPageContent />
    </Suspense>
  );
}
