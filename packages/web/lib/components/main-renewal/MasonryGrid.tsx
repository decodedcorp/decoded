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
  const accentRef = useRef<HTMLDivElement>(null);
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

      // Accent bar: width expand
      gsap.fromTo(
        accentRef.current,
        { scaleX: 0, transformOrigin: "left" },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
            end: "top 50%",
            scrub: 0.6,
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
      className={`bg-mag-bg px-4 py-16 sm:px-6 lg:px-8 ${className ?? ""}`}
    >
      {/* Section header */}
      <div className="mx-auto mb-10 max-w-7xl">
        <h2
          ref={headerRef}
          className="text-2xl font-bold uppercase tracking-widest text-mag-text sm:text-3xl"
          style={{ opacity: 0 }}
        >
          DECODED PICKS
        </h2>
        <div
          ref={accentRef}
          className="mt-2 h-0.5 w-12 bg-mag-accent"
          style={{ transform: "scaleX(0)" }}
        />
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
