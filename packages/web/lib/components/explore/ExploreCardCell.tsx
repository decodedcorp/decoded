"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { Card } from "@/lib/design-system";
import { useTransitionStore } from "@/lib/stores/transitionStore";
import type { ItemConfig } from "@/lib/components/ThiingsGrid";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import { PostImage } from "@/lib/components/shared/PostImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

export type ExploreCardCellProps = ItemConfig;

/**
 * ExploreCardCell Component
 *
 * Card cell for ThiingsGrid with FLIP page transitions.
 * Uses design-system Card with custom FLIP animation logic.
 */
export const ExploreCardCell = memo(function ExploreCardCell({
  gridIndex,
  item,
}: ExploreCardCellProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const setTransition = useTransitionStore((state) => state.setTransition);
  const track = useTrackEvent();

  const isTopImage = gridIndex < 6;
  const imageUrl = item?.imageUrl;
  const imageId = item?.id;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!imageId) return;

    // Track post_click event
    track({
      event_type: "post_click",
      entity_id: imageId,
      metadata: { source: "explore" },
    });

    const target = e.currentTarget.querySelector("article") as HTMLElement;
    if (!target) return;

    // Capture FLIP state before navigation
    try {
      const state = Flip.getState(target);
      const rect = target.getBoundingClientRect();

      setTransition(imageId, state, rect, imageUrl ?? undefined);
    } catch (_error) {
      // Fallback: just store rect if Flip.getState fails
      const rect = target.getBoundingClientRect();
      setTransition(imageId, null, rect, imageUrl ?? undefined);
    }
  };

  if (!imageId || !imageUrl || imageError) {
    return (
      <div className="absolute inset-1 rounded-xl border border-border bg-card/60">
        <div className="h-full w-full bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <Link
      href={`/posts/${imageId}`}
      scroll={false}
      onClick={handleClick}
      className="absolute inset-1"
    >
      <Card
        variant="default"
        size="sm"
        interactive
        className="h-full overflow-hidden p-0"
      >
        <article
          data-flip-id={`card-${imageId}`}
          className="relative overflow-hidden h-full bg-black"
        >
          <PostImage
            src={imageUrl}
            alt={`Image ${imageId}`}
            maxHeight="60vh"
            className="h-full"
            flagKey="ExploreCardCell"
            priority={isTopImage}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
          />
        </article>
      </Card>
    </Link>
  );
});

/**
 * ExploreSkeletonCell Component
 *
 * Loading skeleton for ExploreCardCell with correct aspect ratio.
 */
export const ExploreSkeletonCell = memo(function ExploreSkeletonCell() {
  return (
    <div className="absolute inset-1 rounded-xl border border-border bg-card/60">
      <div className="relative aspect-[3/4] animate-pulse bg-muted rounded-xl" />
    </div>
  );
});
