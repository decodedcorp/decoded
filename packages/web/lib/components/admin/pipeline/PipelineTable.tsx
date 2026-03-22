"use client";

import Image from "next/image";
import { toast } from "sonner";
import type {
  PipelineListItem,
  PipelineStatus,
} from "@/lib/api/admin/pipeline";
import { PipelineDetail } from "./PipelineDetail";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineTableProps {
  data: PipelineListItem[];
  onSelectPipeline: (id: string) => void;
  expandedId: string | null;
}

// ─── Status badge styles ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<PipelineStatus, string> = {
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: PipelineStatus }) {
  const isRunning = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {isRunning && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse shrink-0"
          aria-hidden="true"
        />
      )}
      {status}
    </span>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Formats total duration in ms to "X.Xs" or "—" */
function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Simple relative time formatter */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Table of pipeline executions with expandable accordion rows.
 * Clicking a row expands it to show step-by-step detail (PipelineDetail).
 * Failed pipelines have a Retry button that shows a sonner toast.
 */
export function PipelineTable({
  data,
  onSelectPipeline,
  expandedId,
}: PipelineTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
          No pipelines found
        </div>
      </div>
    );
  }

  const handleRetry = (e: React.MouseEvent, pipelineId: string) => {
    e.stopPropagation(); // Don't trigger row expansion
    toast.success(`Pipeline ${pipelineId} retry initiated`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-16" />
          <col className="w-32" />
          <col className="w-28" />
          <col className="w-24" />
          <col className="hidden sm:table-column w-32" />
          <col className="hidden sm:table-column w-36" />
          <col className="w-20" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Post ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Duration
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Triggered By
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Started At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((pipeline) => {
            const isExpanded = expandedId === pipeline.id;
            const isFailed = pipeline.status === "failed";

            return (
              <>
                <tr
                  key={pipeline.id}
                  onClick={() => onSelectPipeline(pipeline.id)}
                  aria-expanded={isExpanded}
                  className={[
                    "cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800",
                    isExpanded
                      ? "bg-gray-50 dark:bg-gray-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  ].join(" ")}
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="relative w-10 h-[30px] shrink-0 rounded overflow-hidden">
                      <Image
                        src={pipeline.imageUrl}
                        alt={`Pipeline ${pipeline.id}`}
                        width={40}
                        height={30}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </td>

                  {/* Post ID */}
                  <td className="px-4 py-3">
                    <span
                      className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate block"
                      title={pipeline.postId}
                    >
                      {pipeline.postId}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <StatusBadge status={pipeline.status} />
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                    {formatDuration(pipeline.totalDurationMs)}
                  </td>

                  {/* Triggered By (hidden on mobile) */}
                  <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {pipeline.triggerUser}
                  </td>

                  {/* Started At (hidden on mobile) */}
                  <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(pipeline.startedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {isFailed && (
                      <button
                        type="button"
                        onClick={(e) => handleRetry(e, pipeline.id)}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>

                {/* Accordion: step detail row */}
                {isExpanded && (
                  <tr key={`${pipeline.id}-detail`}>
                    <td
                      colSpan={7}
                      className="p-0 border-b border-gray-100 dark:border-gray-800"
                    >
                      <PipelineDetail pipelineId={pipeline.id} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Shimmer skeleton for PipelineTable while data is loading or on error.
 */
export function PipelineTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-16" />
          <col className="w-32" />
          <col className="w-28" />
          <col className="w-24" />
          <col className="hidden sm:table-column w-32" />
          <col className="hidden sm:table-column w-36" />
          <col className="w-20" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {[
              "Image",
              "Post ID",
              "Status",
              "Duration",
              "Triggered By",
              "Started At",
              "Actions",
            ].map((label, i) => (
              <th
                key={label}
                className={[
                  "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  i >= 4 ? "hidden sm:table-cell" : "",
                ].join(" ")}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              {/* Thumbnail shimmer */}
              <td className="px-4 py-3">
                <div className="w-10 h-[30px] rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Post ID shimmer */}
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Status shimmer */}
              <td className="px-4 py-3">
                <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Duration shimmer */}
              <td className="px-4 py-3">
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Triggered By shimmer (hidden on mobile) */}
              <td className="hidden sm:table-cell px-4 py-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Started At shimmer (hidden on mobile) */}
              <td className="hidden sm:table-cell px-4 py-3">
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              {/* Actions shimmer */}
              <td className="px-4 py-3">
                <div className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
