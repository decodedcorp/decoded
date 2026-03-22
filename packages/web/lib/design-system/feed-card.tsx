import { forwardRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, cardVariants } from "./card";

/**
 * FeedCard Component (Design System Base)
 *
 * Base card component for image-based content cards with overlay support.
 * Used as foundation for FeedCard.tsx in components/.
 *
 * Features:
 * - 4:5 aspect ratio (Instagram-style)
 * - Overlay support for badges/counts
 * - Optional footer slot
 * - Interactive hover state
 * - Link integration
 *
 * @see docs/design-system/decoded.pen
 */

export interface FeedCardProps {
  /** Image URL to display */
  imageUrl?: string;
  /** Aspect ratio of image container */
  aspectRatio?: "4/5" | "1/1" | "16/9";
  /** Overlay content (badges, counts) positioned bottom-right */
  overlay?: ReactNode;
  /** Optional href for Link wrapper */
  link?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Eager loading for above-fold images */
  priority?: boolean;
  /** Image alt text */
  alt: string;
  /** Optional footer content */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

const aspectRatioClasses = {
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
};

/**
 * FeedCard Component
 *
 * Base card for image content with overlay support.
 * Automatically handles link wrapper if link prop provided.
 *
 * @example
 * <FeedCard
 *   imageUrl="/image.jpg"
 *   alt="Product image"
 *   overlay={<Badge>New</Badge>}
 * >
 *   <CardFooter>Footer content</CardFooter>
 * </FeedCard>
 *
 * @example
 * <FeedCard
 *   imageUrl="/image.jpg"
 *   alt="Product image"
 *   link="/posts/123"
 *   overlay={<span className="badge">5 items</span>}
 * />
 */
export const FeedCard = forwardRef<HTMLDivElement, FeedCardProps>(
  (
    {
      imageUrl,
      aspectRatio = "4/5",
      overlay,
      link,
      onClick,
      priority = false,
      alt,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const cardContent = (
      <Card
        ref={ref}
        interactive={!!link || !!onClick}
        className={cn("overflow-hidden p-0", className)}
        onClick={onClick}
        {...props}
      >
        {/* Image container with aspect ratio */}
        <div
          className={cn("relative bg-muted", aspectRatioClasses[aspectRatio])}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}

          {/* Overlay content - bottom right by default */}
          {overlay && (
            <div className="absolute bottom-3 right-3">{overlay}</div>
          )}
        </div>

        {/* Optional footer content */}
        {children && <div className="p-4">{children}</div>}
      </Card>
    );

    // Wrap with Link if href provided
    if (link) {
      return (
        <Link href={link} scroll={false} className="block">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  }
);

FeedCard.displayName = "FeedCard";

export interface FeedCardSkeletonProps {
  /** Show footer skeleton */
  showFooter?: boolean;
  /** Aspect ratio for skeleton */
  aspectRatio?: "4/5" | "1/1" | "16/9";
  /** Additional class names */
  className?: string;
}

/**
 * FeedCardSkeleton Component
 *
 * Loading placeholder for FeedCard with animated shimmer.
 *
 * @example
 * <FeedCardSkeleton aspectRatio="4/5" />
 *
 * @example
 * <FeedCardSkeleton showFooter={true} />
 */
export const FeedCardSkeleton = ({
  showFooter = false,
  aspectRatio = "4/5",
  className,
}: FeedCardSkeletonProps) => {
  return (
    <div
      className={cn(
        cardVariants({ variant: "default" }),
        "overflow-hidden p-0",
        className
      )}
    >
      {/* Image skeleton */}
      <div
        className={cn(
          "animate-pulse bg-muted",
          aspectRatioClasses[aspectRatio]
        )}
      >
        {/* Badge skeleton */}
        <div className="absolute bottom-3 right-3 h-6 w-14 animate-pulse rounded-full bg-muted-foreground/20" />
      </div>

      {/* Footer skeleton */}
      {showFooter && (
        <div className="p-4 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}
    </div>
  );
};
