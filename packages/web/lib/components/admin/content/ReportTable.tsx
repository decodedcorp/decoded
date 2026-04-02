"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { ReportListItem, ReportStatus } from "@/lib/api/admin/reports";
import { useUpdateReportStatus } from "@/lib/hooks/admin/useAdminReports";

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  reviewed:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  dismissed:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  actioned:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActionDropdown({
  report,
  onStatusChange,
}: {
  report: ReportListItem;
  onStatusChange: (reportId: string, status: ReportStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions: { label: string; status: ReportStatus; color: string }[] = [];
  if (report.status !== "reviewed")
    actions.push({
      label: "Mark Reviewed",
      status: "reviewed",
      color: "text-blue-600 dark:text-blue-400",
    });
  if (report.status !== "actioned")
    actions.push({
      label: "Mark Actioned",
      status: "actioned",
      color: "text-emerald-600 dark:text-emerald-400",
    });
  if (report.status !== "dismissed")
    actions.push({
      label: "Dismiss",
      status: "dismissed",
      color: "text-gray-600 dark:text-gray-400",
    });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
            {actions.map(({ label, status, color }) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onStatusChange(report.id, status);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ReportTableProps {
  data: ReportListItem[];
}

export function ReportTable({ data }: ReportTableProps) {
  const mutation = useUpdateReportStatus();

  function handleStatusChange(reportId: string, status: ReportStatus) {
    mutation.mutate({ reportId, status });
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No reports found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-20" />
          <col />
          <col className="w-28" />
          <col className="w-32" />
          <col className="w-20" />
          <col className="w-24" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {["Type", "Reason / Details", "Reporter", "Target ID", "Status", "Date", ""].map(
              (h) => (
                <th
                  key={h || "spacer"}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((report) => (
            <tr
              key={report.id}
              className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-3 py-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  {report.target_type}
                </span>
              </td>

              <td className="px-3 py-2 truncate">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {report.reason}
                </p>
                {report.details && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {report.details}
                  </p>
                )}
              </td>

              <td className="px-3 py-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {report.reporter.username}
                </p>
              </td>

              <td className="px-3 py-2">
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono"
                  title={report.target_id}
                >
                  {report.target_id.slice(0, 8)}...
                </p>
              </td>

              <td className="px-3 py-2">
                <StatusBadge status={report.status} />
              </td>

              <td
                className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
                title={new Date(report.created_at).toLocaleString()}
              >
                {relativeTime(report.created_at)}
              </td>

              <td className="px-3 py-2">
                <ActionDropdown
                  report={report}
                  onStatusChange={handleStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
