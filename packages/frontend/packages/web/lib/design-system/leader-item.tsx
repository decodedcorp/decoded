"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LeaderItem Component
 *
 * Displays leaderboard ranking item with podium positions and user highlight.
 * Used in profile leaderboard sections and competition rankings.
 *
 * Features:
 * - Podium positions (1-3) with gold/silver/bronze medals
 * - Current user highlight with border and background
 * - Rank change indicator with arrow and value
 * - Avatar with fallback (first letter)
 * - Click handler for profile preview modal
 *
 * @see docs/design-system/decoded.pen
 */

export interface LeaderItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Leaderboard ranking position */
  rank: number;
  /** User avatar image URL (optional) */
  avatarUrl?: string;
  /** User display nickname */
  nickname: string;
  /** User score/points */
  score: number;
  /** Rank change from previous period (optional) */
  rankChange?: {
    /** Direction of rank change */
    direction: "up" | "down" | "neutral";
    /** Absolute value of rank change */
    value: number;
  };
  /** Whether this is the current user viewing the leaderboard */
  isCurrentUser?: boolean;
  /** Click handler for profile preview modal */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LeaderItem Component
 *
 * Display leaderboard item with medal for top 3 and rank change indicator.
 *
 * @example
 * <LeaderItem
 *   rank={1}
 *   avatarUrl="/avatars/user1.jpg"
 *   nickname="TopPlayer"
 *   score={9999}
 *   rankChange={{ direction: "up", value: 2 }}
 *   isCurrentUser={false}
 * />
 *
 * @example
 * <LeaderItem
 *   rank={15}
 *   nickname="CurrentUser"
 *   score={1234}
 *   isCurrentUser={true}
 * />
 */
export const LeaderItem = forwardRef<HTMLDivElement, LeaderItemProps>(
  (
    {
      rank,
      avatarUrl,
      nickname,
      score,
      rankChange,
      isCurrentUser = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isPodium = rank >= 1 && rank <= 3;
    const initial = nickname.charAt(0).toUpperCase();

    // Podium medal colors and icons
    const getMedalStyles = (rank: number) => {
      switch (rank) {
        case 1:
          return {
            bg: "bg-yellow-500/10",
            text: "text-yellow-500",
            icon: Trophy,
          };
        case 2:
          return {
            bg: "bg-gray-400/10",
            text: "text-gray-400",
            icon: Trophy,
          };
        case 3:
          return {
            bg: "bg-orange-600/10",
            text: "text-orange-600",
            icon: Trophy,
          };
        default:
          return null;
      }
    };

    const medalStyles = getMedalStyles(rank);

    // Rank change styles
    const getRankChangeStyles = (direction: string) => {
      switch (direction) {
        case "up":
          return {
            color: "text-primary",
            icon: TrendingUp,
          };
        case "down":
          return {
            color: "text-destructive",
            icon: TrendingDown,
          };
        default:
          return {
            color: "text-muted-foreground",
            icon: Minus,
          };
      }
    };

    const rankChangeStyles = rankChange
      ? getRankChangeStyles(rankChange.direction)
      : null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg transition-colors",
          isPodium && medalStyles?.bg,
          isCurrentUser && "border-l-4 border-primary bg-primary/5",
          onClick && "cursor-pointer hover:bg-muted/50",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        aria-label={
          onClick ? `View ${nickname}'s profile, rank ${rank}` : undefined
        }
        {...props}
      >
        {/* Rank or Medal */}
        <div className="flex items-center justify-center w-8 md:w-10 flex-shrink-0">
          {isPodium && medalStyles ? (
            <medalStyles.icon
              className={cn("w-6 h-6 md:w-7 md:h-7", medalStyles.text)}
            />
          ) : (
            <span className="text-sm md:text-base font-bold text-muted-foreground">
              {rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={nickname}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-lg md:text-xl font-bold text-primary">
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Nickname */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm md:text-base font-semibold truncate",
              isCurrentUser ? "text-primary" : "text-foreground"
            )}
          >
            {nickname}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <span className="text-sm md:text-base font-bold text-foreground">
            {score.toLocaleString()}
          </span>

          {/* Rank Change Indicator */}
          {rankChange && rankChangeStyles && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs md:text-sm font-medium",
                rankChangeStyles.color
              )}
            >
              <rankChangeStyles.icon className="w-3 h-3 md:w-4 md:h-4" />
              <span>{rankChange.value}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

LeaderItem.displayName = "LeaderItem";

/**
 * LeaderItemSkeleton Component
 *
 * Loading state for LeaderItem with shimmer effect.
 * Matches LeaderItem structure for seamless loading transitions.
 *
 * @example
 * <LeaderItemSkeleton />
 */
export interface LeaderItemSkeletonProps {
  className?: string;
}

export const LeaderItemSkeleton = ({ className }: LeaderItemSkeletonProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg",
        className
      )}
    >
      {/* Rank Placeholder */}
      <div className="w-8 md:w-10 h-6 animate-pulse rounded bg-muted flex-shrink-0" />

      {/* Avatar Placeholder */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full animate-pulse bg-muted flex-shrink-0" />

      {/* Nickname Placeholder */}
      <div className="flex-1">
        <div className="h-4 md:h-5 w-24 md:w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Score Placeholder */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="h-4 md:h-5 w-16 md:w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 md:h-4 w-8 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
};
