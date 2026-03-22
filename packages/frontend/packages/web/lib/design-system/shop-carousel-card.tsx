"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * ShopCarouselCard Component
 *
 * Product card designed for horizontal carousel layouts with scroll-snap behavior.
 * Fixed width for carousel alignment, opens external shopping URLs in new tab.
 *
 * Parent container should use:
 * - overflow-x-auto
 * - snap-x snap-mandatory
 * - scroll-smooth (optional)
 * - gap-3 or gap-4 for spacing
 *
 * @see docs/design-system/decoded.pen
 *
 * @example
 * <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4">
 *   <ShopCarouselCard
 *     imageUrl="/product.jpg"
 *     brand="Nike"
 *     name="Air Max 90"
 *     price="₩129,000"
 *     href="https://shop.example.com/product/123"
 *   />
 *   <ShopCarouselCard ... />
 * </div>
 */

export interface ShopCarouselCardProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
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
   * Product price (formatted string)
   */
  price: string;
  /**
   * External shopping URL
   */
  href: string;
}

/**
 * ShopCarouselCard Component
 *
 * Displays product information in a fixed-width card for horizontal carousels.
 * Entire card is an anchor link to external shopping page.
 *
 * @example
 * <ShopCarouselCard
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   price="₩129,000"
 *   href="https://shop.example.com/product/123"
 * />
 */
export const ShopCarouselCard = forwardRef<
  HTMLAnchorElement,
  ShopCarouselCardProps
>(({ imageUrl, brand, name, price, href, className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Shop ${brand} ${name}`}
      className={cn(
        "group block flex-shrink-0 w-[180px] md:w-[220px] snap-center rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {/* Image Area */}
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="220px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 text-center space-y-1 bg-card">
        <p className="text-xs text-muted-foreground line-clamp-1">{brand}</p>
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {name}
        </h4>
        <p className="text-sm font-bold text-foreground">{price}</p>
      </div>
    </a>
  );
});

ShopCarouselCard.displayName = "ShopCarouselCard";

/**
 * ShopCarouselCardSkeleton Component
 *
 * Loading state for ShopCarouselCard with shimmer effect.
 * Matches ShopCarouselCard dimensions for seamless loading transitions.
 *
 * @example
 * <ShopCarouselCardSkeleton />
 */
export interface ShopCarouselCardSkeletonProps {
  className?: string;
}

export const ShopCarouselCardSkeleton = ({
  className,
}: ShopCarouselCardSkeletonProps) => {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-[180px] md:w-[220px] snap-center rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Image Placeholder */}
      <div className="aspect-square animate-pulse bg-muted" />

      {/* Text Placeholders */}
      <div className="p-3 space-y-2 bg-card">
        <div className="h-3 w-16 mx-auto animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 mx-auto animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 mx-auto animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
};
