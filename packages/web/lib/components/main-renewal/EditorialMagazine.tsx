"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { EditorialMagazineData, MagazineCard } from "./types";
import { PostImage } from "@/lib/components/shared/PostImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface EditorialMagazineProps {
  data: EditorialMagazineData;
  className?: string;
}

export default function EditorialMagazine({ data, className }: EditorialMagazineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const cards = data.cards;
  const active = cards[activeIdx];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % cards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [cards.length]);
  const nextCards = [1, 2].map((offset) => cards[(activeIdx + offset) % cards.length]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [cards] }
  );

  if (cards.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`relative bg-[#050505] ${className ?? ""}`}
      aria-label="Editorial magazine"
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-8"
        style={{ opacity: 0 }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "#eafd67" }}>Editorial</p>
            <h2
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              The{" "}
              <span className="italic font-normal text-white/60">Editorial</span>
            </h2>
          </div>
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors pb-2"
          >
            View All
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-0.5">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Slider */}
      <div className="pb-20 md:pb-28">
        <div className="relative flex gap-3 items-start px-6 md:px-12 lg:px-20">

          {/* ← Arrow — on active card left edge */}
          <button
            onClick={() => setActiveIdx((i) => (i - 1 + cards.length) % cards.length)}
            disabled={false}
            aria-label="Previous"
            className="hidden md:flex absolute left-6 md:left-12 lg:left-20 top-1/2 -translate-y-1/2 z-30 w-11 h-16 items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white disabled:opacity-0 disabled:pointer-events-none transition-all rounded-r-xl"
          >
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <path d="M11 2L3 11L11 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Active card */}
          {active && (
            <Link
              href={active.link || "#"}
              className="group relative flex-none w-full md:w-[calc(25%-9px)] aspect-[3/4] rounded-xl overflow-hidden block"
            >
              {active.imageUrl ? (
                <PostImage
                  src={active.imageUrl}
                  alt={active.title}
                  className="absolute inset-0"
                  imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                  priority
                  flagKey="FeedCard"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 p-5 z-20">
                <h3
                  className="text-xl md:text-2xl font-bold text-white leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {active.title}
                </h3>
                {active.subtitle && (
                  <p className="text-xs text-white/50 mt-1.5 line-clamp-1">{active.subtitle}</p>
                )}
              </div>
            </Link>
          )}

          {/* Related Product panel — desktop only */}
          {active && (
            <div className="hidden md:flex flex-none w-[calc(25%-9px)] aspect-[3/4] flex-col rounded-xl overflow-hidden bg-[#111] border border-white/[0.06]">
              <div className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-white uppercase tracking-[0.15em]">
                  Related Product
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
                {(active.items ?? []).slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 mb-0.5">
                          {item.brand}
                        </p>
                      )}
                      <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/[0.06]">
                <Link
                  href={active.link || "#"}
                  className="block w-full text-center text-xs font-medium text-white/60 hover:text-white py-2.5 border border-white/10 hover:border-white/30 rounded-lg transition-all"
                >
                  View more
                </Link>
              </div>
            </div>
          )}

          {/* Next cards */}
          {nextCards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => setActiveIdx(activeIdx + 1 + i)}
              className={`group relative flex-none hidden md:block w-[calc(25%-9px)] aspect-[3/4] rounded-xl overflow-hidden text-left transition-opacity duration-300 ${
                i === 0 ? "opacity-70 hover:opacity-90" : "opacity-40 hover:opacity-60"
              }`}
            >
              {card.imageUrl ? (
                <PostImage
                  src={card.imageUrl}
                  alt={card.title}
                  className="absolute inset-0"
                  imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                  flagKey="FeedCard"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 p-5 z-20">
                <h3
                  className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {card.title}
                </h3>
                {card.subtitle && (
                  <p className="text-[11px] text-white/40 mt-1 line-clamp-1">{card.subtitle}</p>
                )}
              </div>
            </button>
          ))}

          {/* → Arrow — on last card right edge */}
          <button
            onClick={() => setActiveIdx((i) => (i + 1) % cards.length)}
            disabled={false}
            aria-label="Next"
            className="hidden md:flex absolute right-6 md:right-12 lg:right-20 top-1/2 -translate-y-1/2 z-30 w-11 h-16 items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white disabled:opacity-0 disabled:pointer-events-none transition-all rounded-l-xl"
          >
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <path d="M3 2L11 11L3 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Mobile item strip */}
        {active && (active.items ?? []).length > 0 && (
          <div className="md:hidden mx-6 mt-3 rounded-xl overflow-hidden bg-[#111] border border-white/[0.06]">
            <div className="divide-y divide-white/[0.05]">
              {(active.items ?? []).slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.title} fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 mb-0.5">{item.brand}</p>
                    )}
                    <p className="text-xs font-medium text-white leading-snug line-clamp-1">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06]">
              <Link href={active.link || "#"} className="block w-full text-center text-xs font-medium text-white/60 py-2 border border-white/10 rounded-lg">
                View more
              </Link>
            </div>
          </div>
        )}

        {/* Dot indicators */}
        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-5 h-1.5 bg-[#eafd67]"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
