"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shirt, ChevronRight, ImageIcon } from "lucide-react";
import { useSearchStore } from "@decoded/shared";
import type { SearchResultItem } from "@decoded/shared/types/search";

interface ItemResultSectionProps {
  items: SearchResultItem[];
  maxItems?: number;
  showSeeAll?: boolean;
}

/**
 * Items search results section
 *
 * Features:
 * - Section header with icon
 * - Responsive grid of item thumbnails
 * - "See all" link to switch to Items tab
 */
export const ItemResultSection = memo(function ItemResultSection({
  items,
  maxItems = 6,
  showSeeAll = true,
}: ItemResultSectionProps) {
  const setActiveTab = useSearchStore((s) => s.setActiveTab);

  if (items.length === 0) {
    return null;
  }

  const displayedItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Items</h2>
        </div>
        {showSeeAll && hasMore && (
          <button
            onClick={() => setActiveTab("items")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            See all
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {displayedItems.map((item) => (
          <ItemThumbnail key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
});

// ============================================================
// Item Thumbnail Component
// ============================================================

interface ItemThumbnailProps {
  item: SearchResultItem;
}

const ItemThumbnail = memo(function ItemThumbnail({
  item,
}: ItemThumbnailProps) {
  const imageUrl = item.thumbnail_url || item.image_url;
  const alt = item.product_name || item.brand || "Item";

  return (
    <Link
      href={`/post/${item.id}`}
      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Hover overlay with brand/name */}
      {(item.brand || item.product_name) && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <div className="text-white truncate">
            {item.brand && (
              <p className="text-[10px] font-medium uppercase tracking-wide">
                {item.brand}
              </p>
            )}
            {item.product_name && (
              <p className="text-xs truncate">{item.product_name}</p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
});
