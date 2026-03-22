"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "./card";
import { SpotCard } from "./spot-card";
import { cn } from "@/lib/utils";

/**
 * SpotDetail Component
 *
 * Comprehensive spot information display with image overlay layout.
 * Used in detail modals and spot information panels.
 *
 * @see docs/design-system/decoded.pen
 */

export interface SpotDetailShopLink {
  /** Shop name (e.g., "Musinsa", "29CM") */
  shopName: string;
  /** Shop URL */
  url: string;
  /** Product price at this shop (formatted string) */
  price: string;
  /** Optional shop logo URL */
  logoUrl?: string;
}

export interface SpotDetailRelatedItem {
  imageUrl?: string;
  brand: string;
  name: string;
  price: string;
  onClick?: () => void;
}

export interface SpotDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main spot image URL */
  imageUrl?: string;
  /** Brand name */
  brand: string;
  /** Product name */
  name: string;
  /** Optional detailed description */
  description?: string;
  /** Shopping links with individual prices */
  shopLinks: SpotDetailShopLink[];
  /** Optional related/similar items */
  relatedItems?: SpotDetailRelatedItem[];
  /** Optional callback when shop link clicked */
  onShopClick?: (shopLink: SpotDetailShopLink) => void;
}

/**
 * SpotDetail Component
 *
 * Displays comprehensive spot information with image overlay and shopping integration.
 *
 * Layout:
 * 1. Hero image with gradient overlay
 * 2. Brand/name/price range overlaid on image bottom
 * 3. Shop links list below image
 * 4. Optional related items section
 *
 * @example
 * <SpotDetail
 *   imageUrl="/product.jpg"
 *   brand="Nike"
 *   name="Air Max 90"
 *   shopLinks={[
 *     { shopName: "Musinsa", url: "https://...", price: "₩129,000" },
 *     { shopName: "29CM", url: "https://...", price: "₩132,000" },
 *   ]}
 *   relatedItems={[...]}
 * />
 */
export const SpotDetail = forwardRef<HTMLDivElement, SpotDetailProps>(
  (
    {
      imageUrl,
      brand,
      name,
      description,
      shopLinks,
      relatedItems,
      onShopClick,
      className,
      ...props
    },
    ref
  ) => {
    // Calculate price range if multiple shops
    const prices = shopLinks.map((link) =>
      parseFloat(link.price.replace(/[^\d]/g, ""))
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange =
      minPrice === maxPrice
        ? shopLinks[0].price
        : `${shopLinks.find((l) => parseFloat(l.price.replace(/[^\d]/g, "")) === minPrice)?.price} - ${shopLinks.find((l) => parseFloat(l.price.replace(/[^\d]/g, "")) === maxPrice)?.price}`;

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {/* Hero Image Section with Overlay */}
        <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-muted">
          {/* Image */}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Info Overlay on Image Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {/* Brand */}
            <p className="text-sm font-medium text-white/80 mb-1">{brand}</p>

            {/* Product Name */}
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">{name}</h2>

            {/* Price Range */}
            <p className="text-lg font-semibold">{priceRange}</p>
          </div>
        </div>

        {/* Description (if provided) */}
        {description && (
          <div className="px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Shop Links Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-1">
            Where to Buy
          </h3>

          <div className="space-y-2">
            {shopLinks.map((link, index) => (
              <Card
                key={index}
                variant="default"
                size="sm"
                interactive
                onClick={() => {
                  onShopClick?.(link);
                  window.open(link.url, "_blank", "noopener,noreferrer");
                }}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="flex items-center justify-between p-4">
                  {/* Shop Info */}
                  <div className="flex items-center gap-3">
                    {link.logoUrl && (
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={link.logoUrl}
                          alt={link.shopName}
                          fill
                          sizes="32px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {link.shopName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {link.price}
                      </p>
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Related Items Section */}
        {relatedItems && relatedItems.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-foreground px-1">
              Similar Items
            </h3>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {relatedItems.map((item, index) => (
                <div key={index} className="flex-shrink-0 w-40 snap-start">
                  <SpotCard
                    variant="compact"
                    imageUrl={item.imageUrl}
                    brand={item.brand}
                    name={item.name}
                    price={item.price}
                    onClick={item.onClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SpotDetail.displayName = "SpotDetail";

/**
 * SpotDetailSkeleton Component
 *
 * Loading state for SpotDetail with shimmer effect.
 * Matches SpotDetail structure for seamless loading transitions.
 *
 * @example
 * <SpotDetailSkeleton />
 */
export interface SpotDetailSkeletonProps {
  /** Show related items skeleton section */
  showRelatedItems?: boolean;
  className?: string;
}

export const SpotDetailSkeleton = ({
  showRelatedItems = false,
  className,
}: SpotDetailSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Hero Image Skeleton */}
      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-muted animate-pulse">
        {/* Overlay Info Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
          <div className="h-4 w-20 bg-white/20 rounded" />
          <div className="h-6 w-48 bg-white/20 rounded" />
          <div className="h-5 w-32 bg-white/20 rounded" />
        </div>
      </div>

      {/* Shop Links Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded px-1" />

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="default" size="sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-md animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Related Items Skeleton */}
      {showRelatedItems && (
        <div className="space-y-3 pt-2">
          <div className="h-4 w-24 bg-muted rounded px-1" />

          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-40">
                <div className="w-40 h-40 bg-muted rounded-md animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
