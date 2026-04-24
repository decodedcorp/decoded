"use client";

import { useMemo, useState } from "react";
import { Play, Trash2, Plus, ToggleRight } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/lib/components/admin/common";
import {
  useRawPostSources,
  useCreateRawPostSource,
  useUpdateRawPostSource,
  useDeleteRawPostSource,
  useTriggerRawPostSource,
  type RawPostSource,
} from "@/lib/api/admin/raw-post-sources";

const PLATFORM_OPTIONS = ["pinterest", "mock"];
const SOURCE_TYPE_OPTIONS = ["board", "user", "hashtag"];
const MIN_INTERVAL = 300;
const MAX_INTERVAL = 86_400;
const DEFAULT_INTERVAL = 3600;

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return "just now";
  const mins = Math.floor(delta / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatInterval(sec: number): string {
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86_400) return `${(sec / 3600).toFixed(1).replace(/\.0$/, "")}h`;
  return `${(sec / 86_400).toFixed(1).replace(/\.0$/, "")}d`;
}

export default function RawPostSourcesPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">(
    ""
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editingInterval, setEditingInterval] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RawPostSource | null>(
    null
  );

  const filters = useMemo(
    () => ({
      platform: platformFilter || undefined,
      isActive:
        activeFilter === "active"
          ? true
          : activeFilter === "inactive"
            ? false
            : null,
    }),
    [platformFilter, activeFilter]
  );
  const { data, isLoading, isError, error } = useRawPostSources(filters);
  const createMut = useCreateRawPostSource();
  const updateMut = useUpdateRawPostSource();
  const deleteMut = useDeleteRawPostSource();
  const triggerMut = useTriggerRawPostSource();

  const columns: Column<RawPostSource>[] = [
    {
      key: "platform",
      label: "Platform",
      className: "w-[9rem]",
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium capitalize">{row.platform}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {row.source_type}
          </div>
        </div>
      ),
    },
    {
      key: "identifier",
      label: "Identifier / Label",
      render: (row) => (
        <div className="text-sm min-w-0">
          <div className="font-mono text-xs truncate max-w-xs">
            {row.source_identifier}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-xs">
            {row.label ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Active",
      className: "w-[7rem]",
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            updateMut.mutate({
              id: row.id,
              input: { is_active: !row.is_active },
            })
          }
          disabled={updateMut.isPending}
          className="inline-flex items-center gap-1"
          title="Toggle active"
        >
          <AdminStatusBadge status={row.is_active ? "active" : "hidden"} />
        </button>
      ),
    },
    {
      key: "interval",
      label: "Interval",
      className: "w-[9rem]",
      render: (row) => {
        const isEditing = editingInterval?.id === row.id;
        if (isEditing) {
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                value={editingInterval.value}
                onChange={(e) =>
                  setEditingInterval({ id: row.id, value: e.target.value })
                }
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  const v = Number(editingInterval.value);
                  if (
                    Number.isFinite(v) &&
                    v >= MIN_INTERVAL &&
                    v <= MAX_INTERVAL
                  ) {
                    updateMut.mutate(
                      { id: row.id, input: { fetch_interval_seconds: v } },
                      { onSuccess: () => setEditingInterval(null) }
                    );
                  }
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                save
              </button>
              <button
                type="button"
                onClick={() => setEditingInterval(null)}
                className="text-xs text-gray-500 hover:underline"
              >
                cancel
              </button>
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={() =>
              setEditingInterval({
                id: row.id,
                value: String(row.fetch_interval_seconds),
              })
            }
            className="text-sm text-left hover:underline"
            title={`${row.fetch_interval_seconds}s — click to edit`}
          >
            {formatInterval(row.fetch_interval_seconds)}
          </button>
        );
      },
    },
    {
      key: "last_scraped",
      label: "Last Scraped",
      className: "w-[9rem]",
      render: (row) => (
        <div className="text-xs">
          <div>{formatRelative(row.last_scraped_at)}</div>
          <div className="text-gray-400">
            enq {formatRelative(row.last_enqueued_at)}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-[11rem]",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => triggerMut.mutate(row.id)}
            disabled={triggerMut.isPending}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            title="Dispatch this source now via ai-server"
          >
            <Play className="w-3 h-3" />
            Trigger
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
            title="Delete source — cascades to raw_posts"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Raw Post Sources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pinterest 보드/유저/해시태그 등 raw_posts 수집 소스 관리. Scheduler
            가 5분 주기로 due 소스를 자동 fetch.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          New Source
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded"
        >
          <option value="">All platforms</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="flex gap-1 border border-gray-300 rounded overflow-hidden text-sm">
          {[
            { label: "All", value: "" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setActiveFilter(opt.value as "" | "active" | "inactive")
              }
              className={`px-3 py-2 ${
                activeFilter === opt.value
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 ml-auto">
          {data?.total ?? 0} total
        </span>
      </div>

      {isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load sources"}
        </div>
      )}

      {data && data.items.length === 0 && !isLoading ? (
        <AdminEmptyState
          icon={<ToggleRight className="w-8 h-8" />}
          title="No sources yet"
          description="Register a Pinterest board or user to start collecting raw_posts."
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="No sources"
        />
      )}

      {showCreate && (
        <CreateSourceModal
          onClose={() => setShowCreate(false)}
          onSubmit={(input) =>
            createMut.mutate(input, {
              onSuccess: () => setShowCreate(false),
            })
          }
          isSubmitting={createMut.isPending}
          error={
            createMut.isError
              ? createMut.error instanceof Error
                ? createMut.error.message
                : "Failed to create"
              : null
          }
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          source={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() =>
            deleteMut.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            })
          }
          isDeleting={deleteMut.isPending}
        />
      )}

      {triggerMut.isSuccess && (
        <TriggerToast
          result={triggerMut.data}
          onDismiss={() => triggerMut.reset()}
        />
      )}
      {triggerMut.isError && (
        <ErrorToast
          message={
            triggerMut.error instanceof Error
              ? triggerMut.error.message
              : "Trigger failed"
          }
          onDismiss={() => triggerMut.reset()}
        />
      )}
    </div>
  );
}

function CreateSourceModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: {
    platform: string;
    source_type: string;
    source_identifier: string;
    label: string | null;
    fetch_interval_seconds: number;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
  const [sourceType, setSourceType] = useState(SOURCE_TYPE_OPTIONS[0]);
  const [identifier, setIdentifier] = useState("");
  const [label, setLabel] = useState("");
  const [intervalSec, setIntervalSec] = useState(DEFAULT_INTERVAL);

  const canSubmit =
    identifier.trim().length > 0 &&
    intervalSec >= MIN_INTERVAL &&
    intervalSec <= MAX_INTERVAL;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">New Raw Post Source</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit({
              platform,
              source_type: sourceType,
              source_identifier: identifier.trim(),
              label: label.trim() || null,
              fetch_interval_seconds: intervalSec,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            >
              {SOURCE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Identifier
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user/board-slug  or  https://pinterest.com/user/board/"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Pinterest: <code>&lt;user&gt;/&lt;slug&gt;</code> 형식 또는 전체
              URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Jennie street style"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fetch Interval
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                className="w-28 px-3 py-2 text-sm border border-gray-300 rounded"
              />
              <span className="text-xs text-gray-500">
                seconds · {formatInterval(intervalSec)} · range{" "}
                {formatInterval(MIN_INTERVAL)}–{formatInterval(MAX_INTERVAL)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  source,
  onClose,
  onConfirm,
  isDeleting,
}: {
  source: RawPostSource;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">Delete Source</h2>
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-mono text-xs">{source.source_identifier}</span>{" "}
          을 삭제하시겠습니까?
        </p>
        <p className="text-xs text-red-600 mb-4">
          이 소스의 모든 <code>raw_posts</code> 도 FK cascade 로 함께
          삭제됩니다.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TriggerToast({
  result,
  onDismiss,
}: {
  result: { triggered: boolean; source_id: string };
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 text-sm">
      <span>Triggered source {result.source_id.slice(0, 8)}…</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-gray-300 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}

function ErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-40 bg-red-600 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 text-sm">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-100 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
