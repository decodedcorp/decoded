"use client";

import dynamic from "next/dynamic";

export const DynamicTrendingListSection = dynamic(
  () =>
    import("@/lib/components/main/TrendingListSection").then((m) => ({
      default: m.TrendingListSection,
    })),
  { ssr: false, loading: () => <div className="min-h-[320px]" /> }
);

export const DynamicMasonryGrid = dynamic(
  () => import("@/lib/components/main-renewal/MasonryGrid"),
  { ssr: false, loading: () => <div className="min-h-[600px]" /> }
);

export const DynamicDomeGallerySection = dynamic(
  () =>
    import("@/lib/components/main/DynamicHomeFeed").then((m) => ({
      default: m.DomeGallerySection,
    })),
  { ssr: false, loading: () => <div className="min-h-[400px]" /> }
);
