"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAdminPickList,
  useCreatePick,
  useUpdatePick,
  useDeletePick,
} from "@/lib/hooks/admin/useAdminPicks";
import { Pagination } from "@/lib/components/admin/audit/Pagination";
import type { DecodedPickListItem } from "@/lib/api/admin/picks";
import { createBrowserClient } from "@supabase/ssr";

// ─── Post search hook (Supabase direct for autocomplete) ────────────────────

function usePostSearch(query: string) {
  const [results, setResults] = useState<
    { id: string; image_url: string | null; artist_name: string | null; group_name: string | null; context: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("posts")
        .select("id, image_url, artist_name, group_name, context")
        .eq("status", "active")
        .or(`artist_name.ilike.%${q}%,group_name.ilike.%${q}%,context.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setResults(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search, setResults };
}

// ─── Create Pick Modal ──────────────────────────────────────────────────────

function CreatePickModal({ onClose }: { onClose: () => void }) {
  const [postQuery, setPostQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<{
    id: string; image_url: string | null; artist_name: string | null; group_name: string | null;
  } | null>(null);
  const [pickDate, setPickDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [curatedBy, setCuratedBy] = useState<"editor" | "ai">("editor");
  const { results, loading, search, setResults } = usePostSearch(postQuery);
  const createPick = useCreatePick();

  const handleSearch = (value: string) => {
    setPostQuery(value);
    search(value);
  };

  const handleSubmit = async () => {
    if (!selectedPost) return;
    await createPick.mutateAsync({
      post_id: selectedPost.id,
      pick_date: pickDate,
      note: note || undefined,
      curated_by: curatedBy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 p-6 shadow-2xl">
        <h3 className="mb-6 text-lg font-semibold text-white">Create Decoded Pick</h3>

        {/* Post Search */}
        <label className="mb-1 block text-xs font-medium text-gray-400">Post</label>
        {selectedPost ? (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-800 p-3">
            {selectedPost.image_url && (
              <Image
                src={selectedPost.image_url}
                alt=""
                width={48}
                height={48}
                className="rounded-md object-cover"
              />
            )}
            <div className="flex-1 text-sm text-white">
              {selectedPost.artist_name || selectedPost.group_name || "Unknown"}
            </div>
            <button
              onClick={() => { setSelectedPost(null); setPostQuery(""); }}
              className="text-xs text-gray-500 hover:text-white"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative mb-4">
            <input
              type="text"
              value={postQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by artist, group, or context..."
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {(results.length > 0 || loading) && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg bg-gray-800 shadow-xl">
                {loading && <div className="px-4 py-2 text-xs text-gray-500">Searching...</div>}
                {results.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => {
                      setSelectedPost(post);
                      setResults([]);
                      setPostQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-700"
                  >
                    {post.image_url && (
                      <Image
                        src={post.image_url}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    )}
                    <span className="text-sm text-white">
                      {post.artist_name || post.group_name || "Unknown"}
                    </span>
                    {post.context && (
                      <span className="text-xs text-gray-500">{post.context}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <label className="mb-1 block text-xs font-medium text-gray-400">Pick Date</label>
        <input
          type="date"
          value={pickDate}
          onChange={(e) => setPickDate(e.target.value)}
          className="mb-4 w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Note */}
        <label className="mb-1 block text-xs font-medium text-gray-400">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why this pick?"
          rows={2}
          className="mb-4 w-full resize-none rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Curated By */}
        <label className="mb-1 block text-xs font-medium text-gray-400">Curated By</label>
        <div className="mb-6 flex gap-2">
          {(["editor", "ai"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setCuratedBy(val)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                curatedBy === val
                  ? "bg-primary text-black"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {val === "editor" ? "Editor" : "AI"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPost || createPick.isPending}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {createPick.isPending ? "Creating..." : "Create Pick"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pick Row ────────────────────────────────────────────────────────────────

function PickRow({
  pick,
  onToggleActive,
  onDelete,
}: {
  pick: DecodedPickListItem;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const displayName = pick.post?.artist_name || pick.post?.group_name || "Unknown";

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
      <td className="px-4 py-3 text-sm text-white">{pick.pick_date}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {pick.post?.image_url && (
            <Image
              src={pick.post.image_url}
              alt=""
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
          )}
          <span className="text-sm text-white">{displayName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            pick.curated_by === "editor"
              ? "bg-violet-500/20 text-violet-300"
              : "bg-sky-500/20 text-sky-300"
          }`}
        >
          {pick.curated_by === "editor" ? "Editor" : "AI"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate">
        {pick.note || "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            pick.is_active ? "bg-emerald-400" : "bg-gray-600"
          }`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(pick.id, !pick.is_active)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {pick.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => onDelete(pick.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main content ────────────────────────────────────────────────────────────

function PickManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);

  const pickListQuery = useAdminPickList({ page: currentPage, perPage: 20 });
  const updatePick = useUpdatePick();
  const deletePick = useDeletePick();

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", String(page));
    router.replace(`/admin/picks?${newParams.toString()}`);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updatePick.mutate({ pickId: id, is_active: isActive });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this pick?")) {
      deletePick.mutate(id);
    }
  };

  const picks = pickListQuery.data?.data ?? [];
  const total = pickListQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Decoded Pick</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage curated daily picks for the homepage
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-black hover:bg-primary/90"
        >
          Create Pick
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Post
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Curated By
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Note
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Active
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pickListQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : picks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  No picks yet. Create your first pick!
                </td>
              </tr>
            ) : (
              picks.map((pick) => (
                <PickRow
                  key={pick.id}
                  pick={pick}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreatePickModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function AdminPicksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <PickManagementContent />
    </Suspense>
  );
}
