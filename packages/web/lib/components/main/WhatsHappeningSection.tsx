"use client";

import Link from "next/link";
import { TrendingListSection } from "./TrendingListSection";
import type { TrendingKeywordItem } from "./TrendingListSection";
import { LatestPostsScroll } from "./LatestPostsScroll";
import type { LatestPostCardData } from "./LatestPostsScroll";

interface WhatsHappeningSectionProps {
  trendingKeywords: TrendingKeywordItem[];
  latestPosts: LatestPostCardData[];
}

export function WhatsHappeningSection({
  trendingKeywords,
  latestPosts,
}: WhatsHappeningSectionProps) {
  if (trendingKeywords.length === 0 && latestPosts.length === 0) return null;

  return (
    <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#eafd67]" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 font-sans font-medium">
              What&apos;s Happening
            </h2>
          </div>
          <Link
            href="/feed"
            className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-[#eafd67] transition-colors py-3 px-2 -my-3 -mx-2"
          >
            View All
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
          <TrendingListSection keywords={trendingKeywords} embedded />
          <LatestPostsScroll posts={latestPosts} />
        </div>
      </div>
    </section>
  );
}
