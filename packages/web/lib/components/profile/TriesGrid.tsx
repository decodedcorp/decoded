"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getMyTries } from "@/lib/api/generated/users/users";
import type { TryItem } from "@/lib/api/generated/models";

// ============================================================
// Constants
// ============================================================

const PER_PAGE = 20;

// ============================================================
// Component
// ============================================================

export interface TriesGridProps {
  className?: string;
}

export function TriesGrid({ className }: TriesGridProps) {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/v1/users/me/tries"],
    queryFn: async ({ pageParam }) =>
      getMyTries({ page: pageParam as number, per_page: PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });

  const tries: TryItem[] = data?.pages.flatMap((page) => page.data) ?? [];

  // IntersectionObserver sentinel for infinite scroll
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

    return () => {
      observer.disconnect();
    };
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
        <p className="text-sm text-muted-foreground">Failed to load tries</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm underline text-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No try-on results yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Try on items from any post to see results here
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
      {tries.map((t) => (
        <button
          key={t.id}
          className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30"
        >
          <div className="relative aspect-[3/4]">
            <Image
              src={t.image_url}
              alt="Try-on result"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="flex items-center justify-end">
              <span className="text-[10px] text-white/50">
                {new Date(t.created_at).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </button>
      ))}

      {/* Sentinel for infinite scroll trigger */}
      <div ref={sentinelRef} className="col-span-full h-1" />

      {/* Loading more indicator */}
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
