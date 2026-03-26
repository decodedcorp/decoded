"use client";

import { useEffect, useRef, useCallback } from "react";
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
 * Features:
 * - Deterministic scatter positioning (SSR-safe)
 * - GSAP Draggable on each card
 * - Click-to-focus with backdrop dim (backdrop-filter for performance)
 * - Mouse parallax panning for depth
 * - Keyboard accessible (Tab/Enter/Escape)
 */
export function MainHero({ images, className = "" }: MainHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const { focusedId, toggleFocus, clearFocus, isFocused, isDimmed } =
    useHeroFocus();

  // Glow entry animation
  useEffect(() => {
    if (!glowRef.current) return;
    const el = glowRef.current;
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 1.8, ease: "power3.out" },
    );
    return () => { gsap.killTweensOf(el); };
  }, []);

  // Mouse parallax panning — subtle depth effect
  useEffect(() => {
    const section = sectionRef.current;
    const container = cardsContainerRef.current;
    if (!section || !container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (focusedId) return; // Disable panning when focused
      const rect = section.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(container, {
        x: xRatio * -12,
        y: yRatio * -8,
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    section.addEventListener("mousemove", handleMouseMove);
    return () => section.removeEventListener("mousemove", handleMouseMove);
  }, [focusedId]);

  // Keyboard: Escape to clear focus
  useEffect(() => {
    if (!focusedId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearFocus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedId, clearFocus]);

  // Compute scatter positions during render (deterministic, SSR-safe)
  const positions = images.map((img, i) => computeScatterPosition(img.id, i));

  const handleToggleFocus = useCallback(
    (id: string) => { toggleFocus(id); },
    [toggleFocus],
  );

  return (
    <section
      ref={sectionRef}
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

      {/* Backdrop dim — single backdrop-filter instead of per-card blur */}
      {focusedId !== null && (
        <div
          className="absolute inset-0 z-[35] cursor-pointer transition-opacity duration-400"
          style={{
            backgroundColor: "rgba(5,5,5,0.7)",
            backdropFilter: "blur(3px)",
          }}
          onClick={clearFocus}
        />
      )}

      {/* Scattered draggable images */}
      <div ref={cardsContainerRef} className="absolute inset-0 z-[2]">
        {images.map((img, i) => (
          <HeroCard
            key={img.id}
            image={img}
            position={positions[i]}
            index={i}
            isFocused={isFocused(img.id)}
            isDimmed={isDimmed(img.id)}
            onToggleFocus={handleToggleFocus}
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
