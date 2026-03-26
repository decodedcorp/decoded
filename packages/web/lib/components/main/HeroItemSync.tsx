"use client";

import { MainHero } from "@/lib/components/main-renewal";
import type {
  FloatingHeroImage,
  HeroSpotAnnotation,
} from "@/lib/components/main-renewal";

/** A post that can become a floating hero image */
export interface HeroPostEntry {
  id: string;
  heroData: {
    heroImageUrl: string;
    celebrityName: string;
    ctaLink: string;
  };
  items: {
    id: string;
    brand: string;
    name: string;
    imageUrl?: string;
    price?: string;
    productLink?: string;
    /** Spot coordinate on image (0-100). If absent, auto-distributed. */
    x?: number;
    y?: number;
  }[];
  galleryImage: string;
  galleryLabel: string;
}

/**
 * Auto-distribute spots when x,y coordinates are not provided.
 * Evenly spaces vertically, alternates x between 30% and 70%.
 */
function autoDistributeSpots(
  items: HeroPostEntry["items"],
): HeroSpotAnnotation[] {
  // Limit to 4 spots max to avoid clutter
  const limited = items.slice(0, 4);
  const count = limited.length;

  return limited.map((item, i) => {
    // Alternate sides with more vertical spread
    const isLeftSide = i % 2 === 0;
    const x = item.x ?? (isLeftSide ? 20 : 80);
    // Spread vertically: each spot gets its own vertical zone
    const zoneSize = 80 / Math.max(count, 1);
    const y = item.y ?? (10 + zoneSize * i + zoneSize / 2);
    return {
      id: item.id,
      x,
      y,
      label: item.name,
      brand: item.brand,
      imageUrl: item.imageUrl,
      side: x < 50 ? "left" : "right",
      price: item.price,
      productLink: item.productLink,
    };
  });
}

interface HeroItemSyncProps {
  posts: HeroPostEntry[];
}

export function HeroItemSync({ posts }: HeroItemSyncProps) {
  if (posts.length === 0) return null;

  const images: FloatingHeroImage[] = posts.map((post) => ({
    id: post.id,
    imageUrl: post.heroData.heroImageUrl,
    label: post.galleryLabel,
    link: post.heroData.ctaLink,
    spots:
      post.items.length > 0 ? autoDistributeSpots(post.items) : undefined,
  }));

  return <MainHero images={images} />;
}
