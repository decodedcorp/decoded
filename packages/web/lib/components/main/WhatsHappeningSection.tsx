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
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <span className="text-[10px] md:text-xs font-sans font-bold tracking-[0.4em] text-[#eafd67] uppercase mb-4 block">
              Now
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-white">
              What&apos;s Happening
            </h2>
          </div>
          <Link
            href="/feed"
            className="group flex items-center gap-4 text-[10px] font-sans font-bold tracking-[0.3em] text-white/30 hover:text-white transition-all uppercase"
          >
            <span>View All</span>
            <div className="w-10 h-[1px] bg-white/10 group-hover:bg-[#eafd67] transition-all group-hover:w-14" />
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-6">
          <TrendingListSection keywords={trendingKeywords} embedded />
          <LatestPostsScroll posts={latestPosts} />
        </div>
      </div>
    </section>
  );
}
