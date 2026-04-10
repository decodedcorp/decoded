"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { GridItemData } from "./types";
import MasonryGridItem from "./MasonryGridItem";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface MasonryGridProps {
  items: GridItemData[];
  className?: string;
}

/**
 * MasonryGrid -- CSS columns-based masonry layout with GSAP scroll animations.
 */
export default function MasonryGrid({ items, className }: MasonryGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Header title: slide from left + fade
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, x: -60, filter: "blur(6px)" },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 92%",
            end: "top 55%",
            scrub: 0.8,
          },
        }
      );

      // Grid container: subtle fade up
      gsap.fromTo(
        gridRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 95%",
            end: "top 65%",
            scrub: 1,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className={`bg-mag-bg px-6 py-16 md:py-24 md:px-12 lg:px-20 ${className ?? ""}`}
    >
      {/* Section header */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div ref={headerRef} style={{ opacity: 0 }}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
            Curated
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Decoded{" "}
            <span className="italic font-normal text-white/60">Picks</span>
          </h2>
        </div>
      </div>

      {/* Masonry grid */}
      <div
        ref={gridRef}
        className="mx-auto max-w-7xl columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"
        style={{ opacity: 0 }}
      >
        {items.map((item, index) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <MasonryGridItem item={item} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}
