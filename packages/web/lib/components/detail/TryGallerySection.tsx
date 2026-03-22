"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { useTries } from "@/lib/hooks/useTries";
import { useVtonStore, type VtonPreloadItem } from "@/lib/stores/vtonStore";
import { TryCard } from "./TryCard";

type Props = {
  postId: string;
  /** Items from the post — passed to VTON when user taps "시도하기" */
  items?: VtonPreloadItem[];
};

const VISIBLE_LIMIT = 6;

/**
 * TryGallerySection - Shows user "Try" posts linked to the current post.
 *
 * Placed before Social Actions in ImageDetailContent.
 * Fades up on scroll into view using Motion.
 */
export function TryGallerySection({ postId, items = [] }: Props) {
  const router = useRouter();
  const openWithItems = useVtonStore((s) => s.openWithItems);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const { data, isLoading, isError } = useTries(postId, VISIBLE_LIMIT);

  // Silent fail — hide section on error
  if (isError) return null;

  const tries = data?.tries ?? [];
  const total = data?.total ?? 0;
  const visibleTries = tries.slice(0, VISIBLE_LIMIT);
  const overflowCount = total > VISIBLE_LIMIT ? total - VISIBLE_LIMIT : 0;

  const handleTryClick = (tryId: string) => {
    router.push(`/posts/${tryId}`);
  };

  const handleCTA = () => {
    if (items.length > 0) {
      openWithItems(postId, items);
    } else {
      router.push(`/request/try?parent=${postId}`);
    }
  };

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-6 py-8 md:px-10 border-t border-border"
    >
      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[9px] md:text-[10px] font-semibold uppercase tracking-[3px] text-muted-foreground">
            TRIES
          </span>
          {!isLoading && total > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
              {total}
            </span>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tries.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            아직 시도한 사람이 없어요
          </p>
          <button
            type="button"
            onClick={handleCTA}
            className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            첫 번째로 시도하기
          </button>
        </div>
      )}

      {/* Try grid */}
      {!isLoading && visibleTries.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {visibleTries.map((tryPost) => (
              <TryCard
                key={tryPost.id}
                id={tryPost.id}
                imageUrl={tryPost.image_url}
                username={
                  tryPost.user.username ??
                  tryPost.user.display_name ??
                  "unknown"
                }
                avatarUrl={tryPost.user.avatar_url}
                comment={tryPost.media_title}
                onClick={() => handleTryClick(tryPost.id)}
              />
            ))}

            {/* "+N more" overflow card */}
            {overflowCount > 0 && (
              <button
                type="button"
                onClick={handleCTA}
                className="aspect-[3/4] rounded-xl bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
              >
                <span className="text-lg font-semibold text-foreground">
                  +{overflowCount}
                </span>
                <span className="text-xs text-muted-foreground">more</span>
              </button>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleCTA}
              className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              나도 해봤어
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
