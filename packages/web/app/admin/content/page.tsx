"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileTextIcon, FlagIcon } from "lucide-react";
import { useAdminPostList } from "@/lib/hooks/admin/useAdminPosts";
import { useAdminReportList } from "@/lib/hooks/admin/useAdminReports";
import { AdminPostTable } from "@/lib/components/admin/content/AdminPostTable";
import { AdminPostTableSkeleton } from "@/lib/components/admin/content/AdminPostTableSkeleton";
import { PostStatusFilter } from "@/lib/components/admin/content/PostStatusFilter";
import { ReportTable } from "@/lib/components/admin/content/ReportTable";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import { AdminEmptyState } from "@/lib/components/admin/common";
import type { PostStatus } from "@/lib/api/admin/posts";
import type { ReportStatus } from "@/lib/api/admin/reports";

// ─── Tab types ───────────────────────────────────────────────────────────────

type ContentTab = "posts" | "reports";

const TAB_OPTIONS: { label: string; value: ContentTab }[] = [
  { label: "Posts", value: "posts" },
  { label: "Reports", value: "reports" },
];

const REPORT_STATUS_OPTIONS: {
  label: string;
  value: ReportStatus | undefined;
  dotColor: string | null;
}[] = [
  { label: "All", value: undefined, dotColor: null },
  { label: "Pending", value: "pending", dotColor: "bg-yellow-400" },
  { label: "Reviewed", value: "reviewed", dotColor: "bg-blue-400" },
  { label: "Actioned", value: "actioned", dotColor: "bg-emerald-400" },
  { label: "Dismissed", value: "dismissed", dotColor: "bg-gray-400" },
];

// ─── Inner content ───────────────────────────────────────────────────────────

function ContentManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = (searchParams.get("tab") as ContentTab) || "posts";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const statusParam = searchParams.get("status");

  // Posts state
  const postStatus =
    currentTab === "posts" && statusParam
      ? (statusParam as PostStatus)
      : undefined;

  // Reports state
  const reportStatus =
    currentTab === "reports" && statusParam
      ? (statusParam as ReportStatus)
      : undefined;

  const postListQuery = useAdminPostList({
    page: currentTab === "posts" ? currentPage : 1,
    perPage: 20,
    status: postStatus,
  });

  const reportListQuery = useAdminReportList({
    page: currentTab === "reports" ? currentPage : 1,
    perPage: 20,
    status: reportStatus,
  });

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
      router.replace(`/admin/content?${newParams.toString()}`);
    },
    [searchParams, router]
  );

  const handleTabChange = useCallback(
    (tab: ContentTab) => {
      updateUrl({
        tab: tab === "posts" ? undefined : tab,
        status: undefined,
        page: "1",
      });
    },
    [updateUrl]
  );

  const handlePostStatusChange = useCallback(
    (status: PostStatus | undefined) => {
      updateUrl({ status, page: "1" });
    },
    [updateUrl]
  );

  const handleReportStatusChange = useCallback(
    (status: ReportStatus | undefined) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Content Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage post visibility, status, and reports
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TAB_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTabChange(value)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              currentTab === value
                ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {currentTab === "posts" && (
        <>
          <PostStatusFilter
            currentStatus={postStatus}
            onStatusChange={handlePostStatusChange}
          />

          {postListQuery.isLoading ? (
            <AdminPostTableSkeleton />
          ) : postListQuery.data ? (
            postListQuery.data.data.length === 0 && !postStatus ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <AdminEmptyState
                  icon={<FileTextIcon className="w-12 h-12" />}
                  title="No posts found"
                  description="Posts submitted by users will appear here."
                />
              </div>
            ) : (
              <>
                <AdminPostTable data={postListQuery.data.data} />
                {postListQuery.data.pagination.total_pages > 1 && (
                  <Pagination
                    currentPage={postListQuery.data.pagination.current_page}
                    totalPages={postListQuery.data.pagination.total_pages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )
          ) : (
            <AdminPostTableSkeleton />
          )}
        </>
      )}

      {/* Reports tab */}
      {currentTab === "reports" && (
        <>
          {/* Report status filter */}
          <div
            className="flex gap-2 flex-wrap"
            role="group"
            aria-label="Filter by report status"
          >
            {REPORT_STATUS_OPTIONS.map(({ label, value, dotColor }) => {
              const isActive = reportStatus === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleReportStatusChange(value)}
                  aria-pressed={isActive}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5",
                    isActive
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                  ].join(" ")}
                >
                  {dotColor && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                      aria-hidden="true"
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {reportListQuery.isLoading ? (
            <AdminPostTableSkeleton />
          ) : reportListQuery.data ? (
            reportListQuery.data.data.length === 0 && !reportStatus ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <AdminEmptyState
                  icon={<FlagIcon className="w-12 h-12" />}
                  title="No reports to review"
                  description="User-submitted reports will appear here for moderation."
                />
              </div>
            ) : (
              <>
                <ReportTable data={reportListQuery.data.data} />
                {reportListQuery.data.pagination.total_pages > 1 && (
                  <Pagination
                    currentPage={reportListQuery.data.pagination.current_page}
                    totalPages={reportListQuery.data.pagination.total_pages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )
          ) : (
            <AdminPostTableSkeleton />
          )}
        </>
      )}
    </div>
  );
}

export default function ContentManagementPage() {
  return (
    <Suspense fallback={<AdminPostTableSkeleton />}>
      <ContentManagementContent />
    </Suspense>
  );
}
