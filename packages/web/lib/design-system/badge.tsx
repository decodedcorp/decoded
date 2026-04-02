"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { HelpCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

/**
 * Badge Component
 *
 * Displays achievement badges in profile gamification system.
 * Shows earned badges with full color and locked badges as dark silhouettes.
 *
 * Features:
 * - Earned state: Full color badge with name
 * - Locked state: Dark silhouette with "?" icon
 * - Click handler for detail modal
 * - Fixed size for grid display
 *
 * @see docs/design-system/decoded.pen
 */

export const badgeVariants = cva(
  "flex flex-col items-center justify-center gap-2 transition-all duration-200",
  {
    variants: {
      variant: {
        earned: "hover:scale-105 hover:shadow-lg",
        locked: "opacity-60",
      },
    },
    defaultVariants: {
      variant: "earned",
    },
  }
);

export interface BadgeProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  /** Badge unique identifier */
  id: string;
  /** Badge display name */
  name: string;
  /** Badge icon image URL */
  iconUrl: string;
  /** Badge description */
  description?: string;
  /** Date when badge was earned (optional, only for earned badges) */
  earnedAt?: Date;
  /** Visual state of the badge */
  variant?: "earned" | "locked";
  /** Click handler for modal trigger */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge Component
 *
 * Display achievement badge with earned/locked state.
 * Click to show details in modal.
 *
 * @example
 * <Badge
 *   id="badge-001"
 *   name="First Post"
 *   iconUrl="/badges/first-post.png"
 *   variant="earned"
 *   onClick={() => openModal('badge-001')}
 * />
 *
 * @example
 * <Badge
 *   id="badge-002"
 *   name="???"
 *   iconUrl="/badges/mystery.png"
 *   variant="locked"
 *   onClick={() => openModal('badge-002')}
 * />
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      id,
      name,
      iconUrl,
      description,
      earnedAt,
      variant = "earned",
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isLocked = variant === "locked";

    return (
      <Card
        ref={ref}
        variant="default"
        size="sm"
        interactive={!!onClick}
        className={cn("overflow-hidden w-full max-w-[120px]", className)}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        aria-label={isLocked ? "Locked badge" : `${name} badge`}
        {...props}
      >
        <CardContent
          className={cn(badgeVariants({ variant }), "p-4 min-h-[140px]")}
        >
          {/* Badge Icon */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <div
              className={cn(
                "relative w-full h-full rounded-full overflow-hidden",
                isLocked && "grayscale brightness-50"
              )}
            >
              <Image
                src={iconUrl}
                alt={isLocked ? "Locked badge" : name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            {/* Locked Overlay with ? icon */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                <HelpCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Badge Name */}
          <div className="flex flex-col items-center gap-0.5 w-full">
            <p
              className={cn(
                "text-sm font-semibold text-center line-clamp-2 w-full",
                isLocked ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {isLocked ? "???" : name}
            </p>

            {/* Earned Date (only for earned badges) */}
            {!isLocked && earnedAt && (
              <p className="text-xs text-muted-foreground">
                {earnedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

Badge.displayName = "Badge";

/**
 * BadgeSkeleton Component
 *
 * Loading state for Badge with shimmer effect.
 * Matches Badge structure for seamless loading transitions.
 *
 * @example
 * <BadgeSkeleton />
 */
export interface BadgeSkeletonProps {
  className?: string;
}

export const BadgeSkeleton = ({ className }: BadgeSkeletonProps) => {
  return (
    <Card
      variant="default"
      size="sm"
      className={cn("overflow-hidden w-full max-w-[120px]", className)}
    >
      <CardContent className="flex flex-col items-center gap-2 p-4 min-h-[140px]">
        {/* Icon Placeholder */}
        <div className="w-20 h-20 rounded-full animate-pulse bg-muted" />

        {/* Text Placeholders */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
};
