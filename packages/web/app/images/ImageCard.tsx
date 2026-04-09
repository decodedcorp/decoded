"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/api/mutation-types";
import { formatRelativeTime } from "@/lib/utils";

type Props = {
  post: Post;
};

/**
 * Image card component for post display
 *
 * Displays post thumbnail with account badge and spot count indicator.
 * Links to /posts/[id] instead of /images/[id].
 * Styled to match grid design tokens.
 */
export function ImageCard({ post }: Props) {
  const [imageError, setImageError] = useState(false);
  const displayName = post.artist_name || post.group_name || "Unknown";

  return (
    <Link href={`/posts/${post.id}`}>
      <article className="border border-border rounded-xl overflow-hidden relative shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        {/* Image thumbnail — dynamic aspect-ratio when dimensions known, square fallback */}
        <div
          className={
            post.image_width && post.image_height
              ? "bg-muted relative"
              : "aspect-square bg-muted relative"
          }
          style={
            post.image_width && post.image_height
              ? { aspectRatio: `${post.image_width} / ${post.image_height}` }
              : undefined
          }
        >
          {post.image_url && !imageError ? (
            post.image_width && post.image_height ? (
              <Image
                src={post.image_url}
                alt={`Post by @${displayName}`}
                className="w-full h-full object-cover"
                width={post.image_width}
                height={post.image_height}
                onError={() => setImageError(true)}
              />
            ) : (
              <Image
                src={post.image_url}
                alt={`Post by @${displayName}`}
                className="object-cover"
                fill
                onError={() => setImageError(true)}
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
              <div className="text-2xl mb-1">📷</div>
              <div className="text-xs">No image</div>
            </div>
          )}
        </div>

        {/* Spot count badge (top right) */}
        {post.spot_count > 0 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {post.spot_count} {post.spot_count === 1 ? "item" : "items"}
            </span>
          </div>
        )}

        {/* Card footer with metadata */}
        <div className="p-2 bg-card border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>@{displayName}</div>
            <div>{formatRelativeTime(post.created_at)}</div>
          </div>
        </div>
      </article>
    </Link>
  );
}
