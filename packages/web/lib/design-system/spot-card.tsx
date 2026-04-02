"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * SpotCard Variants
 *
 * Product spot card component with 3 display contexts:
 * - default: Grid view with square aspect ratio
 * - active: Detail panel with highlighted border
 * - compact: Horizontal list with small thumbnail
 *
 * @see docs/design-system/decoded.pen
 */
export const spotCardVariants = cva(
  "group cursor-pointer transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: Grid context - square image with text below
        default:
          "w-full rounded-lg overflow-hidden hover:shadow-md hover:scale-[1.02]",
        // Active: Detail panel - larger with highlight border
        active:
          "w-full rounded-lg overflow-hidden shadow-lg ring-2 ring-primary",
        // Compact: List context - horizontal layout with small thumbnail
        compact:
          "flex flex-row items-center gap-3 rounded-md p-2 hover:bg-muted/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SpotCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">,
    VariantProps<typeof spotCardVariants> {
  /**
   * Product image URL
   */
  imageUrl?: string;
  /**
   * Brand name
   */
  brand: string;
  /**
   * Product name
   */
  name: string;
  /**
   * Product price (formatted string or number)
   */
  price: string;
  /**
   * Click handler for modal trigger
   */
  onClick?: () => void;
}

/**
 * SpotCard Component
 *
 * Displays product spot information with 3 variant layouts.
 * Designed for interactive product spotting with modal trigger (NOT navigation).
 *
 * @example
 * // Grid view
 * <SpotCard
 *   variant="default"
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   price="₩129,000"
 *   onClick={() => openModal(item)}
 * />
 *
 * @example
 * // Active detail panel
 * <SpotCard
 *   variant="active"
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   price="₩129,000"
 *   onClick={() => openModal(item)}
 * />
 *
 * @example
 * // Compact list
 * <SpotCard
 *   variant="compact"
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   price="₩129,000"
 *   onClick={() => openModal(item)}
 * />
 */
export const SpotCard = forwardRef<HTMLDivElement, SpotCardProps>(
  (
    {
      imageUrl,
      brand,
      name,
      price,
      variant = "default",
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    // Compact variant: horizontal layout
    if (variant === "compact") {
      return (
        <div
          ref={ref}
          onClick={onClick}
          className={cn(spotCardVariants({ variant }), className)}
          {...props}
        >
          {/* Image: Small square thumbnail */}
          <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
            )}
          </div>

          {/* Text: Beside image */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground line-clamp-1">
              {brand}
            </p>
            <h4 className="text-sm font-medium text-foreground line-clamp-1">
              {name}
            </h4>
            <p className="text-sm font-bold text-foreground">{price}</p>
          </div>
        </div>
      );
    }

    // Default & Active variants: vertical layout with image on top
    const isActive = variant === "active";

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(spotCardVariants({ variant }), className)}
        {...props}
      >
        {/* Image Area */}
        <div
          className={cn(
            "relative bg-muted",
            isActive ? "aspect-[4/5]" : "aspect-square"
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes={
                isActive
                  ? "(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw"
                  : "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              }
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
          )}
        </div>

        {/* Product Info */}
        <div className={cn("space-y-0.5", isActive ? "p-4" : "p-3")}>
          <p
            className={cn(
              "text-muted-foreground line-clamp-1",
              isActive ? "text-sm" : "text-xs"
            )}
          >
            {brand}
          </p>
          <h4
            className={cn(
              "font-medium text-foreground",
              isActive ? "text-base line-clamp-2" : "text-sm truncate"
            )}
          >
            {name}
          </h4>
          <p
            className={cn(
              "font-bold text-foreground",
              isActive ? "text-base" : "text-sm"
            )}
          >
            {price}
          </p>
        </div>
      </div>
    );
  }
);

SpotCard.displayName = "SpotCard";

/**
 * SpotCardSkeleton Component
 *
 * Loading state for SpotCard with shimmer effect.
 * Matches SpotCard structure for seamless loading transitions.
 *
 * @example
 * <SpotCardSkeleton variant="default" />
 * <SpotCardSkeleton variant="active" />
 * <SpotCardSkeleton variant="compact" />
 */
export interface SpotCardSkeletonProps {
  variant?: "default" | "active" | "compact";
  className?: string;
}

export const SpotCardSkeleton = ({
  variant = "default",
  className,
}: SpotCardSkeletonProps) => {
  // Compact variant skeleton
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-row items-center gap-3 p-2", className)}>
        <div className="w-16 h-16 flex-shrink-0 animate-pulse rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  // Default & Active variant skeleton
  const isActive = variant === "active";

  return (
    <div className={cn("w-full rounded-lg overflow-hidden", className)}>
      {/* Image Placeholder */}
      <div
        className={cn(
          "animate-pulse bg-muted",
          isActive ? "aspect-[4/5]" : "aspect-square"
        )}
      />

      {/* Text Placeholders */}
      <div className={cn("space-y-2", isActive ? "p-4" : "p-3")}>
        <div
          className={cn(
            "animate-pulse rounded bg-muted",
            isActive ? "h-4 w-20" : "h-3 w-16"
          )}
        />
        <div
          className={cn(
            "animate-pulse rounded bg-muted",
            isActive ? "h-5 w-40" : "h-4 w-32"
          )}
        />
        <div
          className={cn(
            "animate-pulse rounded bg-muted",
            isActive ? "h-4 w-24" : "h-3 w-20"
          )}
        />
      </div>
    </div>
  );
};
