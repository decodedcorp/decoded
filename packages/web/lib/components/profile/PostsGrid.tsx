"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { fetchPostsByUserProfile } from "@/lib/supabase/queries/profile";
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

interface PostItem {
  id: string;
  imageUrl: string;
  title?: string;
  itemCount: number;
}

export interface PostsGridProps {
  userId?: string;
  posts?: PostItem[];
  className?: string;
}

function PostsGridItem({ post }: { post: PostItem }) {
  const { width: imgW, height: imgH } = useImageDimensions(post.imageUrl);
  const useDynamicRatio = FEATURE_FLAGS.dynamicImageRatio.PostsGrid;

  return (
    <Link
      href={`/posts/${post.id}`}
      className={cn(
        "group relative rounded-lg overflow-hidden",
        useDynamicRatio ? "bg-black" : "aspect-[4/5] bg-muted"
      )}
    >
      <img
        src={post.imageUrl}
        alt={post.title || "Post"}
        {...(useDynamicRatio && imgW && imgH ? { width: imgW, height: imgH } : {})}
        className={cn(
          "transition-transform duration-300 group-hover:scale-105",
          useDynamicRatio
            ? "w-full object-contain max-h-[300px]"
            : "h-full w-full object-cover"
        )}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium text-white truncate">
          {post.title}
        </p>
        <p className="text-[10px] text-white/70">{post.itemCount} items</p>
      </div>
    </Link>
  );
}

export function PostsGrid({ userId, posts, className }: PostsGridProps) {
  const { data: fetchedPosts, isLoading } = useQuery({
    queryKey: ["profile", "posts", userId],
    queryFn: () => fetchPostsByUserProfile(userId!),
    enabled: !!userId && !posts,
    select: (rows) =>
      rows.map((row) => ({
        id: row.id,
        imageUrl: row.image_url || "",
        title: row.media_title || row.artist_name || "Untitled",
        itemCount: 0,
      })),
  });

  const displayPosts = posts ?? fetchedPosts;

  if (isLoading && !displayPosts) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!displayPosts || displayPosts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No posts yet</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
      {displayPosts.map((post) => (
        <PostsGridItem key={post.id} post={post} />
      ))}
    </div>
  );
}
