"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

/**
 * ProductCard Component
 *
 * Displays product information with image, brand, name, price, and optional badge.
 * Used for product listings, search results, and recommendation grids.
 *
 * @see docs/design-system/decoded.pen
 */

const badgeStyles = {
  TOP: "bg-primary text-primary-foreground",
  NEW: "bg-blue-500 text-white",
  BEST: "bg-amber-500 text-white",
  SALE: "bg-destructive text-destructive-foreground",
} as const;

export interface ProductCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  imageUrl?: string;
  brand: string;
  name: string;
  price?: string | number;
  originalPrice?: string | number;
  badge?: "TOP" | "NEW" | "BEST" | "SALE";
  link: string;
  aspectRatio?: "1/1" | "3/4" | "4/5";
  onClick?: () => void;
}

/**
 * ProductCard Component
 *
 * Compose base Card with product image and information layout.
 * Hover state shows elevated shadow via interactive prop.
 *
 * @example
 * <ProductCard
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   price="129,000"
 *   originalPrice="159,000"
 *   badge="SALE"
 *   link="/items/123"
 * />
 */
export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      imageUrl,
      brand,
      name,
      price,
      originalPrice,
      badge,
      link,
      aspectRatio = "1/1",
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const aspectRatioClasses = {
      "1/1": "aspect-square",
      "3/4": "aspect-[3/4]",
      "4/5": "aspect-[4/5]",
    };

    const content = (
      <Card
        ref={ref}
        variant="default"
        size="sm"
        interactive
        className={cn("overflow-hidden", className)}
        {...props}
      >
        {/* Image Area */}
        <div
          className={cn("relative bg-muted", aspectRatioClasses[aspectRatio])}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
          )}

          {/* Badge */}
          {badge && (
            <div
              className={cn(
                "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold",
                badgeStyles[badge]
              )}
            >
              {badge}
            </div>
          )}
        </div>

        {/* Product Info */}
        <CardContent className="p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground line-clamp-1">{brand}</p>
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {name}
          </h4>
          {(price !== undefined || originalPrice !== undefined) && (
            <div className="flex items-center gap-2 pt-0.5">
              {price !== undefined && (
                <span className="text-sm font-bold text-foreground">
                  {typeof price === "number"
                    ? `₩${price.toLocaleString()}`
                    : price}
                </span>
              )}
              {originalPrice !== undefined && (
                <span className="text-xs text-muted-foreground line-through">
                  {typeof originalPrice === "number"
                    ? `₩${originalPrice.toLocaleString()}`
                    : originalPrice}
                </span>
              )}
            </div>
          )}
        </CardContent>
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

ProductCard.displayName = "ProductCard";

/**
 * ProductCardSkeleton Component
 *
 * Loading state for ProductCard with shimmer effect.
 * Matches ProductCard structure for seamless loading transitions.
 *
 * @example
 * <ProductCardSkeleton aspectRatio="4/5" />
 */
export interface ProductCardSkeletonProps {
  aspectRatio?: "1/1" | "3/4" | "4/5";
  className?: string;
}

export const ProductCardSkeleton = ({
  aspectRatio = "1/1",
  className,
}: ProductCardSkeletonProps) => {
  const aspectRatioClasses = {
    "1/1": "aspect-square",
    "3/4": "aspect-[3/4]",
    "4/5": "aspect-[4/5]",
  };

  return (
    <Card
      variant="default"
      size="sm"
      className={cn("overflow-hidden", className)}
    >
      {/* Image Placeholder */}
      <div
        className={cn(
          "animate-pulse bg-muted",
          aspectRatioClasses[aspectRatio]
        )}
      />

      {/* Text Placeholders */}
      <CardContent className="p-3 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
};
