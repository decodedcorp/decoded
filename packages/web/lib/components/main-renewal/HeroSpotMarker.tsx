"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { HeroSpotAnnotation } from "./types";

interface HeroSpotMarkerProps {
  spot: HeroSpotAnnotation;
}

export function HeroSpotMarker({ spot }: HeroSpotMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [flippedSide, setFlippedSide] = useState<"left" | "right" | null>(null);

  const effectiveSide = flippedSide ?? spot.side;
  const isLeft = effectiveSide === "left";

  const updateLine = useCallback(() => {
    const dot = dotRef.current;
    const card = cardRef.current;
    const container = containerRef.current;
    const lineEl = lineRef.current;
    if (!dot || !card || !container || !lineEl) return;

    const cRect = container.getBoundingClientRect();
    const dRect = dot.getBoundingClientRect();
    const kRect = card.getBoundingClientRect();

    const dx = dRect.left + dRect.width / 2 - cRect.left;
    const dy = dRect.top + dRect.height / 2 - cRect.top;
    const kx = isLeft ? kRect.right - cRect.left : kRect.left - cRect.left;
    const ky = kRect.top + kRect.height / 2 - cRect.top;

    const length = Math.sqrt((kx - dx) ** 2 + (ky - dy) ** 2);
    const angle = Math.atan2(ky - dy, kx - dx) * (180 / Math.PI);

    lineEl.style.left = `${dx}px`;
    lineEl.style.top = `${dy}px`;
    lineEl.style.width = `${length}px`;
    lineEl.style.transform = `rotate(${angle}deg)`;
    lineEl.style.opacity = "1";
  }, [isLeft]);

  // Smart positioning: flip side if card goes off-screen
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const raf = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      if (rect.left < 0 && spot.side === "left") {
        setFlippedSide("right");
      } else if (rect.right > window.innerWidth && spot.side === "right") {
        setFlippedSide("left");
      } else {
        setFlippedSide(null);
      }
      updateLine();
    });

    window.addEventListener("resize", updateLine);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateLine);
    };
  }, [updateLine, spot.side]);

  return (
    <div
      ref={containerRef}
      className="absolute z-10"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Connector line */}
      <div
        ref={lineRef}
        className="absolute pointer-events-none opacity-0"
        style={{
          height: 0,
          borderTop: "1.5px solid rgba(234,253,103,0.6)", /* matches --mag-accent */
          transformOrigin: "0 0",
          filter: "drop-shadow(0 0 3px rgba(234,253,103,0.3))", /* matches --mag-accent; CSS var unreliable in filter */
        }}
      />

      {/* Spot dot */}
      <div ref={dotRef} className="relative">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow-[0_0_8px_rgba(234,253,103,0.6)] cursor-pointer" style={{ backgroundColor: "var(--mag-accent)" }} />
        <div className="absolute inset-0 w-3.5 h-3.5 rounded-full animate-ping opacity-30" style={{ backgroundColor: "var(--mag-accent)" }} />
      </div>

      {/* Item card — smart positioned, flips if off-screen */}
      <div
        ref={cardRef}
        className="absolute top-1/2 -translate-y-1/2 pointer-events-auto whitespace-nowrap"
        style={{
          [isLeft ? "right" : "left"]: "100%",
          [isLeft ? "marginRight" : "marginLeft"]: "12px",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="flex items-center gap-2 bg-black/85 backdrop-blur-md rounded-xl px-2.5 py-2 shadow-xl border transition-all duration-200"
          style={{
            borderColor: hovered
              ? "var(--mag-accent)"
              : "rgba(255,255,255,0.1)",
          }}
        >
          {spot.imageUrl && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={spot.imageUrl}
                alt={spot.label}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white leading-tight truncate max-w-[120px]">
              {spot.label}
            </p>
            {spot.brand && (
              <p className="text-[9px] text-white/50 mt-0.5 truncate">
                {spot.brand}
              </p>
            )}
            {spot.price && (
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: "var(--mag-accent)" }}>
                {spot.price}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
