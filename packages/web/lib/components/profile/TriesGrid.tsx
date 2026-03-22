"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ============================================================
// Types
// ============================================================

interface TryResult {
  id: string;
  result_image_url: string;
  source_post_id: string | null;
  created_at: string;
  item_count: number;
}

// ============================================================
// Fetch — TODO: replace with real API
// ============================================================

async function fetchMyTries(): Promise<TryResult[]> {
  // Will be: GET /api/v1/users/me/tries
  return [];
}

// ============================================================
// Component
// ============================================================

export interface TriesGridProps {
  className?: string;
}

export function TriesGrid({ className }: TriesGridProps) {
  const { data: tries = [], isLoading } = useQuery({
    queryKey: ["my-tries"],
    queryFn: fetchMyTries,
    staleTime: 1000 * 60,
  });

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
              src={t.result_image_url}
              alt="Try-on result"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/70">
                {t.item_count} item{t.item_count > 1 ? "s" : ""}
              </span>
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
    </div>
  );
}
