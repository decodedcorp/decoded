"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { EditorialMagazineData } from "./types";
import { PostImage } from "@/lib/components/shared/PostImage";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface EditorialMagazineProps {
  data: EditorialMagazineData;
  className?: string;
}

/**
 * Editorial Magazine — Horizontal scroll pinned section.
 *
 * Vertical scroll converts to horizontal scroll revealing magazine-cover cards.
 * Each card has a slight parallax offset. Progress bar tracks scroll position.
 */
export default function EditorialMagazine({
  data,
  className,
}: EditorialMagazineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

      if (cards.length === 0) return;

      // Total horizontal scroll distance: full track width minus the visible viewport width
      const getScrollDistance = () =>
        track.scrollWidth -
        (sectionRef.current?.offsetWidth ?? window.innerWidth);

      // Main horizontal scroll tween, pinned
      const mainTween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Drive progress bar fill in sync with scroll progress
            if (progressFillRef.current) {
              gsap.set(progressFillRef.current, {
                scaleX: self.progress,
              });
            }
          },
        },
      });

      // Parallax: each card moves at a slightly different rate relative to the track
      cards.forEach((card, i) => {
        // Alternate between slightly slower and faster for organic feel
        const parallaxOffset = (i % 2 === 0 ? -1 : 1) * 20;
        gsap.to(card, {
          y: parallaxOffset,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            scrub: 1,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            containerAnimation: mainTween,
          },
        });
      });

      // Header fade-in on scroll entry
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 40%",
            scrub: 0.8,
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [data.cards] }
  );

  return (
    <section
      ref={sectionRef}
      className={`relative bg-[var(--mag-bg)] overflow-hidden ${className ?? ""}`}
      aria-label="Editorial magazine"
    >
      {/* Section header */}
      <div
        ref={headerRef}
        className="mx-auto max-w-7xl px-6 pt-24 pb-8"
        style={{ opacity: 0 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mag-accent)] mb-3">
          Editorial
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-[var(--mag-text)]">
          The <span className="text-[var(--mag-accent)]">Magazine</span>
        </h2>
      </div>

      {/* Horizontal track — this element is translated on scroll */}
      <div className="relative h-[80vh] overflow-visible">
        <div
          ref={trackRef}
          className="flex gap-6 px-6 h-full items-center will-change-transform"
          style={{ width: "max-content" }}
        >
          {data.cards.length > 0 ? (
            data.cards.map((card, idx) => (
              <article
                key={`${card.id}-${idx}`}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="flex-none w-[70vw] md:w-[40vw] lg:w-[30vw] h-[65vh] rounded-2xl overflow-hidden
                           bg-neutral-900 border border-neutral-800 relative group will-change-transform"
              >
                {/* Cover image */}
                {card.imageUrl ? (
                  <PostImage
                    src={card.imageUrl}
                    alt={card.title}
                    className="absolute inset-0"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                    priority={idx === 0}
                    flagKey="FeedCard"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900" />
                )}

                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/60 to-transparent z-20" />

                {/* Card text */}
                <div className="absolute inset-x-0 bottom-0 p-6 relative z-20">
                  {card.category && (
                    <span className="text-[10px] uppercase tracking-widest text-[var(--mag-accent)] mb-2 block">
                      {card.category}
                    </span>
                  )}
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[var(--mag-text)] leading-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-neutral-400">{card.artistName}</p>
                  {card.subtitle && (
                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                      {card.subtitle}
                    </p>
                  )}
                </div>

                {/* Hover: neon corner accent */}
                <div
                  className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[var(--mag-accent)]
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                />
              </article>
            ))
          ) : (
            <div className="w-[100vw] flex items-center justify-center text-neutral-600">
              <p className="text-sm">Magazine cards will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar — fixed at bottom of section */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-neutral-800">
        <div
          ref={progressFillRef}
          className="h-full bg-[var(--mag-accent)] origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}
