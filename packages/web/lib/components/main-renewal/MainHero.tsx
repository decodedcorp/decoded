"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

import type { MainHeroData, HeroSpotAnnotation } from "./types";

interface MainHeroProps {
  data: MainHeroData;
  className?: string;
}

/**
 * SpotCard — floating annotation card with connector line to a dot on the hero image.
 * Positioned absolutely within the hero's center frame.
 */
function SpotCard({
  spot,
  index,
  quickEntry,
}: {
  spot: HeroSpotAnnotation;
  index: number;
  quickEntry?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, x: spot.side === "left" ? -30 : 30 },
      {
        opacity: 1,
        x: 0,
        duration: quickEntry ? 0.5 : 0.8,
        delay: quickEntry ? 0.1 + index * 0.1 : 1.6 + index * 0.2,
        ease: "power3.out",
      }
    );
  }, [spot.side, index, quickEntry]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
    >
      {/* Glowing dot */}
      <div className="relative w-3 h-3 -ml-1.5 -mt-1.5">
        <div className="absolute inset-0 rounded-full bg-[#eafd67] shadow-[0_0_12px_4px_rgba(234,253,103,0.6)]" />
        <div className="absolute -inset-2 rounded-full bg-[#eafd67]/20 animate-ping" />
      </div>

      {/* Connector line + Card */}
      <div
        ref={cardRef}
        className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0 opacity-0 ${
          spot.side === "left"
            ? "right-full mr-3 flex-row-reverse"
            : "left-full ml-3"
        }`}
      >
        {/* Connector line */}
        <svg
          className="shrink-0"
          width="40"
          height="2"
          viewBox="0 0 40 2"
          fill="none"
        >
          <line
            x1="0"
            y1="1"
            x2="40"
            y2="1"
            stroke="#eafd67"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </svg>

        {/* Card with optional item image */}
        <div className="shrink-0 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-lg overflow-hidden min-w-[160px] flex items-stretch">
          {/* Item image thumbnail */}
          {spot.imageUrl && (
            <div className="relative w-16 h-auto shrink-0 bg-white/[0.04]">
              <Image
                src={`/api/v1/image-proxy?url=${encodeURIComponent(spot.imageUrl)}`}
                alt={spot.label}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}
          <div className="px-3 py-2.5">
            {spot.brand && (
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#eafd67]/70 mb-0.5">
                {spot.brand}
              </p>
            )}
            <p className="text-xs text-white/80 font-medium leading-tight line-clamp-1">
              {spot.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MainHero — "DECODED" centered hero with person cutout overlay,
 * neon glow silhouette, and floating spot annotation cards.
 *
 * Layout layers (bottom to top):
 * 1. Pure black background
 * 2. Neon radial glow (behind person)
 * 3. "DECODED" massive centered text
 * 4. Person image (centered, object-contain)
 * 5. Floating spot annotation cards
 */
export function MainHero({ data, className = "" }: MainHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const personRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);

  // GSAP cinematic entry — use rAF to ensure DOM is ready after Strict Mode remount
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Force initial states
      gsap.set(textRef.current, { opacity: 0, scale: 0.85 });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.7 });
      gsap.set(personRef.current, { opacity: 0, y: 60 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(textRef.current, { opacity: 1, scale: 1, duration: 1.4 }, 0);
      tl.to(glowRef.current, { opacity: 1, scale: 1, duration: 1.8 }, 0.1);
      tl.to(personRef.current, { opacity: 1, y: 0, duration: 1.2 }, 0.3);
      tl.call(() => {
        hasEnteredRef.current = true;
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      gsap.killTweensOf([textRef.current, glowRef.current, personRef.current]);
    };
  }, []);

  // Crossfade person image + spots on data change (not initial mount)
  const prevHeroUrl = useRef(data.heroImageUrl);
  useEffect(() => {
    if (prevHeroUrl.current === data.heroImageUrl) return;
    prevHeroUrl.current = data.heroImageUrl;
    // Quick fade out/in for person image
    if (personRef.current) {
      gsap.fromTo(
        personRef.current,
        { opacity: 0.3 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [data.heroImageUrl]);

  // Mouse parallax for person image
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !personRef.current || !textRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(personRef.current, {
      x: cx * 20,
      y: cy * 15,
      duration: 0.6,
      ease: "power2.out",
    });
    gsap.to(textRef.current, {
      x: cx * -10,
      y: cy * -8,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    gsap.to([personRef.current, textRef.current], {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover) return;
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <section
      ref={containerRef}
      className={`relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-[#050505] ${className}`}
    >
      {/* Layer 1: Neon radial glow behind person */}
      <div
        ref={glowRef}
        className="absolute inset-0 z-[1] opacity-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      >
        {/* Primary center glow */}
        <div
          className="absolute inset-0 animate-neon-drift"
          style={{
            background:
              "radial-gradient(ellipse 45% 55% at 50% 48%, rgba(234,253,103,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Tighter glow for silhouette feel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 25% 45% at 50% 50%, rgba(234,253,103,0.12) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Layer 2: "DECODED" massive text — in front of person */}
      <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none">
        <h1
          ref={textRef}
          className="opacity-0 select-none text-[22vw] md:text-[18vw] lg:text-[15vw] font-serif font-bold text-white leading-[0.85] tracking-[-0.04em] will-change-transform"
          style={{ fontStyle: "italic" }}
        >
          DECODED
        </h1>
      </div>

      {/* Layer 3: Person image — behind the DECODED text */}
      <div
        ref={personRef}
        className="absolute inset-0 z-[2] flex items-end justify-center opacity-0 will-change-transform"
      >
        <div className="relative w-[55vw] md:w-[38vw] lg:w-[30vw] max-w-[520px] h-[60vh] md:h-[75vh]">
          <Image
            src={data.heroImageUrl}
            alt={data.celebrityName}
            fill
            priority
            sizes="(max-width: 768px) 55vw, (max-width: 1024px) 38vw, 30vw"
            className="object-contain object-bottom"
            style={{
              filter:
                "drop-shadow(0 0 60px rgba(234,253,103,0.35)) drop-shadow(0 0 120px rgba(234,253,103,0.15))",
            }}
          />
        </div>
      </div>

      {/* Layer 4: Floating spot annotations — behind DECODED text */}
      {data.spots && data.spots.length > 0 && (
        <div
          key={data.heroImageUrl}
          className="absolute inset-0 z-[3] pointer-events-none hidden md:block"
        >
          {/* Spots are positioned relative to center frame */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] max-w-[550px] h-[85vh]">
            {data.spots.map((spot, i) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                index={i}
                quickEntry={hasEnteredRef.current}
              />
            ))}
          </div>
        </div>
      )}

      {/* Layer 5: Gradient overlays for depth */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050505]/80 via-[#050505]/40 to-transparent" />
      </div>

      {/* Noise grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[6] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </section>
  );
}
