"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { StyleCardData } from "./StyleCard";
import { PostImage } from "@/lib/components/shared/PostImage";

interface EditorialCarouselProps {
  items: StyleCardData[];
}

export function EditorialCarousel({ items }: EditorialCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.firstElementChild
      ? (track.firstElementChild as HTMLElement).offsetWidth + 12
      : 300;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft >= maxScroll - 4) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  }, []);

  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.firstElementChild
      ? (track.firstElementChild as HTMLElement).offsetWidth + 12
      : 300;
    track.scrollBy({ left: -cardWidth, behavior: "smooth" });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(scrollNext, 4000);
  }, [scrollNext]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#050505]">
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-20 mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#eafd67" }}>Trending</p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Trending{" "}
            <span className="italic font-normal text-white/60">Now</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Arrows */}
          <button
            onClick={() => { scrollPrev(); resetTimer(); }}
            aria-label="Previous"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => { scrollNext(); resetTimer(); }}
            aria-label="Next"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors ml-2"
          >
            View All
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-0.5">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-6 md:px-12 lg:px-20 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-12 lg:scroll-pl-20"
        onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
        onMouseLeave={resetTimer}
      >
        {items.map((item, i) => {
          const trendingItems = item.items?.slice(0, 3) ?? [];
          return (
            <Link
              key={item.id}
              href={item.link}
              className="group flex-none w-[72vw] sm:w-[45vw] md:w-[22vw] lg:w-[18vw] snap-start rounded-xl overflow-hidden bg-[#111] border border-white/[0.06] block"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {item.imageUrl ? (
                  <PostImage
                    src={item.imageUrl}
                    alt={item.artistName}
                    className="absolute inset-0"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                    flagKey="FeedCard"
                    priority={i < 3}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />
                {item.description && (
                  <div className="absolute top-3 left-3 z-20">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-white/70 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                      {item.description}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <p className="text-sm font-bold text-white uppercase tracking-wide line-clamp-1">
                    {item.artistName}
                  </p>
                </div>
              </div>
              {trendingItems.length > 0 && (
                <div className="p-3 flex gap-2">
                  {trendingItems.map((it) => (
                    <div key={it.id} className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-neutral-800">
                      {it.imageUrl && (
                        <Image src={it.imageUrl} alt={it.name} fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
