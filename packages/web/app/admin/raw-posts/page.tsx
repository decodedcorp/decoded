"use client";

/**
 * Admin: raw_posts 검증 큐 (#333)
 *
 * assets Supabase 프로젝트에 누적된 파이프라인 자동 처리 결과(`COMPLETED`) 를
 * admin 이 검증해 prod.public.posts 로 복사한다. "검증" 이 최종 액션이며
 * 별도의 "승격" 개념은 없다.
 *
 * 탭:
 *   - COMPLETED  (검증 대기 큐, 기본)
 *   - IN_PROGRESS
 *   - ERROR
 *   - VERIFIED   (이력)
 */

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/lib/components/admin/common";
import {
  useRawPostsList,
  useVerifyRawPost,
  type PipelineStatus,
  type RawPost,
} from "@/lib/api/admin/raw-posts";

const TABS: { value: PipelineStatus; label: string }[] = [
  { value: "COMPLETED", label: "검증 대기 (COMPLETED)" },
  { value: "IN_PROGRESS", label: "처리 중 (IN_PROGRESS)" },
  { value: "ERROR", label: "오류 (ERROR)" },
  { value: "VERIFIED", label: "검증됨 (VERIFIED)" },
];

const PAGE_SIZE = 50;

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

/**
 * AdminStatusBadge 의 알려진 variant 로 매핑.
 * (NOT_STARTED/IN_PROGRESS 는 정의된 variant 가 없어 default("draft") 로 떨어진다)
 */
function statusVariant(s: PipelineStatus): string {
  switch (s) {
    case "VERIFIED":
      return "approved";
    case "COMPLETED":
      return "pending";
    case "ERROR":
      return "error";
    case "IN_PROGRESS":
      return "active";
    default:
      return "draft";
  }
}

export default function RawPostsAdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status: PipelineStatus =
    (searchParams.get("status") as PipelineStatus) ?? "COMPLETED";
  const platformFilter = searchParams.get("platform") ?? "";
  const offset = Number(searchParams.get("offset") ?? "0") || 0;

  const filters = useMemo(
    () => ({
      status,
      platform: platformFilter || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [status, platformFilter, offset]
  );

  const { data, isLoading, isError, error } = useRawPostsList(filters);
  const verifyMut = useVerifyRawPost();

  // 쿼리스트링 동기화 — 새로고침 시 상태 보존
  function setQuery(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`);
  }

  async function handleVerify(row: RawPost) {
    const ok = window.confirm(
      `이 raw_post 를 검증하고 prod 에 INSERT 합니다.\n\n` +
        `external_id: ${row.external_id}\n` +
        `platform: ${row.platform}\n\n` +
        `prod 에 동일/유사 항목이 이미 있는지 시각적으로 확인 후 진행하세요. ` +
        `중복 방지는 admin 운영 책임입니다 (DB UNIQUE 제약 없음).`
    );
    if (!ok) return;
    try {
      await verifyMut.mutateAsync({ id: row.id });
    } catch (e) {
      window.alert(
        `검증 실패: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  }

  const columns: Column<RawPost>[] = [
    {
      key: "preview",
      label: "Preview",
      className: "w-32",
      render: (row) =>
        row.r2_url || row.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.r2_url ?? row.image_url}
            alt={row.caption ?? row.external_id}
            className="h-20 w-20 rounded object-cover bg-gray-100"
          />
        ) : (
          <div className="h-20 w-20 rounded bg-gray-100 text-xs flex items-center justify-center text-gray-400">
            no image
          </div>
        ),
    },
    {
      key: "platform",
      label: "Platform / External",
      className: "w-[14rem]",
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium capitalize">{row.platform}</div>
          <div className="text-xs text-gray-500 font-mono truncate max-w-[12rem]">
            {row.external_id}
          </div>
        </div>
      ),
    },
    {
      key: "caption",
      label: "Caption / Author",
      render: (row) => (
        <div className="text-sm min-w-0">
          <div className="line-clamp-2 max-w-md">{row.caption ?? "—"}</div>
          <div className="text-xs text-gray-500">
            by {row.author_name ?? "unknown"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[10rem]",
      render: (row) => (
        <AdminStatusBadge status={statusVariant(row.status)} />
      ),
    },
    {
      key: "verified",
      label: "Verified",
      className: "w-[10rem]",
      render: (row) => (
        <div className="text-xs text-gray-500">
          {row.verified_at ? formatRelative(row.verified_at) : "—"}
        </div>
      ),
    },
    {
      key: "created",
      label: "Collected",
      className: "w-[8rem]",
      render: (row) => (
        <div className="text-xs text-gray-500">
          {formatRelative(row.created_at)}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[8rem]",
      render: (row) =>
        row.status === "COMPLETED" ? (
          <button
            type="button"
            disabled={
              verifyMut.isPending && verifyMut.variables?.id === row.id
            }
            onClick={() => handleVerify(row)}
            className="text-xs font-medium px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {verifyMut.isPending && verifyMut.variables?.id === row.id
              ? "검증 중..."
              : "검증"}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Raw Posts (검증 큐)</h1>
          <p className="text-sm text-gray-500">
            assets 프로젝트에 누적된 파이프라인 결과를 검증해 prod 에
            반영합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) =>
              setQuery({
                platform: e.target.value || undefined,
                offset: undefined,
              })
            }
            className="text-sm border rounded px-2 py-1"
          >
            <option value="">All platforms</option>
            <option value="pinterest">pinterest</option>
            <option value="instagram">instagram</option>
            <option value="mock">mock</option>
          </select>
        </div>
      </header>

      <nav className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() =>
              setQuery({ status: t.value, offset: undefined })
            }
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              status === t.value
                ? "border-emerald-600 text-emerald-700 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {isError ? (
        <AdminEmptyState
          icon={<AlertTriangle className="h-10 w-10" />}
          title="목록을 불러오지 못했습니다"
          description={error instanceof Error ? error.message : "Unknown error"}
        />
      ) : (
        <AdminDataTable<RawPost>
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="해당 상태의 raw_post 가 없습니다"
        />
      )}

      <footer className="flex items-center justify-between text-sm text-gray-500">
        <div>
          {data
            ? `${data.total.toLocaleString()} items · offset ${offset}`
            : ""}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() =>
              setQuery({
                offset: String(Math.max(0, offset - PAGE_SIZE)) || undefined,
              })
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <button
            type="button"
            disabled={
              !data || offset + (data.items?.length ?? 0) >= data.total
            }
            onClick={() => setQuery({ offset: String(offset + PAGE_SIZE) })}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </footer>
    </div>
  );
}
