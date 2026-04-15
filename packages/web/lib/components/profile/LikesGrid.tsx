"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { apiClient } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================

interface LikedItem {
  id: string;
  post_id: string;
  post_title?: string | null;
  post_thumbnail_url?: string | null;
  liked_at: string;
}

interface PaginatedLikedResponse {
  data: LikedItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

// ============================================================
// Constants
// ============================================================

const PER_PAGE = 20;

// ============================================================
// Sub-components
// ============================================================

function LikesGridItemCard({ item }: { item: LikedItem }) {
  const { width, height } = useImageDimensions(item.post_thumbnail_url ?? null);
  const aspectRatio = width && height ? width / height : undefined;

  return (
    <Link
      href={`/images/${item.post_id}`}
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 block"
    >
      <div className="relative" style={{ aspectRatio: aspectRatio ?? "3/4" }}>
        {item.post_thumbnail_url ? (
          <Image
            src={item.post_thumbnail_url}
            alt={item.post_title ?? "Liked post"}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-end justify-between gap-1">
          <span className="text-[11px] text-white/90 font-medium truncate">
            {item.post_title ?? "Untitled"}
          </span>
          <span className="text-[10px] text-white/50 shrink-0">
            {new Date(item.liked_at).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Component
// ============================================================

export interface LikesGridProps {
  className?: string;
}

export function LikesGrid({ className }: LikesGridProps) {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/v1/users/me/liked"],
    queryFn: ({ pageParam }) =>
      apiClient<PaginatedLikedResponse>({
        path: `/api/v1/users/me/liked?page=${pageParam}&per_page=${PER_PAGE}`,
        method: "GET",
        requiresAuth: true,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });

  const items: LikedItem[] = data?.pages.flatMap((page) => page.data) ?? [];

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load liked posts
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm underline text-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Heart className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          좋아요한 포스트가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          마음에 드는 포스트에 좋아요를 눌러보세요
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
      {items.map((item) => (
        <LikesGridItemCard key={item.id} item={item} />
      ))}

      <div ref={sentinelRef} className="col-span-full h-1" />

      {isFetchingNextPage && (
        <div className="col-span-full grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}
