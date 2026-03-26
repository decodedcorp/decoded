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

  // Card goes to the side that has more space from the edge
  const isLeft = spot.side === "left";

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

  useEffect(() => {
    // Delay to ensure layout is complete
    const raf = requestAnimationFrame(() => {
      updateLine();
    });
    window.addEventListener("resize", updateLine);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateLine);
    };
  }, [updateLine]);

  // Card positioning: push it outside the image boundary
  // For left-side spots (x < 50): card goes left, positioned via right
  // For right-side spots (x >= 50): card goes right, positioned via left
  const cardStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    ...(isLeft
      ? { right: "100%", marginRight: "12px" }
      : { left: "100%", marginLeft: "12px" }),
  };

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
          borderTop: "1.5px solid rgba(234,253,103,0.6)",
          transformOrigin: "0 0",
          filter: "drop-shadow(0 0 3px rgba(234,253,103,0.3))",
        }}
      />

      {/* Spot dot */}
      <div ref={dotRef} className="relative">
        <div className="w-3.5 h-3.5 rounded-full bg-[#eafd67] border-2 border-white/80 shadow-[0_0_8px_rgba(234,253,103,0.6)] cursor-pointer" />
        <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-[#eafd67] animate-ping opacity-30" />
      </div>

      {/* Item card — positioned relative to dot, pushed outside image */}
      <div
        ref={cardRef}
        className="pointer-events-auto whitespace-nowrap"
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="flex items-center gap-2 bg-black/85 backdrop-blur-md rounded-xl px-2.5 py-2 shadow-xl border transition-all duration-200"
          style={{
            borderColor: hovered
              ? "rgba(234,253,103,0.5)"
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
              <p className="text-[10px] text-[#eafd67] mt-0.5 font-medium">
                {spot.price}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
