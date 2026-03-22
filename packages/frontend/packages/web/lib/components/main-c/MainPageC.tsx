"use client";

import type { MainCPost } from "./types";
import { EditorialHero } from "./EditorialHero";
import { MoodboardGrid } from "./MoodboardGrid";
import { CuratedStory } from "./CuratedStory";
import { MarqueeFooter } from "./MarqueeFooter";
import { GrainOverlay } from "./GrainOverlay";

interface MainPageCProps {
  posts: MainCPost[];
}

/**
 * Main Page C — Avant-Garde Editorial Layout
 *
 * Distributes 7 posts across sections:
 * - Hero: posts[0] (main) + posts[1] (detail)
 * - Moodboard: posts[2..3]
 * - Curated Story: posts[3..6]
 */
export function MainPageC({ posts }: MainPageCProps) {
  const heroMain = posts[0];
  const heroDetail = posts[1];
  const moodboardImages = posts.slice(2, 4);
  const storyImages = posts.slice(3, 7);

  return (
    <div className="relative min-h-screen bg-[#080808] text-white overflow-x-hidden pb-10">
      {/* Navigation bar — mix-blend-difference */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-6 md:px-12 py-5">
          <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-white">
            DECODED
          </span>
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-mono tracking-[0.2em] text-white/60 uppercase hidden md:block">
              Editorial
            </span>
            <span className="text-[11px] font-mono tracking-[0.2em] text-white/60 uppercase hidden md:block">
              Archive
            </span>
            <span className="text-[11px] font-mono tracking-[0.2em] text-white/60 uppercase">
              Index
            </span>
          </div>
        </div>
      </nav>

      {heroMain && (
        <EditorialHero mainImage={heroMain} detailImage={heroDetail} />
      )}

      {moodboardImages.length >= 2 && (
        <MoodboardGrid images={moodboardImages} />
      )}

      {storyImages.length > 0 && <CuratedStory images={storyImages} />}

      <MarqueeFooter />
      <GrainOverlay />
    </div>
  );
}
