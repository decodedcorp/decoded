"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardSkeleton } from "./card";
import { cn } from "@/lib/utils";

/**
 * GridCard Component
 *
 * Flexible card for gallery layouts with configurable aspect ratios.
 * Supports optional overlay content for badges, counts, or actions.
 *
 * @see docs/design-system/decoded.pen
 */

export interface GridCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  imageUrl?: string;
  aspectRatio?: "1/1" | "3/4" | "4/3" | "4/5" | "16/9";
  overlay?: React.ReactNode;
  link?: string;
  onClick?: () => void;
  priority?: boolean;
  alt: string;
}

/**
 * GridCard Component
 *
 * Gallery card with full-height image and optional overlay content.
 * Uses base Card for consistent styling and interactive states.
 *
 * @example
 * <GridCard
 *   imageUrl="/gallery.jpg"
 *   aspectRatio="4/5"
 *   alt="Gallery image"
 *   overlay={<Badge>Featured</Badge>}
 *   link="/gallery/123"
 * />
 *
 * @example
 * <GridCard
 *   imageUrl="/photo.jpg"
 *   aspectRatio="16/9"
 *   alt="Photo"
 *   overlay={
 *     <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded">
 *       <span className="text-white text-xs">12 items</span>
 *     </div>
 *   }
 * />
 */
export const GridCard = forwardRef<HTMLDivElement, GridCardProps>(
  (
    {
      imageUrl,
      aspectRatio = "4/5",
      overlay,
      link,
      onClick,
      priority = false,
      alt,
      className,
      ...props
    },
    ref
  ) => {
    const aspectRatioClasses = {
      "1/1": "aspect-square",
      "3/4": "aspect-[3/4]",
      "4/3": "aspect-[4/3]",
      "4/5": "aspect-[4/5]",
      "16/9": "aspect-video",
    };

    const content = (
      <Card
        ref={ref}
        variant="default"
        size="sm"
        interactive={!!(link || onClick)}
        className={cn("overflow-hidden p-0", className)}
        {...props}
      >
        <div
          className={cn("relative bg-muted", aspectRatioClasses[aspectRatio])}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
          )}

          {/* Overlay Content */}
          {overlay && overlay}
        </div>
      </Card>
    );

    if (link && !onClick) {
      return (
        <Link href={link} className="block">
          {content}
        </Link>
      );
    }

    if (onClick) {
      return (
        <div onClick={onClick} className="block">
          {content}
        </div>
      );
    }

    return content;
  }
);

GridCard.displayName = "GridCard";

/**
 * GridCardSkeleton Component
 *
 * Loading state for GridCard with shimmer effect.
 * No text areas, just image placeholder with aspect ratio.
 *
 * @example
 * <GridCardSkeleton aspectRatio="4/5" />
 */
export interface GridCardSkeletonProps {
  aspectRatio?: "1/1" | "3/4" | "4/3" | "4/5" | "16/9";
  className?: string;
}

export const GridCardSkeleton = ({
  aspectRatio = "4/5",
  className,
}: GridCardSkeletonProps) => {
  return (
    <CardSkeleton
      variant="default"
      size="sm"
      aspectRatio={
        aspectRatio === "4/5" ? "4/5" : aspectRatio === "16/9" ? "16/9" : "1/1"
      }
      showHeader={false}
      showContent={false}
      showFooter={false}
      className={className}
    />
  );
};
