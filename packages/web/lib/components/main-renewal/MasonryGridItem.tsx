"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import type { GridItemData, GridItemSpot } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface MasonryGridItemProps {
  item: GridItemData;
  index: number;
  className?: string;
}

/**
 * Height presets per layout variant.
 * Cycles through 3 sizes to create visual rhythm in the masonry grid.
 */
const HEIGHT_VARIANTS = [
  { base: 320, min: 280, max: 420 }, // tall
  { base: 240, min: 200, max: 300 }, // compact
  { base: 360, min: 320, max: 480 }, // hero
];

function clampHeight(aspectRatio: number, index: number): number {
  const v = HEIGHT_VARIANTS[index % HEIGHT_VARIANTS.length];
  return Math.min(v.max, Math.max(v.min, Math.round(v.base * aspectRatio)));
}

/* ------------------------------------------------------------------ */
/*  Spot Marker + Tooltip                                              */
/* ------------------------------------------------------------------ */

function SpotMarker({ spot }: { spot: GridItemSpot }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div
      className="absolute z-10"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      {/* Pulsing neon dot */}
      <span className="spot-marker block h-2.5 w-2.5 rounded-full bg-mag-accent shadow-[0_0_12px_var(--mag-accent)]" />

      {/* Tooltip popup */}
      {showPopup && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-mag-accent/30 bg-mag-bg/90 px-3 py-2 text-xs text-mag-text backdrop-blur-sm">
          <p className="font-semibold">{spot.label}</p>
          {spot.brand && <p className="text-mag-text/60">{spot.brand}</p>}
          {spot.price && <p className="text-mag-accent">{spot.price}</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MasonryGridItem                                                    */
/* ------------------------------------------------------------------ */

export default function MasonryGridItem({
  item,
  index,
  className,
}: MasonryGridItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotsRef = useRef<HTMLDivElement>(null);

  const aspectRatio = item.aspectRatio ?? 1;
  const height = clampHeight(aspectRatio, index);
  const hasSpots = item.spots && item.spots.length > 0;

  /* ---- GSAP: parallax + entry animation ---- */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Parallax on scroll
      const parallaxAmount = -20 * (0.5 + Math.random() * 0.5);
      gsap.to(el, {
        y: parallaxAmount,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Entry animation: scrub-linked
      gsap.fromTo(
        el,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 60%",
            scrub: 0.5 + index * 0.1,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [index]);

  /* ---- GSAP: spot markers fade-in on hover (contextSafe for proper cleanup) ---- */
  const { contextSafe } = useGSAP({ scope: cardRef });

  const handleMouseEnter = contextSafe(() => {
    const container = spotsRef.current;
    if (!container || !hasSpots) return;
    const markers = container.querySelectorAll(".spot-marker");
    if (markers.length === 0) return;
    gsap.fromTo(
      markers,
      { opacity: 0, scale: 0 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        stagger: 0.05,
        ease: "back.out(2)",
      }
    );
  });

  const handleMouseLeave = contextSafe(() => {
    const container = spotsRef.current;
    if (!container || !hasSpots) return;
    const markers = container.querySelectorAll(".spot-marker");
    if (markers.length === 0) return;
    gsap.to(markers, { opacity: 0, scale: 0, duration: 0.2 });
  });

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-xl opacity-0 ${className ?? ""}`}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background image */}
      <Image
        src={item.imageUrl}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />

      {/* Spot overlay markers */}
      {hasSpots && (
        <div ref={spotsRef} className="absolute inset-0">
          {item.spots!.map((spot, i) => (
            <SpotMarker key={`${item.id}-spot-${i}`} spot={spot} />
          ))}
        </div>
      )}

      {/* Bottom gradient + text */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
        <h3 className="text-sm font-semibold text-mag-text">{item.title}</h3>
        {item.subtitle && (
          <p className="mt-0.5 text-xs text-mag-text/60">{item.subtitle}</p>
        )}
        {item.category && (
          <span className="mt-1.5 inline-block rounded-full border border-mag-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-mag-accent">
            {item.category}
          </span>
        )}
      </div>
    </div>
  );
}
