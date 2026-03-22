"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ItemCardData } from "./ItemCard";

const CircularGallery = dynamic(
  () => import("@/lib/components/ui/CircularGallery"),
  { ssr: false }
);

interface TopItemsSectionProps {
  items?: ItemCardData[];
  onActiveChange?: (index: number) => void;
  activeIndex?: number;
}

export function TopItemsSection({
  items,
  onActiveChange,
  activeIndex,
}: TopItemsSectionProps) {
  if (!items || items.length === 0) return null;

  const galleryItems = useMemo(
    () =>
      items
        .filter((item) => item.imageUrl)
        .map((item) => ({
          image: `/api/v1/image-proxy?url=${encodeURIComponent(item.imageUrl!)}`,
          text: `${item.brand} — ${item.name}`,
        })),
    [items]
  );

  if (galleryItems.length === 0) return null;

  return (
    <section className="pt-4 pb-16 lg:pb-24">
      {/* CircularGallery — WebGL 3D orbit gallery */}
      <div className="relative h-[500px] md:h-[600px]">
        <CircularGallery
          items={galleryItems}
          bend={0.5}
          textColor="#eafd67"
          borderRadius={0.05}
          font="bold 16px Inter, sans-serif"
          onActiveChange={onActiveChange}
          activeIndex={activeIndex}
        />
      </div>
    </section>
  );
}
