"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import type { ScatterPosition } from "./types";

gsap.registerPlugin(Draggable);

interface PolaroidCardProps {
  imageUrl: string;
  alt: string;
  position: ScatterPosition;
  priority?: boolean;
}

/**
 * Draggable Polaroid card with white frame.
 * - White border + thick bottom (Instax feel)
 * - GSAP Draggable for free movement
 * - Brings to front when grabbed
 * - Hover lift + slight scale
 * - Peel-back effect on hover via clip-path
 */
export function PolaroidCard({
  imageUrl,
  alt,
  position,
  priority = false,
}: PolaroidCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHero = position.tier === "hero";
  const isSmall = position.tier === "small";

  // Draggable.create() runs inside useGSAP so all gsap calls within its
  // callbacks are inside the GSAP context and are auto-cleaned on unmount.
  useGSAP(
    () => {
      const el = cardRef.current;
      if (!el) return;

      Draggable.create(el, {
        type: "x,y",
        inertia: false,
        allowEventDefault: false,
        onPress() {
          gsap.set(el, { zIndex: 50 });
        },
        onDrag(this: Draggable) {
          const rot = gsap.utils.clamp(-25, 25, this.deltaX * 0.4);
          gsap.to(el, { rotation: rot, duration: 0.1, ease: "power1.out" });
        },
        onDragEnd() {
          gsap.to(el, {
            rotation: 0,
            duration: 0.5,
            ease: "elastic.out(1,0.5)",
          });
        },
        onRelease() {
          gsap.to(el, { zIndex: position.zIndex, delay: 0.3 });
        },
      });
    },
    { scope: cardRef, dependencies: [position.zIndex] }
  );

  const framePad = isHero
    ? "6px 6px 28px 6px"
    : isSmall
      ? "3px 3px 16px 3px"
      : "4px 4px 22px 4px";

  const shadow = isHero
    ? "0 8px 35px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"
    : isSmall
      ? "0 3px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.35)"
      : "0 5px 22px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)";

  return (
    <div
      ref={cardRef}
      className="absolute cursor-grab active:cursor-grabbing transform-gpu touch-none"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: position.zIndex,
        transform: `rotate(${position.rotate}deg)`,
        filter: isSmall ? "brightness(0.9) saturate(0.8)" : undefined,
      }}
    >
      {/* Neon outline for hero cards */}
      {isHero && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: "-5px",
            border: "3px solid #eafd67",
            borderRadius: "1px",
            transform: "rotate(0.8deg)",
            opacity: 0.6,
          }}
        />
      )}

      {/* White polaroid frame */}
      <div style={{ background: "#fff", padding: framePad, boxShadow: shadow }}>
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: position.aspectRatio }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes={
              isHero
                ? "(max-width: 768px) 55vw, 20vw"
                : isSmall
                  ? "(max-width: 768px) 25vw, 8vw"
                  : "(max-width: 768px) 35vw, 12vw"
            }
            className="object-cover pointer-events-none select-none"
            draggable={false}
            priority={priority}
          />
        </div>
      </div>

      {/* Tape on small cards */}
      {isSmall && (
        <div
          className="absolute -top-1.5 left-1/2 pointer-events-none"
          style={{
            width: "clamp(18px, 2.5vw, 30px)",
            height: "clamp(7px, 1vw, 12px)",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(2px)",
            transform: `translateX(-50%) rotate(${position.rotate > 0 ? -4 : 4}deg)`,
          }}
        />
      )}
    </div>
  );
}
