"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminPagination,
  AdminEmptyState,
} from "@/lib/components/admin/common";
import { usePostSpotList, type PostSpot } from "@/lib/api/admin/seed";

function PostSpotsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? 1);

  const { data, isLoading, isError } = usePostSpotList(currentPage, 20);

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`/admin/seed/post-spots?${next.toString()}`);
    },
    [searchParams, router]
  );

  const spots = data?.data ?? [];
  const pagination = data?.pagination;
  const isEmpty = !isLoading && !isError && spots.length === 0;

  const columns: Column<PostSpot>[] = [
    {
      key: "seed_post_id",
      label: "Post ID",
      render: (row) => (
        <span className="font-mono text-xs text-gray-400">
          {row.seed_post_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "position_left",
      label: "Left",
      render: (row) => (
        <span className="text-sm text-gray-300">{row.position_left}</span>
      ),
    },
    {
      key: "position_top",
      label: "Top",
      render: (row) => (
        <span className="text-sm text-gray-300">{row.position_top}</span>
      ),
    },
    {
      key: "request_order",
      label: "Order",
      render: (row) => (
        <span className="text-sm text-gray-300">{row.request_order}</span>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Post Spots</h1>
        <p className="text-sm text-gray-400 mt-1">
          Item annotation spots on seed posts
          {pagination && (
            <span className="ml-2 text-gray-500">
              ({pagination.total_items} total)
            </span>
          )}
        </p>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-800/40 bg-red-900/10 py-12 text-center">
          <p className="text-sm text-red-400">
            Failed to load post spots. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <AdminEmptyState
            icon={<MapPin className="w-12 h-12" />}
            title="No spots annotated yet"
            description="Spots are created during the seed curation process and will appear here once available."
          />
        </div>
      )}

      {/* Table */}
      {!isError && !isEmpty && (
        <AdminDataTable
          columns={columns}
          data={spots}
          rowKey={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No spots have been annotated yet. Spots are created during the seed curation process."
        />
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <AdminPagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(page) => updateUrl({ page: String(page) })}
        />
      )}
    </div>
  );
}

export default function PostSpotsPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}
    >
      <PostSpotsPageContent />
    </Suspense>
  );
}
