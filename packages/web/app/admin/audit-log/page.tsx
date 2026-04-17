"use client";

import { useState } from "react";
import { ClipboardListIcon } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminPagination,
  AdminEmptyState,
} from "@/lib/components/admin/common";
import {
  useAuditLogList,
  type AuditLogEntry,
} from "@/lib/api/admin/audit-log-query";
import { AuditDiffViewer } from "@/lib/components/admin/audit-log/AuditDiffViewer";

const ACTION_OPTIONS = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "bulk_approve",
  "bulk_reject",
  "bulk_delete",
  "rollback",
];

const TABLE_OPTIONS = ["artists", "brands", "seed_posts"];

function actionVariant(action: string): string {
  if (action.includes("delete")) return "deleted";
  if (action.includes("reject")) return "rejected";
  if (action.includes("approve") || action === "create") return "approved";
  if (action === "rollback") return "pending";
  return "draft";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncate(str: string | null | undefined, len = 12) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogList(page, 30, {
    action: actionFilter,
    targetTable: tableFilter,
    dateFrom,
    dateTo,
  });

  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  const hasFilter = Boolean(actionFilter || tableFilter || dateFrom || dateTo);
  const isEmpty = !isLoading && entries.length === 0 && !hasFilter;

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <AdminStatusBadge status={row.action} className={undefined} />
      ),
    },
    {
      key: "target_table",
      label: "Table",
      render: (row) => (
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
          {row.target_table}
        </span>
      ),
    },
    {
      key: "target_id",
      label: "Target ID",
      render: (row) => (
        <span
          className="text-xs font-mono text-gray-500"
          title={row.target_id ?? ""}
        >
          {truncate(row.target_id)}
        </span>
      ),
    },
    {
      key: "admin_user_id",
      label: "Admin",
      render: (row) => (
        <span
          className="text-xs font-mono text-gray-500"
          title={row.admin_user_id}
        >
          {truncate(row.admin_user_id)}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "detail",
      label: "",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId((prev) => (prev === row.id ? null : row.id));
          }}
          className="text-xs text-blue-500 hover:underline"
        >
          {expandedId === row.id ? "Close" : "Detail"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Admin action history with before/after state tracking
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Table</label>
          <select
            value={tableFilter}
            onChange={(e) => {
              setTableFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
          >
            <option value="">All tables</option>
            {TABLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
          />
        </div>

        {(actionFilter || tableFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setActionFilter("");
              setTableFilter("");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline self-end pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state: no entries AND no active filter */}
      {isEmpty ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <AdminEmptyState
            icon={<ClipboardListIcon className="w-12 h-12" />}
            title="No audit log entries"
            description="Admin actions will appear here as they happen. Apply a filter or trigger an admin action to populate this log."
          />
        </div>
      ) : (
        <>
          {/* Table + inline expand */}
          <div className="space-y-0">
            <AdminDataTable
              columns={columns}
              data={entries}
              rowKey={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No audit log entries found"
              onRowClick={(row) =>
                setExpandedId((prev) => (prev === row.id ? null : row.id))
              }
            />

            {/* Expanded detail rows rendered below table */}
            {expandedId &&
              (() => {
                const entry = entries.find((e) => e.id === expandedId);
                if (!entry) return null;
                return (
                  <div className="border border-t-0 border-gray-200 dark:border-gray-800 rounded-b-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        State diff for{" "}
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {entry.target_table}/{truncate(entry.target_id, 8)}
                        </code>
                      </span>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Close
                      </button>
                    </div>
                    <AuditDiffViewer
                      before={entry.before_state}
                      after={entry.after_state}
                    />
                    {entry.metadata && (
                      <div className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 rounded p-2">
                        <span className="font-medium">Metadata: </span>
                        {JSON.stringify(entry.metadata).slice(0, 200)}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          {pagination && (
            <AdminPagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
