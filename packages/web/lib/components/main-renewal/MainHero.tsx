"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import type { FloatingHeroImage } from "./types";
import { computeScatterPosition } from "./scatter";
import { useHeroFocus } from "./useHeroFocus";
import { HeroCard } from "./HeroCard";

interface MainHeroProps {
  images: FloatingHeroImage[];
  className?: string;
}

/**
 * MainHero — Scattered sticker-bomb collage with draggable images.
 *
 * - Images are scattered via deterministic PRNG (SSR-safe)
 * - Each image is draggable (GSAP Draggable)
 * - Click an image → others dim, selected + spots highlighted
 * - Click backdrop or same image → deselect
 */
export function MainHero({ images, className = "" }: MainHeroProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const { focusedId, toggleFocus, clearFocus, isFocused, isDimmed } =
    useHeroFocus();

  useEffect(() => {
    if (!glowRef.current) return;
    gsap.fromTo(
      glowRef.current,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 1.8, ease: "power3.out" },
    );
    return () => {
      if (glowRef.current) gsap.killTweensOf(glowRef.current);
    };
  }, []);

  // Compute scatter positions during render (deterministic, SSR-safe)
  const positions = images.map((img, i) => computeScatterPosition(img.id, i));

  return (
    <section
      className={`relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-[#050505] ${className}`}
    >
      {/* Neon radial glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 z-[1] opacity-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      >
        <div
          className="absolute inset-0 animate-neon-drift"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 45%, rgba(234,253,103,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 30% 40% at 45% 50%, rgba(234,253,103,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Backdrop overlay — dims everything when a card is focused */}
      {focusedId !== null && (
        <div
          className="absolute inset-0 z-[35] cursor-pointer"
          onClick={clearFocus}
        />
      )}

      {/* Scattered draggable images */}
      <div className="absolute inset-0 z-[2]">
        {images.map((img, i) => (
          <HeroCard
            key={img.id}
            image={img}
            position={positions[i]}
            index={i}
            isFocused={isFocused(img.id)}
            isDimmed={isDimmed(img.id)}
            onToggleFocus={toggleFocus}
            priority={i < 4}
          />
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[45] pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050505]/80 via-[#050505]/40 to-transparent" />
      </div>

      {/* Noise grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[46] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </section>
  );
}
