"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { Card } from "@/lib/design-system";
import { useTransitionStore } from "@/lib/stores/transitionStore";
import type { ItemConfig } from "@/lib/components/ThiingsGrid";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

export interface ExploreCardCellProps extends ItemConfig {}

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
          className="relative aspect-[3/4] bg-muted"
        >
          <Image
            src={imageUrl}
            alt={`Image ${imageId}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-150 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            priority={isTopImage}
            onError={() => setImageError(true)}
            onLoad={() => setIsLoaded(true)}
          />
          {/* spotCount badge pill — top-right, only when spotCount > 0 */}
          {item?.spotCount != null && item.spotCount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <span
                className="inline-flex items-center rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm"
                aria-label={`${item.spotCount} spots`}
              >
                {item.spotCount}
              </span>
            </div>
          )}
          {/* Editorial 타이틀 오버레이 - 검은 스킴 + 텍스트 아웃라인으로 어떤 배경에서도 선명하게 */}
          {item?.editorialTitle && (
            <div className="absolute inset-x-0 bottom-0">
              {/* 하단 검은색 오버레이: 타이틀 영역 확실히 어둡게 */}
              <div
                className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-6">
                <p
                  className="line-clamp-2 text-[13px] font-semibold leading-[1.35] tracking-tight text-white antialiased"
                  style={{
                    textShadow:
                      "0 0 2px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  {item.editorialTitle}
                </p>
              </div>
            </div>
          )}
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
