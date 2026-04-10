"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useTransitionStore } from "@/lib/stores/transitionStore";
import { Card } from "@/lib/design-system/card";
import { Hotspot } from "@/lib/design-system/hotspot";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { AccountAvatar } from "@/lib/components/shared/AccountAvatar";
import { FollowButton } from "@/lib/components/shared/FollowButton";
import { useSpots } from "@/lib/hooks/useSpots";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import { useTrackDwellTime } from "@/lib/hooks/useTrackDwellTime";
import { PostImage } from "@/lib/components/shared/PostImage";

// Register GSAP Flip plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

/**
 * Get badge styles based on source
 */
function getSourceBadgeStyles(source?: string): string {
  switch (source?.toLowerCase()) {
    case "instagram":
      return "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]";
    case "tiktok":
      return "bg-black";
    default:
      return "bg-muted-foreground/60";
  }
}

/**
 * Format date as relative time
 */
function formatRelativeTime(date?: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}

export interface FeedCardItem {
  id: string;
  imageUrl: string | null;
  status?: string;
  hasItems?: boolean;
  postId?: string;
  postSource?: string;
  postAccount?: string;
  postCreatedAt?: Date | string;
  // Engagement fields
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  // DB dimensions for CLS prevention
  imageWidth?: number | null;
  imageHeight?: number | null;
}

interface FeedCardProps {
  item: FeedCardItem;
  index: number;
  priority?: boolean;
}

/**
 * FeedCard - Instagram-style full-width card
 *
 * Minimal design with image and item count badge
 * Used in vertical feed layout (VerticalFeed)
 * Uses design-system Card component with GSAP Flip animations
 */
