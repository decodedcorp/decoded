"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MainHero } from "@/lib/components/main-renewal";
import type { MainHeroData } from "@/lib/components/main-renewal";

const CircularGallery = dynamic(
  () => import("@/lib/components/ui/CircularGallery"),
  { ssr: false }
);

/** A post that can become the hero — includes its item annotations */
export interface HeroPostEntry {
  id: string;
  heroData: MainHeroData;
  items: {
    id: string;
    brand: string;
    name: string;
    imageUrl?: string;
  }[];
  galleryImage: string;
  galleryLabel: string;
}

interface HeroItemSyncProps {
  posts: HeroPostEntry[];
}

export function HeroItemSync({ posts }: HeroItemSyncProps) {
  const [activePostIndex, setActivePostIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const activePost = posts[activePostIndex] ?? posts[0];

  const switchTo = useCallback(
    (index: number) => {
      const wrapped = ((index % posts.length) + posts.length) % posts.length;
      activeIndexRef.current = wrapped;
      setActivePostIndex(wrapped);
    },
    [posts.length]
  );

  const handlePrev = useCallback(() => {
    switchTo(activeIndexRef.current - 1);
  }, [switchTo]);

  const handleNext = useCallback(() => {
    switchTo(activeIndexRef.current + 1);
  }, [switchTo]);

  // Also update on gallery scroll (debounced)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleGalleryActiveChange = useCallback(
    (index: number) => {
      if (
        index >= 0 &&
        index < posts.length &&
        index !== activeIndexRef.current
      ) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          activeIndexRef.current = index;
          setActivePostIndex(index);
        }, 600);
      }
    },
    [posts.length]
  );

  const galleryItems = useMemo(
    () =>
      posts
        .filter((p) => p.galleryImage)
        .map((p) => ({
          image: p.galleryImage,
          text: p.galleryLabel,
        })),
    [posts]
  );

  if (posts.length === 0) return null;

  return (
    <>
      <MainHero data={activePost.heroData} />

      {/* Gallery with nav arrows */}
      <div className="relative z-10 -mt-32 md:-mt-40">
        <section className="relative pt-4 pb-16 lg:pb-24">
          {/* Prev / Next arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] flex items-center justify-center text-white/70 hover:bg-white/[0.15] hover:text-white transition-all"
            aria-label="Previous post"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] flex items-center justify-center text-white/70 hover:bg-white/[0.15] hover:text-white transition-all"
            aria-label="Next post"
          >
            <ChevronRight size={20} />
          </button>

          {/* Post counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-[11px] text-white/40 tracking-widest">
            {activePostIndex + 1} / {posts.length}
          </div>

          <div className="relative h-[500px] md:h-[600px]">
            <CircularGallery
              items={galleryItems}
              bend={0.5}
              textColor="#eafd67"
              borderRadius={0.05}
              font="bold 16px Inter, sans-serif"
              onActiveChange={handleGalleryActiveChange}
              onItemClick={switchTo}
              activeIndex={activePostIndex}
            />
          </div>
        </section>
      </div>
    </>
  );
}
