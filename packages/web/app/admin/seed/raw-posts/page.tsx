"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminImagePreview,
  AdminPagination,
} from "@/lib/components/admin/common";
import { useRawPostsList, type RawPostRow } from "@/lib/api/admin/raw-posts";

const PARSE_STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Parsing", value: "parsing" },
  { label: "Parsed", value: "parsed" },
  { label: "Skipped", value: "skipped" },
  { label: "Failed", value: "failed" },
];

const ORIGINAL_STATUS_TABS = [
  { label: "Any original", value: "" },
  { label: "Found", value: "found" },
  { label: "Not found", value: "not_found" },
  { label: "Searching", value: "searching" },
  { label: "Pending", value: "pending" },
  { label: "Skipped", value: "skipped" },
];

function RawPostsListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const parseStatus = searchParams.get("parse_status") ?? "";
  const originalStatus = searchParams.get("original_status") ?? "";
  const platform = searchParams.get("platform") ?? "";

  const { data, isLoading } = useRawPostsList({
    page,
    perPage: 20,
    parseStatus,
    originalStatus,
    platform,
  });

  const updateUrl = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    router.replace(`/admin/seed/raw-posts?${next.toString()}`);
  };

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: Column<RawPostRow>[] = [
    {
      key: "r2_url",
      label: "Composite",
      render: (row) =>
        row.r2_url ? (
          <AdminImagePreview src={row.r2_url} alt={row.external_id} size="md" />
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        ),
    },
    {
      key: "platform",
      label: "Platform",
      render: (row) => (
        <span className="text-sm text-gray-300">{row.platform}</span>
      ),
    },
    {
      key: "external_id",
      label: "External ID",
      render: (row) => (
        <a
          href={row.external_url}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-gray-400 hover:text-blue-400"
          onClick={(e) => e.stopPropagation()}
        >
          {row.external_id}
        </a>
      ),
    },
    {
      key: "parse_status",
      label: "Parse",
      render: (row) => <AdminStatusBadge status={row.parse_status} />,
    },
    {
      key: "original_status",
      label: "Original",
      render: (row) => <AdminStatusBadge status={row.original_status} />,
    },
    {
      key: "seed_post_id",
      label: "Seed",
      render: (row) =>
        row.seed_post_id ? (
          <span className="font-mono text-xs text-gray-400">
            {row.seed_post_id.slice(0, 8)}…
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Raw Posts</h1>
        <p className="text-sm text-gray-400 mt-1">
          Fashion Decode scrape queue — review parse result + original image
          {pagination && (
            <span className="ml-2 text-gray-500">
              ({pagination.total_items} total)
            </span>
          )}
        </p>
      </div>

      {/* parse_status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700 flex-wrap">
        <span className="text-xs text-gray-500 pr-2">parse:</span>
        {PARSE_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              updateUrl({ parse_status: tab.value || undefined, page: "1" })
            }
            className={[
              "px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              parseStatus === tab.value
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* original_status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700 flex-wrap">
        <span className="text-xs text-gray-500 pr-2">original:</span>
        {ORIGINAL_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              updateUrl({
                original_status: tab.value || undefined,
                page: "1",
              })
            }
            className={[
              "px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              originalStatus === tab.value
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminDataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/admin/seed/raw-posts/${row.id}`)}
        emptyMessage="No raw posts found"
      />

      {pagination && pagination.total_pages > 1 && (
        <AdminPagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(p) => updateUrl({ page: String(p) })}
        />
      )}
    </div>
  );
}

export default function RawPostsListPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}
    >
      <RawPostsListContent />
    </Suspense>
  );
}
