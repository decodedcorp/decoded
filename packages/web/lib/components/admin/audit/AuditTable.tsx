"use client";

import Image from "next/image";
import type { AuditRequest, AuditStatus } from "@/lib/api/admin/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditTableProps {
  data: Omit<AuditRequest, "items">[];
  onRowClick: (requestId: string) => void;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AuditStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  modified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function StatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Relative time formatter ──────────────────────────────────────────────────

/**
 * Simple relative time formatter without external dependencies.
 * Falls back to formatted date for older timestamps.
 */
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

  // Fallback to formatted date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Table component for the audit request list.
 * Full-width minimal table matching dashboard style.
 * Clicking a row opens the detail modal.
 */
export function AuditTable({ data, onRowClick }: AuditTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
          No results found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-16" />
          <col className="w-28" />
          <col className="w-20" />
          <col className="w-36" />
          <col className="hidden sm:table-column w-36" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requested
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requested By
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((request) => (
            <tr
              key={request.id}
              onClick={() => onRowClick(request.id)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              {/* Image thumbnail */}
              <td className="px-4 py-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={request.imageUrl}
                    alt={`Audit ${request.id}`}
                    width={48}
                    height={48}
                    className="rounded-md object-cover w-12 h-12"
                  />
                </div>
              </td>

              {/* Status badge */}
              <td className="px-4 py-3">
                <StatusBadge status={request.status} />
              </td>

              {/* Item count */}
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {request.itemCount} {request.itemCount === 1 ? "item" : "items"}
              </td>

              {/* Requested at */}
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatRelativeTime(request.requestedAt)}
              </td>

              {/* Requested by (hidden on mobile) */}
              <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate">
                {request.requestedBy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