export const FeedCard = memo(
  ({ item, index: _index, priority = false }: FeedCardProps) => {
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const setTransition = useTransitionStore((state) => state.setTransition);
    const track = useTrackEvent();
    const dwellRef = useTrackDwellTime(item.id);

    // Engagement state
    const [engagement, setEngagement] = useState({
      isLiked: item.isLiked ?? false,
      likeCount: item.likeCount ?? 0,
      commentCount: item.commentCount ?? 0,
    });

    const { id, imageUrl, hasItems, imageWidth, imageHeight } = item;
    const aspectRatio =
      imageWidth && imageHeight ? imageWidth / imageHeight : undefined;

    // Fetch spots for cards with items
    const { data: spotsData } = useSpots(item.postId!, {
      enabled: !!item.hasItems && !!item.postId,
    });

    // Generate mockup spots when no real data exists
    const spots = useMemo(() => {
      if (spotsData && spotsData.length > 0) return spotsData;
      if (!hasItems) return [];

      // Deterministic pseudo-random from id
      const seed = id
        ? id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
        : 0;
      const count = (seed % 3) + 1; // 1-3 spots
      return Array.from({ length: count }, (_, i) => ({
        id: `mock-${id}-${i}`,
        position_left: String(20 + ((seed * (i + 1) * 37) % 60)),
        position_top: String(25 + ((seed * (i + 1) * 53) % 50)),
        category: null as null,
      }));
    }, [spotsData, hasItems, id]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!id) return;

      // Track post_click event
      track({
        event_type: "post_click",
        entity_id: id,
        metadata: { source: "feed" },
      });

      const target = e.currentTarget.querySelector(
        "[data-flip-id]"
      ) as HTMLElement;
      if (!target) return;

      // Capture FLIP state before navigation
      try {
        const state = Flip.getState(target);
        const rect = target.getBoundingClientRect();
        setTransition(id, state, rect, imageUrl ?? undefined);
      } catch (_error) {
        const rect = target.getBoundingClientRect();
        setTransition(id, null, rect, imageUrl ?? undefined);
      }
    };

    const handleLike = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEngagement((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
      // TODO: API call to like/unlike
    };

    const handleComment = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Navigate to comments or open modal
      console.log("Open comments for:", item.id);
    };

    const handleShare = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/posts/${item.id}`;

      if (navigator.share) {
        try {
          await navigator.share({ url });
        } catch (err) {
          // User cancelled or error
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        // TODO: Show toast notification
      }
    };

    const cardContent = (
      // dwellRef tracks 3-second viewport visibility for dwell_time event
      <article
        data-testid="feed-card"
        ref={dwellRef as React.RefObject<HTMLElement>}
      >
        <Card
          data-flip-id={id ? `feed-card-${id}` : undefined}
          interactive
          className="relative w-full overflow-hidden p-0"
        >
          {/* Author header */}
          {item.postAccount && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <AccountAvatar name={item.postAccount} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  @{item.postAccount}
                </p>
                {item.postCreatedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.postCreatedAt)}
                  </p>
                )}
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <FollowButton size="sm" />
              </div>
            </div>
          )}

          {/* Image container - dynamic ratio or 4:5 aspect ratio like Instagram */}
          <div
            className="relative overflow-hidden"
            style={aspectRatio ? { aspectRatio } : undefined}
          >
            {imageUrl ? (
              <PostImage
                src={imageUrl}
                alt={`Image ${id}`}
                maxHeight="80vh"
                flagKey="FeedCard"
                priority={priority}
                onLoad={() => setIsLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-neutral-900" />
            )}

            {/* Subtle spot indicators */}
            {spots.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {spots.map((spot) => (
                  <Hotspot
                    key={spot.id}
                    variant="inactive"
                    position={{
                      x: parseFloat(spot.position_left),
                      y: parseFloat(spot.position_top),
                    }}
                    className="pointer-events-none !w-3 !h-3 opacity-50"
                    label={
                      spot.category?.name?.en ||
                      spot.category?.name?.ko ||
                      "Item"
                    }
                  />
                ))}
              </div>
            )}

            {/* Top overlay: Source badge + Item count */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
              {/* Source badge */}
              {item.postSource && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium text-white",
                    getSourceBadgeStyles(item.postSource)
                  )}
                >
                  {item.postSource}
                </span>
              )}
              {/* Item count badge */}
              {hasItems && (
                <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Items
                </span>
              )}
            </div>

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
              {/* Account name */}
              {item.postAccount && (
                <p className="font-semibold text-white text-base">
                  @{item.postAccount}
                </p>
              )}
              {/* Relative time */}
              {item.postCreatedAt && (
                <p className="text-xs text-white/70 mt-0.5">
                  {formatRelativeTime(item.postCreatedAt)}
                </p>
              )}

              {/* Engagement actions overlay */}
              <div className="flex items-center gap-4 mt-3">
                {/* Like button */}
                <button
                  data-testid="like-button"
                  onClick={handleLike}
                  className="flex items-center gap-1 text-white transition-transform"
                  aria-label={engagement.isLiked ? "Unlike" : "Like"}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-all",
                      engagement.isLiked
                        ? "fill-primary text-primary scale-110"
                        : "text-white hover:scale-110"
                    )}
                  />
                  {engagement.likeCount > 0 && (
                    <span className="text-xs font-medium">
                      {engagement.likeCount}
                    </span>
                  )}
                </button>

                {/* Comment button */}
                <button
                  onClick={handleComment}
                  className="flex items-center gap-1 text-white"
                  aria-label="Comments"
                >
                  <MessageCircle className="h-5 w-5 hover:scale-110 transition-transform" />
                  {engagement.commentCount > 0 && (
                    <span className="text-xs font-medium">
                      {engagement.commentCount}
                    </span>
                  )}
                </button>

                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="ml-auto text-white"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5 hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </article>
    );

    if (!id) {
      return cardContent;
    }

    return (
      <Link
        href={`/posts/${id}`}
        scroll={false}
        onClick={handleClick}
        className="block"
      >
        {cardContent}
      </Link>
    );
  }
);

FeedCard.displayName = "FeedCard";

/**
 * FeedCardSkeleton - Loading placeholder for FeedCard
 */
export const FeedCardSkeleton = memo(() => {
  return (
    <Card className="relative w-full overflow-hidden p-0">
      <div className="relative aspect-[4/5] animate-pulse bg-muted">
        {/* Top badges skeleton */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted-foreground/20" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
        {/* Bottom info skeleton */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
          <div className="h-4 w-24 animate-pulse rounded bg-white/20 mb-1" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </Card>
  );
});

FeedCardSkeleton.displayName = "FeedCardSkeleton";
