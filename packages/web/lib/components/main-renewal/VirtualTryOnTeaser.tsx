"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { VTONTeaserData } from "./types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface VirtualTryOnTeaserProps {
  data: VTONTeaserData;
  className?: string;
}

/** Threshold (0-1) at which the CTA button activates */
const CTA_THRESHOLD = 0.85;

/**
 * VTON Teaser — Draggable before/after slider.
 *
 * Dragging the handle left/right reveals more of the after (try-on) image via clip-path.
 * When slider passes 85%, the CTA button activates with a neon glow animation.
 */
export default function VirtualTryOnTeaser({
  data,
  className,
}: VirtualTryOnTeaserProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [activePairIndex, setActivePairIndex] = useState(0);
  const [sliderPct, setSliderPct] = useState(0.5); // 0 = all before, 1 = all after
  const [ctaActive, setCtaActive] = useState(false);

  const isDragging = useRef(false);
  const activePair = data.pairs[activePairIndex];

  // ─── Scroll entrance animation ───────────────────────────────────────
  useGSAP(
    () => {
      if (!sectionRef.current || !headerRef.current) return;

      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            end: "top 50%",
            scrub: 0.8,
          },
        }
      );

      gsap.fromTo(
        headerRef.current,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 45%",
            scrub: 0.6,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  // ─── CTA activation animation ─────────────────────────────────────────
  useEffect(() => {
    if (!ctaRef.current) return;
    gsap.killTweensOf(ctaRef.current);
    if (ctaActive) {
      gsap.to(ctaRef.current, {
        opacity: 1,
        scale: 1,
        cursor: "pointer",
        boxShadow: "0 0 24px 4px var(--mag-accent)",
        duration: 0.4,
        ease: "back.out(1.5)",
      });
    } else {
      gsap.to(ctaRef.current, {
        opacity: 0.35,
        scale: 0.96,
        boxShadow: "none",
        duration: 0.25,
        ease: "power2.in",
      });
    }
  }, [ctaActive]);

  // ─── Handle position sync ─────────────────────────────────────────────
  useEffect(() => {
    if (!handleRef.current) return;
    handleRef.current.style.left = `${sliderPct * 100}%`;
  }, [sliderPct]);

  // ─── Pointer drag logic ───────────────────────────────────────────────
  const updateSlider = useCallback((clientX: number) => {
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const rawPct = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, rawPct));
    setSliderPct(clamped);
    setCtaActive(clamped >= CTA_THRESHOLD);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ─── Pair navigation ──────────────────────────────────────────────────
  const selectPair = useCallback((idx: number) => {
    setActivePairIndex(idx);
    setSliderPct(0.5);
    setCtaActive(false);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-[80vh] bg-[var(--mag-bg)] overflow-hidden ${className ?? ""}`}
      aria-label="Virtual try-on teaser"
      style={{ opacity: 0 }}
    >
      {/* Section header */}
      <div
        ref={headerRef}
        className="mx-auto max-w-7xl px-6 pt-24 pb-12"
        style={{ opacity: 0 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mag-accent)] mb-3">
          Virtual Try-On
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-[var(--mag-text)]">
          Try it on <span className="text-[var(--mag-accent)]">yourself</span>
        </h2>
      </div>

      {/* Slider area */}
      <div className="relative mx-auto max-w-4xl px-6 pb-24">
        {/* Before/After container */}
        <div
          ref={sliderContainerRef}
          className="relative aspect-[3/4] md:aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="slider"
          aria-label="Before and after comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPct * 100)}
        >
          {/* Prerender all pairs so images are cached; only the active pair is visible */}
          {data.pairs.map((pair, i) => (
            <div
              key={pair.id}
              className="absolute inset-0"
              style={{ display: i === activePairIndex ? "block" : "none" }}
            >
              {/* Before image — full coverage, base layer */}
              <div className="absolute inset-0">
                {pair.beforeImageUrl ? (
                  <Image
                    src={pair.beforeImageUrl}
                    alt={`Before: ${pair.itemName}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={i === 0}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                    <span className="text-neutral-600 text-sm">Before</span>
                  </div>
                )}
                {/* Label */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                    Original
                  </span>
                </div>
              </div>

              {/* After image — clipped from the right, revealed by slider */}
              <div
                className="absolute inset-0"
                style={{
                  clipPath:
                    i === activePairIndex
                      ? `inset(0 ${(1 - sliderPct) * 100}% 0 0)`
                      : "inset(0 100% 0 0)",
                }}
              >
                {pair.afterImageUrl ? (
                  <Image
                    src={pair.afterImageUrl}
                    alt={`After: ${pair.itemName} try-on`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={i === 0}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-700 flex items-center justify-center">
                    <span className="text-neutral-500 text-sm">Try-On</span>
                  </div>
                )}
                {/* Label */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--mag-accent)]">
                    Try-On
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Drag handle — vertical line + circle grip */}
          <div
            ref={handleRef}
            className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-[var(--mag-accent)] z-20 pointer-events-none"
            style={{ left: "50%", boxShadow: "0 0 8px 1px var(--mag-accent)" }}
          >
            {/* Grip circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--mag-accent)] flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-[var(--mag-bg)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l-4 3 4 3M16 9l4 3-4 3"
                />
              </svg>
            </div>
          </div>

          {/* CTA activation hint — appears near threshold */}
          {sliderPct > 0.7 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              style={{ opacity: Math.min(1, (sliderPct - 0.7) / 0.15) }}
            >
              <p className="text-xs text-[var(--mag-accent)] tracking-widest animate-pulse">
                Pull further to unlock
              </p>
            </div>
          )}
        </div>

        {/* Item info */}
        {activePair && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">{activePair.itemBrand}</p>
            <p className="text-lg text-[var(--mag-text)]">
              {activePair.itemName}
            </p>
          </div>
        )}

        {/* Pair navigation dots */}
        {data.pairs.length > 1 && (
          <div
            className="flex justify-center gap-2 mt-4"
            role="tablist"
            aria-label="Try-on pairs"
          >
            {data.pairs.map((pair, i) => (
              <button
                key={pair.id}
                role="tab"
                aria-selected={i === activePairIndex}
                aria-label={`Select pair ${i + 1}: ${pair.itemName}`}
                onClick={() => selectPair(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activePairIndex
                    ? "bg-[var(--mag-accent)] w-5"
                    : "bg-neutral-600 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* CTA button */}
        <div className="mt-8 flex justify-center">
          <button
            ref={ctaRef}
            className="px-8 py-3 rounded-full bg-[var(--mag-accent)] text-[var(--mag-bg)] font-semibold text-sm
                       transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mag-accent)]"
            disabled={!ctaActive}
            style={{ opacity: 0.35, transform: "scale(0.96)" }}
            aria-disabled={!ctaActive}
          >
            {data.ctaLabel ?? "나의 스타일 DNA에 입혀보기"}
          </button>
        </div>
      </div>
    </section>
  );
}
