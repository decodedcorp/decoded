"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { DecodeShowcaseData } from "./types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface DecodeShowcaseProps {
  data: DecodeShowcaseData;
  className?: string;
}

/**
 * "The Magic" — AI item detection showcase.
 *
 * Pinned section: scrolling through draws neon bounding boxes one-by-one,
 * with item detail cards appearing beside each detected item.
 */
export default function DecodeShowcase({
  data,
  className,
}: DecodeShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const progressLabelRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { detectedItems } = data;

  useGSAP(
    () => {
      if (!sectionRef.current || !showcaseRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          start: "top top",
          end: `+=${detectedItems.length * 250}`,
        },
      });

      detectedItems.forEach((_, i) => {
        const box = boxRefs.current[i];
        const card = cardRefs.current[i];
        // Each item occupies 1 unit in the timeline (items appear sequentially)
        const offset = i / detectedItems.length;
        const duration = 0.8 / detectedItems.length;

        if (box) {
          tl.fromTo(
            box,
            { opacity: 0, scale: 0.8, borderColor: "transparent" },
            {
              opacity: 1,
              scale: 1,
              borderColor: "var(--mag-accent)",
              ease: "power2.out",
              duration,
            },
            offset
          );
        }

        if (card) {
          tl.fromTo(
            card,
            { opacity: 0, x: 20, scale: 0.9 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              ease: "power2.out",
              duration: duration * 0.8,
            },
            // Card pops up slightly after the box appears
            offset + duration * 0.6
          );
        }

        // Update progress label as each item is detected
        if (progressLabelRef.current) {
          tl.add(
            () => {
              if (progressLabelRef.current) {
                progressLabelRef.current.textContent = `Detecting ${i + 1}/${detectedItems.length}`;
              }
            },
            offset + duration * 0.5
          );
        }

        // Drive progress bar fill
        if (progressFillRef.current) {
          tl.to(
            progressFillRef.current,
            {
              scaleX: (i + 1) / detectedItems.length,
              ease: "none",
              duration,
            },
            offset
          );
        }
      });
    },
    { scope: sectionRef, dependencies: [detectedItems] }
  );

  return (
    <section
      ref={sectionRef}
      className={`relative bg-[var(--mag-bg)] overflow-hidden ${className ?? ""}`}
      aria-label="AI item detection showcase"
    >
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mag-accent)] mb-3">
          The Magic
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-[var(--mag-text)]">
          See how it&apos;s{" "}
          <span className="text-[var(--mag-accent)]">Decoded</span>
        </h2>
        {data.tagline && (
          <p className="mt-3 text-sm text-neutral-400 max-w-md">
            {data.tagline}
          </p>
        )}
      </div>

      {/* Showcase area — pinned while scrolling */}
      <div ref={showcaseRef} className="relative mx-auto max-w-5xl px-6 pb-32">
        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div
            ref={progressLabelRef}
            className="text-xs uppercase tracking-widest text-[var(--mag-accent)] font-mono min-w-[120px]"
          >
            Detecting 0/{detectedItems.length}
          </div>
          {/* Progress bar */}
          <div className="flex-1 h-px bg-neutral-800 overflow-hidden">
            <div
              ref={progressFillRef}
              className="h-full bg-[var(--mag-accent)] origin-left"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>

        {/* Image + bounding boxes */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900">
          {/* Source image */}
          {data.sourceImageUrl ? (
            <Image
              src={data.sourceImageUrl}
              alt={`${data.artistName} outfit decode`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-neutral-700 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
                <p className="text-sm">AI Detection Showcase</p>
                <p className="text-xs mt-1 text-neutral-700">
                  {detectedItems.length} items to detect in {data.artistName}
                  &apos;s look
                </p>
              </div>
            </div>
          )}

          {/* Dark overlay so bounding boxes read clearly */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Bounding box overlays */}
          {detectedItems.map((item, i) => {
            // Determine which side to show the card: prefer right, but flip if near edge
            const cardSide =
              item.bbox.x + item.bbox.width > 65 ? "left" : "right";

            return (
              <div key={item.id}>
                {/* Bounding box */}
                <div
                  ref={(el) => {
                    boxRefs.current[i] = el;
                  }}
                  className="absolute border-2 rounded-lg pointer-events-none"
                  style={{
                    left: `${item.bbox.x}%`,
                    top: `${item.bbox.y}%`,
                    width: `${item.bbox.width}%`,
                    height: `${item.bbox.height}%`,
                    borderColor: "transparent",
                    opacity: 0,
                    // Subtle neon inner glow via box-shadow
                    boxShadow: "0 0 8px 1px var(--mag-accent)",
                  }}
                  aria-label={`Detection box: ${item.label}`}
                />

                {/* Item detail card */}
                <div
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className={`absolute z-20 flex items-center gap-2 rounded-xl
                              bg-black/80 backdrop-blur-sm border border-[var(--mag-accent)]/30
                              px-3 py-2 pointer-events-none max-w-[180px]`}
                  style={{
                    top: `${item.bbox.y}%`,
                    ...(cardSide === "right"
                      ? { left: `${item.bbox.x + item.bbox.width + 1}%` }
                      : { right: `${100 - item.bbox.x + 1}%` }),
                    opacity: 0,
                  }}
                >
                  {/* Item thumbnail */}
                  {item.imageUrl ? (
                    <div className="relative flex-none w-10 h-10 rounded-lg overflow-hidden bg-neutral-800">
                      <Image
                        src={item.imageUrl}
                        alt={item.label}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex-none w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-500">IMG</span>
                    </div>
                  )}
                  {/* Label + brand */}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--mag-text)] leading-tight truncate">
                      {item.label}
                    </p>
                    {item.brand && (
                      <p className="text-[10px] text-[var(--mag-accent)] leading-tight truncate">
                        {item.brand}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Artist credit */}
        <p className="mt-4 text-xs text-neutral-500 tracking-wider text-right">
          {data.artistName}
        </p>
      </div>
    </section>
  );
}
