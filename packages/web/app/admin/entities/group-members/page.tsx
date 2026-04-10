"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminPagination,
} from "@/lib/components/admin/common";
import { useGroupMemberList, type GroupMember } from "@/lib/api/admin/entities";

// ─── Inner page ───────────────────────────────────────────────────────────────

function GroupMembersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? 1);

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`/admin/entities/group-members?${next.toString()}`);
    },
    [searchParams, router]
  );

  const { data, isLoading } = useGroupMemberList(currentPage, 20);

  const columns: Column<GroupMember>[] = [
    {
      key: "artist_id",
      label: "Artist ID",
      render: (row) => (
        <span className="font-mono text-xs text-gray-300" title={row.artist_id}>
          {row.artist_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "group_id",
      label: "Group ID",
      render: (row) => (
        <span className="font-mono text-xs text-gray-300" title={row.group_id}>
          {row.group_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (
        <AdminStatusBadge status={row.is_active ? "active" : "hidden"} />
      ),
    },
    {
      key: "metadata",
      label: "Metadata",
      render: (row) =>
        row.metadata && Object.keys(row.metadata).length > 0 ? (
          <span className="text-xs text-gray-400 font-mono">
            {JSON.stringify(row.metadata).slice(0, 40)}
            {JSON.stringify(row.metadata).length > 40 ? "…" : ""}
          </span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        ),
    },
  ];

  const members = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Group Members</h1>
        <p className="text-sm text-gray-400 mt-1">
          Read-only view of artist–group relationships
          {pagination && (
            <span className="ml-2 text-gray-500">
              ({pagination.total_items} total)
            </span>
          )}
        </p>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={members}
        rowKey={(row) => `${row.artist_id}:${row.group_id}`}
        isLoading={isLoading}
        emptyMessage="No group members found"
      />

      {/* Pagination */}
      {pagination && (
        <AdminPagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(page) => updateUrl({ page: String(page) })}
        />
      )}
    </div>
  );
}

export default function GroupMembersPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}
    >
      <GroupMembersPageContent />
    </Suspense>
  );
}
