"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAdminUpdatePost } from "@/lib/hooks/admin/useAdminPostEdit";
import type { AdminPostListItem } from "@/lib/api/admin/posts";

interface PostEditModalProps {
  post: AdminPostListItem;
  onClose: () => void;
}

export function PostEditModal({ post, onClose }: PostEditModalProps) {
  const [artistName, setArtistName] = useState(post.artist_name ?? "");
  const [groupName, setGroupName] = useState(post.group_name ?? "");
  const [context, setContext] = useState(post.context ?? "");

  const mutation = useAdminUpdatePost();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        postId: post.id,
        artist_name: artistName || undefined,
        group_name: groupName || undefined,
        context: context || undefined,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Edit post"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Artist Name
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={256}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={256}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Context
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={512}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
