"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { AdminStatusBadge } from "@/lib/components/admin/common";
import {
  useRawPostDetail,
  useReparse,
  useUpdateSeedStatus,
  type SourceMediaOriginal,
  type SeedSpotRow,
} from "@/lib/api/admin/raw-posts";

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}KB`;
  return `${n}B`;
}

function isPrimaryImage(
  imageUrl: string | undefined,
  original: SourceMediaOriginal
): boolean {
  return !!imageUrl && imageUrl === original.r2_url;
}

export default function RawPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useRawPostDetail(id);
  const reparse = useReparse();
  const updateStatus = useUpdateSeedStatus();

  if (isLoading) {
    return <div className="text-gray-400 text-sm p-4">Loading raw post…</div>;
  }
  if (isError) {
    return (
      <div className="text-red-400 text-sm p-4">
        Failed to load: {error instanceof Error ? error.message : "unknown"}
      </div>
    );
  }
  if (!data) {
    return <div className="text-gray-400 text-sm p-4">Not found</div>;
  }

  const { raw_post, originals, seed_post, seed_spots } = data;
  const seedStatus = seed_post?.status ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/seed/raw-posts"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to list
          </Link>
          <h1 className="text-2xl font-semibold text-gray-100">
            Raw Post · {raw_post.platform}
          </h1>
          <div className="mt-1 text-xs text-gray-500 font-mono">
            {raw_post.id}
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <AdminStatusBadge status={raw_post.parse_status} />
            <AdminStatusBadge status={raw_post.original_status} />
            {seedStatus && <AdminStatusBadge status={seedStatus} />}
            <a
              href={raw_post.external_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline ml-2"
            >
              Open on {raw_post.platform} →
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => reparse.mutate(id)}
            disabled={reparse.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-100 rounded disabled:opacity-50"
          >
            <RefreshCw
              className={"w-4 h-4 " + (reparse.isPending ? "animate-spin" : "")}
            />
            Reparse
          </button>
          <button
            onClick={() => updateStatus.mutate({ id, status: "approved" })}
            disabled={
              updateStatus.isPending ||
              !raw_post.seed_post_id ||
              seedStatus === "approved"
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => updateStatus.mutate({ id, status: "rejected" })}
            disabled={
              updateStatus.isPending ||
              !raw_post.seed_post_id ||
              seedStatus === "rejected"
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded disabled:opacity-40"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Image comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Composite */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-200">Composite</h2>
            <span className="text-xs text-gray-500">
              (raw_posts.r2_url — Pinterest 수집 원본)
            </span>
          </div>
          {raw_post.r2_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={raw_post.r2_url}
              alt="composite"
              className={
                "w-full rounded border " +
                (seed_post?.image_url === raw_post.r2_url
                  ? "border-blue-500"
                  : "border-gray-700")
              }
            />
          ) : (
            <div className="aspect-square bg-gray-900 border border-gray-700 rounded grid place-content-center text-gray-600 text-sm">
              No composite
            </div>
          )}
          {seed_post?.image_url === raw_post.r2_url && (
            <div className="text-xs text-blue-400">
              ⬆ seed_posts.image_url 이 composite 을 가리킴 (원본 미확보)
            </div>
          )}
        </div>

        {/* Original(s) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-200">
              Original candidate
              {originals.length > 1 ? `s (${originals.length})` : ""}
            </h2>
            <span className="text-xs text-gray-500">
              (GCP Cloud Vision Web Detection)
            </span>
          </div>
          {originals.length === 0 ? (
            <div className="aspect-square bg-gray-900 border border-gray-700 border-dashed rounded grid place-content-center text-gray-500 text-sm text-center p-4">
              No originals archived yet.
              <br />
              <span className="text-xs text-gray-600">
                Run reparse to re-trigger reverse image search.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {originals.map((orig) => (
                <OriginalCard
                  key={orig.id}
                  original={orig}
                  isSeedImage={isPrimaryImage(seed_post?.image_url, orig)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seed metadata + spots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-200">Seed post</h2>
          {seed_post ? (
            <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-1 text-xs">
              <KV label="id" value={seed_post.id} mono />
              <KV label="status" value={seed_post.status} />
              <KV
                label="celebrity"
                value={
                  (seed_post.metadata as Record<string, string> | null)?.[
                    "celebrity_name"
                  ] ?? "—"
                }
              />
              <KV
                label="group"
                value={
                  (seed_post.metadata as Record<string, string> | null)?.[
                    "group_name"
                  ] ?? "—"
                }
              />
              <KV
                label="occasion"
                value={
                  (seed_post.metadata as Record<string, string> | null)?.[
                    "occasion"
                  ] ?? "—"
                }
              />
              <KV
                label="parsed_at"
                value={
                  (seed_post.metadata as Record<string, string> | null)?.[
                    "parsed_at"
                  ] ?? "—"
                }
              />
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              No seed post yet. Reparse to create.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-medium text-gray-200">
            Items ({seed_spots.length})
          </h2>
          {seed_spots.length === 0 ? (
            <div className="text-xs text-gray-500">No items detected</div>
          ) : (
            <div className="space-y-2">
              {seed_spots.map((spot) => (
                <SpotRow key={spot.id} spot={spot} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raw parse_result dump */}
      {!!raw_post.parse_result && (
        <details className="bg-gray-900 border border-gray-700 rounded p-3">
          <summary className="text-xs text-gray-400 cursor-pointer">
            parse_result (JSON, debug)
          </summary>
          <pre className="mt-2 text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(raw_post.parse_result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function OriginalCard({
  original,
  isSeedImage,
}: {
  original: SourceMediaOriginal;
  isSeedImage: boolean;
}) {
  const resolution =
    original.width && original.height
      ? `${original.width}×${original.height}`
      : null;
  return (
    <div
      className={
        "bg-gray-900 border rounded overflow-hidden " +
        (isSeedImage ? "border-blue-500" : "border-gray-700")
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={original.r2_url} alt="original" className="w-full" />
      <div className="p-2 text-xs space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-300 truncate">
            {original.origin_domain}
          </span>
          {original.is_primary && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-300 bg-blue-900/50 rounded">
              primary
            </span>
          )}
        </div>
        <div className="text-gray-500">
          {resolution ?? "—"} · {formatBytes(original.byte_size)} ·{" "}
          {original.search_provider}
        </div>
        <a
          href={original.origin_url}
          target="_blank"
          rel="noreferrer"
          className="block text-gray-500 hover:text-blue-400 truncate"
        >
          {original.origin_url}
        </a>
      </div>
    </div>
  );
}

function SpotRow({ spot }: { spot: SeedSpotRow }) {
  const solutions = Array.isArray(spot.solutions) ? spot.solutions : [];
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-3 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">#{spot.request_order}</span>
        <span className="text-gray-600">
          @({spot.position_left}%, {spot.position_top}%)
        </span>
        <AdminStatusBadge status={spot.status} />
      </div>
      {solutions.length === 0 ? (
        <div className="text-gray-600">(no solutions)</div>
      ) : (
        <div className="space-y-1">
          {solutions.map((sol, i) => {
            const s = sol as Record<string, unknown>;
            return (
              <div key={i} className="text-gray-300">
                <span className="font-medium">{String(s.brand ?? "—")}</span>
                {s.product_name ? (
                  <span className="text-gray-500">
                    {" "}
                    · {String(s.product_name)}
                  </span>
                ) : null}
                {s.price_amount ? (
                  <span className="text-gray-400">
                    {" "}
                    · {String(s.price_amount)} {String(s.price_currency ?? "")}
                  </span>
                ) : null}
                {s.subcategory ? (
                  <span className="text-gray-600">
                    {" "}
                    · {String(s.subcategory)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KV({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-16 shrink-0">{label}</span>
      <span className={mono ? "font-mono text-gray-300" : "text-gray-300"}>
        {value}
      </span>
    </div>
  );
}
