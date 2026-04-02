"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * SkeletonCard Variants
 *
 * Animated placeholder card for loading states.
 * Follows decoded.pen specs: 180x225 default, #1F1F1F card bg, #3D3D3D image placeholder
 *
 * @see docs/design-system/decoded.pen
 */
export const skeletonCardVariants = cva(
  "rounded-xl bg-card border border-border overflow-hidden",
  {
    variants: {
      size: {
        sm: "w-[140px] h-[175px]",
        md: "w-[180px] h-[225px]",
        lg: "w-[220px] h-[275px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface SkeletonCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonCardVariants> {
  /** Show image placeholder area */
  showImage?: boolean;
  /** Show badge placeholder */
  showBadge?: boolean;
  /** Show title placeholder */
  showTitle?: boolean;
  /** Show subtitle placeholder */
  showSubtitle?: boolean;
}

/**
 * SkeletonCard Component
 *
 * Loading placeholder card following decoded.pen design specs.
 * Displays animated pulse placeholders for image, badge, title, and subtitle.
 *
 * @example
 * <SkeletonCard size="md" />
 *
 * @example
 * <SkeletonCard size="lg" showBadge={false} />
 *
 * @example
 * // Grid of skeletons
 * <div className="grid grid-cols-2 gap-3">
 *   {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
 * </div>
 */
export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      size,
      showImage = true,
      showBadge = true,
      showTitle = true,
      showSubtitle = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonCardVariants({ size }), className)}
        {...props}
      >
        {/* Image placeholder - #3D3D3D per decoded.pen */}
        {showImage && (
          <div className="aspect-[4/5] bg-[#3D3D3D] animate-pulse" />
        )}

        {/* Content area */}
        <div className="p-3 space-y-2">
          {/* Badge placeholder - 80x20 #52525280 rounded per decoded.pen */}
          {showBadge && (
            <div className="h-5 w-20 rounded bg-neutral-600/50 animate-pulse" />
          )}

          {/* Title placeholder */}
          {showTitle && (
            <div className="h-4 w-full rounded bg-[#3D3D3D] animate-pulse" />
          )}

          {/* Subtitle placeholder */}
          {showSubtitle && (
            <div className="h-3 w-3/4 rounded bg-[#3D3D3D] animate-pulse" />
          )}
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";
