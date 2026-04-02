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

export default function DecodeShowcase({
  data,
  className,
}: DecodeShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const progressLabelRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);

  const { detectedItems } = data;

  // Pre-compute side + card y-positions
  const itemMeta = detectedItems.map((item, i) => {
    const isLeft = item.bbox.x <= 50;
    return { item, i, isLeft };
  });
  const leftGroup = itemMeta.filter((m) => m.isLeft);
  const rightGroup = itemMeta.filter((m) => !m.isLeft);

  const getCardY = (meta: (typeof itemMeta)[number]) => {
    const group = meta.isLeft ? leftGroup : rightGroup;
    const idx = group.findIndex((g) => g.i === meta.i);
    if (group.length === 1) return 50;
    return 20 + (idx * 60) / (group.length - 1);
  };

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
        const dot = dotRefs.current[i];
        const card = cardRefs.current[i];
        const line = lineRefs.current[i];
        const offset = i / detectedItems.length;
        const dur = 0.8 / detectedItems.length;

        if (dot) {
          tl.fromTo(
            dot,
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, ease: "back.out(2)", duration: dur },
            offset
          );
        }
        if (line) {
          tl.fromTo(
            line,
            { opacity: 0, attr: { "stroke-dashoffset": 300 } },
            {
              opacity: 0.5,
              attr: { "stroke-dashoffset": 0 },
              ease: "power2.out",
              duration: dur * 0.6,
            },
            offset + dur * 0.3
          );
        }
        if (card) {
          tl.fromTo(
            card,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, ease: "power2.out", duration: dur * 0.6 },
            offset + dur * 0.5
          );
        }
        if (progressLabelRef.current) {
          tl.add(
            () => {
              if (progressLabelRef.current)
                progressLabelRef.current.textContent = `Detecting ${i + 1}/${detectedItems.length}`;
            },
            offset + dur * 0.5
          );
        }
        if (progressFillRef.current) {
          tl.to(
            progressFillRef.current,
            {
              scaleX: (i + 1) / detectedItems.length,
              ease: "none",
              duration: dur,
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
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--mag-accent)] mb-2">
          The Magic
        </p>
        <h2 className="text-2xl md:text-4xl font-bold text-[var(--mag-text)]">
          See how it&apos;s{" "}
          <span className="text-[var(--mag-accent)]">Decoded</span>
        </h2>
        {data.tagline && (
          <p className="mt-2 text-sm text-neutral-400 mx-auto max-w-md">
            {data.tagline}
          </p>
        )}
      </div>

      <div ref={showcaseRef} className="relative mx-auto max-w-5xl px-4 pb-16">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-4 max-w-sm mx-auto">
          <div
            ref={progressLabelRef}
            className="text-xs uppercase tracking-widest text-[var(--mag-accent)] font-mono min-w-[110px]"
          >
            Detecting 0/{detectedItems.length}
          </div>
          <div className="flex-1 h-px bg-neutral-800 overflow-hidden">
            <div
              ref={progressFillRef}
              className="h-full bg-[var(--mag-accent)] origin-left"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>

        {/*
          Single positioning context with overflow visible.
          Image is the size reference. Dots, lines, and cards all share
          the same coordinate space (% of image dimensions).
          Cards are pushed outside via calc(100% + gap).
        */}
        <div
          className="relative mx-auto"
          style={{ width: "min(45vw, 360px)", overflow: "visible" }}
        >
          {/* Image — clipped */}
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900">
            {data.sourceImageUrl ? (
              <Image
                src={data.sourceImageUrl}
                alt={`${data.artistName} outfit decode`}
                fill
                className="object-contain object-center"
                sizes="360px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                <p className="text-sm">AI Detection Showcase</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          </div>

          {/* Dots */}
          {detectedItems.map((item, i) => (
            <div
              key={`dot-${item.id}`}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{
                left: `${item.bbox.x}%`,
                top: `${item.bbox.y}%`,
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid var(--mag-accent)",
                boxShadow:
                  "0 0 10px 2px var(--mag-accent), inset 0 0 4px var(--mag-accent)",
                opacity: 0,
              }}
            />
          ))}

          {/* SVG lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
            style={{ overflow: "visible" }}
            aria-hidden
          >
            {itemMeta.map((meta) => {
              const { item, i, isLeft } = meta;
              const cardY = getCardY(meta);
              return (
                <line
                  key={`line-${item.id}`}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  x1={`${item.bbox.x}%`}
                  y1={`${item.bbox.y}%`}
                  x2={isLeft ? "-60%" : "160%"}
                  y2={`${cardY}%`}
                  stroke="var(--mag-accent)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0"
                />
              );
            })}
          </svg>

          {/* Cards — positioned outside image */}
          {itemMeta.map((meta) => {
            const { item, i, isLeft } = meta;
            const cardY = getCardY(meta);
            return (
              <div
                key={`card-${item.id}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute z-20 flex items-center gap-3 rounded-xl
                           bg-black/80 backdrop-blur-sm border border-[var(--mag-accent)]/30
                           px-4 py-3 w-[200px] pointer-events-none"
                style={{
                  top: `${cardY}%`,
                  transform: "translateY(-50%)",
                  ...(isLeft
                    ? { right: "calc(100% + 24px)" }
                    : { left: "calc(100% + 24px)" }),
                  opacity: 0,
                }}
              >
                {item.imageUrl ? (
                  <div className="relative flex-none w-14 h-14 rounded-lg overflow-hidden bg-neutral-800">
                    <Image
                      src={item.imageUrl}
                      alt={item.label}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="flex-none w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-500">IMG</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--mag-text)] leading-tight truncate">
                    {item.label}
                  </p>
                  {item.brand && (
                    <p className="text-[11px] text-[var(--mag-accent)] leading-tight truncate mt-0.5">
                      {item.brand}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-neutral-500 tracking-wider text-center">
          {data.artistName}
        </p>
      </div>
    </section>
  );
}
