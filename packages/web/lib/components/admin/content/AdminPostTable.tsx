"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreVertical, Pencil } from "lucide-react";
import type { AdminPostListItem, PostStatus } from "@/lib/api/admin/posts";
import { useUpdatePostStatus } from "@/lib/hooks/admin/useAdminPosts";
import { PostEditModal } from "./PostEditModal";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PostStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  hidden:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

// ─── Relative time ───────────────────────────────────────────────────────────

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

// ─── Action dropdown ─────────────────────────────────────────────────────────

function ActionDropdown({
  post,
  onStatusChange,
}: {
  post: AdminPostListItem;
  onStatusChange: (postId: string, status: PostStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions: { label: string; status: PostStatus; color: string }[] = [];
  if (post.status !== "active")
    actions.push({
      label: "Activate",
      status: "active",
      color: "text-emerald-600 dark:text-emerald-400",
    });
  if (post.status !== "hidden")
    actions.push({
      label: "Hide",
      status: "hidden",
      color: "text-yellow-600 dark:text-yellow-400",
    });
  if (post.status !== "deleted")
    actions.push({
      label: "Delete",
      status: "deleted",
      color: "text-red-600 dark:text-red-400",
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
          <div className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
            {actions.map(({ label, status, color }) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onStatusChange(post.id, status);
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

// ─── Table ───────────────────────────────────────────────────────────────────

interface AdminPostTableProps {
  data: AdminPostListItem[];
}

export function AdminPostTable({ data }: AdminPostTableProps) {
  const mutation = useUpdatePostStatus();
  const [editingPost, setEditingPost] = useState<AdminPostListItem | null>(
    null
  );

  function handleStatusChange(postId: string, status: PostStatus) {
    if (
      status === "deleted" &&
      !window.confirm("Are you sure you want to delete this post?")
    ) {
      return;
    }
    mutation.mutate({ postId, status });
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No posts found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-28" />
          <col className="w-20" />
          <col className="w-16" />
          <col className="w-16" />
          <col className="w-24" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {[
              "",
              "Title / Artist",
              "User",
              "Status",
              "Views",
              "Spots",
              "Date",
              "",
            ].map((h) => (
              <th
                key={h || "spacer"}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((post) => (
            <tr
              key={post.id}
              className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Thumbnail */}
              <td className="px-3 py-2">
                <Image
                  src={post.image_url}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-md object-cover w-10 h-10"
                />
              </td>

              {/* Title / Artist */}
              <td className="px-3 py-2 truncate">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {post.title || post.artist_name || "Untitled"}
                </p>
                {post.group_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {post.group_name}
                  </p>
                )}
              </td>

              {/* User */}
              <td className="px-3 py-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {post.user.username}
                </p>
              </td>

              {/* Status */}
              <td className="px-3 py-2">
                <StatusBadge status={post.status} />
              </td>

              {/* Views */}
              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                {post.view_count.toLocaleString()}
              </td>

              {/* Spots */}
              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                {post.spot_count}
              </td>

              {/* Date */}
              <td
                className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
                title={new Date(post.created_at).toLocaleString()}
              >
                {relativeTime(post.created_at)}
              </td>

              {/* Actions */}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingPost(post)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Edit post"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <ActionDropdown
                    post={post}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingPost && (
        <PostEditModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
        />
      )}
    </div>
  );
}
