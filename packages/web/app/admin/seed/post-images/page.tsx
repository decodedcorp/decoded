"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminImagePreview,
  AdminPagination,
} from "@/lib/components/admin/common";
import { usePostImageList, type PostImage } from "@/lib/api/admin/seed";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Extracted", value: "extracted" },
  { label: "Skipped", value: "skipped" },
  { label: "Extracted Metadata", value: "extracted_metadata" },
];

const WITH_ITEMS_OPTIONS = [
  { label: "All", value: "" },
  { label: "With Items", value: "true" },
  { label: "Without Items", value: "false" },
];

function PostImagesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? 1);
  const currentStatus = searchParams.get("status") ?? "";
  const currentWithItems = searchParams.get("with_items") ?? "";

  const { data, isLoading } = usePostImageList(
    currentPage,
    20,
    currentStatus,
    currentWithItems
  );

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`/admin/seed/post-images?${next.toString()}`);
    },
    [searchParams, router]
  );

  const images = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: Column<PostImage>[] = [
    {
      key: "image_url",
      label: "Image",
      render: (row) =>
        row.image_url ? (
          <AdminImagePreview src={row.image_url} alt="post image" size="sm" />
        ) : (
          <span className="text-gray-400 text-xs">N/A</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "with_items",
      label: "With Items",
      render: (row) => (
        <span
          className={[
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            row.with_items
              ? "bg-green-900/40 text-green-400"
              : "bg-gray-700 text-gray-400",
          ].join(" ")}
        >
          {row.with_items ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "image_hash",
      label: "Hash",
      render: (row) => (
        <span className="font-mono text-xs text-gray-400">
          {row.image_hash ? row.image_hash.slice(0, 12) + "…" : "—"}
        </span>
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
        <h1 className="text-2xl font-semibold text-gray-100">Post Images</h1>
        <p className="text-sm text-gray-400 mt-1">
          ETL-collected images from artist posts
          {pagination && (
            <span className="ml-2 text-gray-500">
              ({pagination.total_items} total)
            </span>
          )}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              updateUrl({ status: tab.value || undefined, page: "1" })
            }
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

      {/* With Items Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Items filter:</span>
        <div className="flex gap-1">
          {WITH_ITEMS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateUrl({ with_items: opt.value || undefined, page: "1" })
              }
              className={[
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                currentWithItems === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={images}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No images found"
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

export default function PostImagesPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}
    >
      <PostImagesPageContent />
    </Suspense>
  );
}
