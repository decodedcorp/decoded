"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

/**
 * ArtistCard Component
 *
 * Displays artist profile in card format with avatar, name, and post count.
 * Used in artist grids, profile sections, and discovery flows.
 *
 * Features:
 * - Avatar image with fallback (first letter of name)
 * - Post count display
 * - Click-to-profile navigation
 * - Hover state with subtle transition
 *
 * @see docs/design-system/decoded.pen
 */

export interface ArtistCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  /** Artist's unique identifier for profile link */
  id: string;
  /** Artist's display name */
  name: string;
  /** Avatar image URL (optional) */
  avatarUrl?: string;
  /** Number of posts by this artist */
  postCount: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ArtistCard Component
 *
 * Compose base Card with artist avatar and information layout.
 * Hover state shows elevated shadow via interactive prop.
 *
 * @example
 * <ArtistCard
 *   id="user-123"
 *   name="Jane Doe"
 *   avatarUrl="/avatars/jane.jpg"
 *   postCount={42}
 * />
 */
export const ArtistCard = forwardRef<HTMLDivElement, ArtistCardProps>(
  ({ id, name, avatarUrl, postCount, className, ...props }, ref) => {
    // Get first letter of name for fallback
    const initial = name.charAt(0).toUpperCase();

    const content = (
      <Card
        ref={ref}
        variant="default"
        size="sm"
        interactive
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <CardContent className="flex flex-col items-center gap-3 p-4 min-w-[120px]">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <span className="text-2xl font-bold text-primary">
                  {initial}
                </span>
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="flex flex-col items-center gap-0.5 w-full">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1 text-center w-full">
              {name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {postCount.toLocaleString()} {postCount === 1 ? "post" : "posts"}
            </p>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <Link href={`/profile/${id}`} className="block">
        {content}
      </Link>
    );
  }
);

ArtistCard.displayName = "ArtistCard";

/**
 * ArtistCardSkeleton Component
 *
 * Loading state for ArtistCard with shimmer effect.
 * Matches ArtistCard structure for seamless loading transitions.
 *
 * @example
 * <ArtistCardSkeleton />
 */
export interface ArtistCardSkeletonProps {
  className?: string;
}

export const ArtistCardSkeleton = ({ className }: ArtistCardSkeletonProps) => {
  return (
    <Card
      variant="default"
      size="sm"
      className={cn("overflow-hidden", className)}
    >
      <CardContent className="flex flex-col items-center gap-3 p-4 min-w-[120px]">
        {/* Avatar Placeholder */}
        <div className="w-16 h-16 rounded-full animate-pulse bg-muted" />

        {/* Text Placeholders */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
};
