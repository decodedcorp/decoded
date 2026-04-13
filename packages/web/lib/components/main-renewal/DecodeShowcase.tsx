"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { DecodeShowcaseData } from "./types";
import { PostImage } from "@/lib/components/shared/PostImage";
import { ItemImage } from "@/lib/components/shared/ItemImage";
import Link from "next/link";
import { AISummarySection } from "@/lib/components/detail/AISummarySection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Header height matching `ConditionalNav` main: `pt-14 md:pt-[72px]` */
function headerHeightPx(): number {
  if (typeof window === "undefined") return 56;
  return window.matchMedia("(min-width: 768px)").matches ? 72 : 56;
}

export type DecodeShowcaseArtist = {
  displayName: string;
  profileImageUrl: string | null;
};

interface DecodeShowcaseProps {
  data: DecodeShowcaseData;
  className?: string;
  /** Profile row below the decode image; revealed on scroll (same ScrollTrigger timeline) */
  artist?: DecodeShowcaseArtist | null;
  /** Shown under artist when present; same scrub timeline */
  aiSummary?: string | null;
  isModal?: boolean;
  /** Scroll to matching `ItemDetailCard` (`data-item-id`) below the showcase */
  onItemNavigate?: (itemId: string) => void;
}

export default function DecodeShowcase({
  data,
  className,
  artist = null,
  aiSummary = null,
  isModal = false,
  onItemNavigate,
}: DecodeShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const artistRevealRef = useRef<HTMLDivElement>(null);
  const summaryRevealRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const mobileCardRefs = useRef<(HTMLElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const mobileLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const { detectedItems } = data;
  const canNavigate = typeof onItemNavigate === "function";

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

      const section = sectionRef.current;
      const rootStyles = getComputedStyle(document.documentElement);
      const fromBg =
        rootStyles.getPropertyValue("--background").trim() || "#fafafa";
      const toBg =
        rootStyles.getPropertyValue("--mag-bg").trim() || "#050505";

      gsap.set(section, { backgroundColor: fromBg });

      const isMobile = window.innerWidth < 768;
      const pinDistance = isMobile
        ? detectedItems.length * 120
        : detectedItems.length * 250;

      const hh = headerHeightPx();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: `top ${hh}px`,
          end: `+=${pinDistance}`,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        section,
        { backgroundColor: fromBg },
        {
          backgroundColor: toBg,
          duration: 1,
          ease: "power1.inOut",
        },
        0
      );

      

      detectedItems.forEach((_, i) => {
        const dot = dotRefs.current[i];
        const card = cardRefs.current[i];
        const mobileCard = mobileCardRefs.current[i];
        const line = lineRefs.current[i];
        const mobileLine = mobileLineRefs.current[i];
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
        // Desktop line
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
        // Mobile line
        if (mobileLine) {
          tl.fromTo(
            mobileLine,
            { opacity: 0, attr: { "stroke-dashoffset": 100 } },
            {
              opacity: 0.5,
              attr: { "stroke-dashoffset": 0 },
              ease: "power2.out",
              duration: dur * 0.6,
            },
            offset + dur * 0.3
          );
        }
        // Desktop card
        if (card) {
          tl.fromTo(
            card,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, ease: "power2.out", duration: dur * 0.6 },
            offset + dur * 0.5
          );
        }
        // Mobile card (image thumbnail)
        if (mobileCard) {
          tl.fromTo(
            mobileCard,
            { opacity: 0, scale: 0.8 },
            {
              opacity: 1,
              scale: 1,
              ease: "back.out(1.5)",
              duration: dur * 0.6,
            },
            offset + dur * 0.5
          );
        }
      });

      const n = detectedItems.length;
      const phaseStart = n <= 1 ? 0.7 : Math.min(0.82, 0.52 + n * 0.08);

      const artistEl = artistRevealRef.current;
      let summaryBaseStart = phaseStart;
      if (artistEl) {
        gsap.set(artistEl, { opacity: 0, y: 28 });
        tl.fromTo(
          artistEl,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.26,
          },
          phaseStart
        );
        summaryBaseStart = phaseStart + 0.22;
      }

      const summaryTrimmed = aiSummary?.trim();
      const summaryEl = summaryRevealRef.current;
      if (summaryEl && summaryTrimmed) {
        gsap.set(summaryEl, { opacity: 0, y: 22 });
        tl.fromTo(
          summaryEl,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.24,
          },
          summaryBaseStart
        );
      }

    },
    {
      scope: sectionRef,
      dependencies: [detectedItems, artist?.displayName, aiSummary],
    }
  );

  useEffect(() => {
    const hintEl = scrollHintRef.current;
    if (!hintEl) return;

    let visible = true;
    const syncHint = () => {
      const atTop = window.scrollY <= 10;
      if (atTop && !visible) {
        gsap.to(hintEl, { opacity: 1, duration: 0.4, overwrite: true });
        visible = true;
      } else if (!atTop && visible) {
        gsap.to(hintEl, { opacity: 0, duration: 0.4, overwrite: true });
        visible = false;
      }
    };
    window.addEventListener("scroll", syncHint, { passive: true });
    return () => window.removeEventListener("scroll", syncHint);
  }, [portalTarget]);

  return (
    <>
    <section
      ref={sectionRef}
      className={`relative min-h-[100dvh] flex flex-col overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: "var(--background)" }}
      aria-label="AI item detection showcase"
    >
      <div ref={showcaseRef} className="relative mx-auto max-w-5xl flex-1 px-4 pb-24 pt-12 md:pb-28 md:pt-16">
        {/*
          Positioning context.
          Desktop: overflow-visible for cards outside image.
          Mobile: overflow-visible too — thumbnails sit at edges within image bounds.
        */}
        <div
          className="relative mx-auto overflow-visible"
          style={{ width: "min(80vw, 360px)" }}
        >
          {/* Image */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900">
            {data.sourceImageUrl ? (
              <PostImage
                src={data.sourceImageUrl}
                alt={`${data.artistName} outfit decode`}
                imageWidth={data.imageWidth}
                imageHeight={data.imageHeight}
                priority={true}
                flagKey="FeedCard"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-neutral-600">
                <p className="text-sm">AI Detection Showcase</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 pointer-events-none z-20" />
          </div>

          {/* Dots — optional tap target to scroll to item detail */}
          {detectedItems.map((item, i) =>
            canNavigate ? (
              <button
                key={`dot-${item.id}`}
                type="button"
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                onClick={() => onItemNavigate(item.id)}
                className="absolute z-30 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 bg-transparent p-0 opacity-0"
                style={{
                  left: `${item.bbox.x}%`,
                  top: `${item.bbox.y}%`,
                }}
                aria-label={`${item.label} — view details`}
              >
                <span
                  className="block h-3 w-3 shrink-0 rounded-full border-2 border-[var(--mag-accent)] shadow-[0_0_10px_2px_var(--mag-accent),inset_0_0_4px_var(--mag-accent)]"
                  aria-hidden
                />
              </button>
            ) : (
              <div
                key={`dot-${item.id}`}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
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
            )
          )}

          {/* SVG lines — desktop (long, outside image) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[15] hidden md:block"
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

          {/* SVG lines — mobile (short, to edge of image) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[15] md:hidden"
            aria-hidden
          >
            {itemMeta.map((meta) => {
              const { item, i, isLeft } = meta;
              const cardY = getCardY(meta);
              return (
                <line
                  key={`mline-${item.id}`}
                  ref={(el) => {
                    mobileLineRefs.current[i] = el;
                  }}
                  x1={`${item.bbox.x}%`}
                  y1={`${item.bbox.y}%`}
                  x2={isLeft ? "8%" : "92%"}
                  y2={`${cardY}%`}
                  stroke="var(--mag-accent)"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                  opacity="0"
                />
              );
            })}
          </svg>

          {/* Mobile cards — image thumbnail only, at image edge */}
          {itemMeta.map((meta) => {
            const { item, i, isLeft } = meta;
            const cardY = getCardY(meta);
            const CardInner = (
              <>
                {item.imageUrl ? (
                  <div className="h-14 w-14 rounded-lg border border-[var(--mag-accent)]/40 shadow-[0_0_8px_rgba(var(--mag-accent-rgb,200,170,100),0.3)]">
                    <ItemImage
                      src={item.imageUrl}
                      alt=""
                      size="thumbnail"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--mag-accent)]/40 bg-neutral-800">
                    <span className="text-[8px] text-neutral-500">IMG</span>
                  </div>
                )}
              </>
            );
            return canNavigate ? (
              <button
                key={`mcard-${item.id}`}
                type="button"
                ref={(el) => {
                  mobileCardRefs.current[i] = el;
                }}
                onClick={() => onItemNavigate(item.id)}
                className="absolute z-20 flex opacity-0 md:hidden touch-manipulation rounded-xl border-0 bg-transparent p-0"
                style={{
                  top: `${cardY}%`,
                  transform: "translateY(-50%)",
                  ...(isLeft ? { left: "-4px" } : { right: "-4px" }),
                }}
                aria-label={`${item.label} — view details`}
              >
                {CardInner}
              </button>
            ) : (
              <div
                key={`mcard-${item.id}`}
                ref={(el) => {
                  mobileCardRefs.current[i] = el;
                }}
                className="pointer-events-none absolute z-20 md:hidden"
                style={{
                  top: `${cardY}%`,
                  transform: "translateY(-50%)",
                  ...(isLeft ? { left: "-4px" } : { right: "-4px" }),
                  opacity: 0,
                }}
              >
                {item.imageUrl ? (
                  <div className="w-14 h-14 rounded-lg border border-[var(--mag-accent)]/40 shadow-[0_0_8px_rgba(var(--mag-accent-rgb,200,170,100),0.3)]">
                    <ItemImage
                      src={item.imageUrl}
                      alt={item.label}
                      size="thumbnail"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--mag-accent)]/40 bg-neutral-800">
                    <span className="text-[8px] text-neutral-500">IMG</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Desktop cards — full card outside image */}
          {itemMeta.map((meta) => {
            const { item, i, isLeft } = meta;
            const cardY = getCardY(meta);
            const cardStyle = {
              top: `${cardY}%`,
              transform: "translateY(-50%)",
              ...(isLeft
                ? { right: "calc(100% + 24px)" }
                : { left: "calc(100% + 24px)" }),
              opacity: 0,
            } as const;
            const cardBody = (
              <>
                {item.imageUrl ? (
                  <div className="h-14 w-14 flex-none rounded-lg">
                    <ItemImage
                      src={item.imageUrl}
                      alt=""
                      size="thumbnail"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-neutral-800">
                    <span className="text-[10px] text-neutral-500">IMG</span>
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-semibold leading-tight text-[var(--mag-text)]">
                    {item.label}
                  </p>
                  {item.brand && (
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--mag-accent)]">
                      {item.brand}
                    </p>
                  )}
                </div>
              </>
            );
            return canNavigate ? (
              <button
                key={`card-${item.id}`}
                type="button"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => onItemNavigate(item.id)}
                className="absolute z-20 hidden w-[200px] cursor-pointer touch-manipulation items-center gap-3 rounded-xl border border-[var(--mag-accent)]/30 bg-black/80 px-4 py-3 text-left backdrop-blur-sm md:flex"
                style={cardStyle}
                aria-label={`${item.label} — view details`}
              >
                {cardBody}
              </button>
            ) : (
              <div
                key={`card-${item.id}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="pointer-events-none absolute z-20 hidden w-[200px] items-center gap-3 rounded-xl border border-[var(--mag-accent)]/30 bg-black/80 px-4 py-3 backdrop-blur-sm md:flex"
                style={cardStyle}
              >
                {item.imageUrl ? (
                  <div className="h-14 w-14 flex-none rounded-lg">
                    <ItemImage
                      src={item.imageUrl}
                      alt={item.label}
                      size="thumbnail"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-neutral-800">
                    <span className="text-[10px] text-neutral-500">IMG</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold leading-tight text-[var(--mag-text)]">
                    {item.label}
                  </p>
                  {item.brand && (
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--mag-accent)]">
                      {item.brand}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {artist?.displayName ? (
          <div
            ref={artistRevealRef}
            className="mx-auto mt-8 max-w-md px-2 text-center md:mt-10"
          >
            <div className="flex flex-col items-center gap-2">
              {artist.profileImageUrl ? (
                <img
                  src={`/api/v1/image-proxy?url=${encodeURIComponent(artist.profileImageUrl)}`}
                  alt=""
                  className="h-12 w-12 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base font-bold text-[var(--mag-text)]/50">
                  {artist.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-center">
                <Link
                  href={`/explore?q=${encodeURIComponent(artist.displayName)}`}
                  className="text-lg font-semibold text-[var(--mag-text)] transition-colors hover:text-[var(--mag-accent)]"
                >
                  {artist.displayName}
                </Link>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Artist
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {aiSummary?.trim() ? (
          <div ref={summaryRevealRef} className="mx-auto mt-6 w-full max-w-3xl px-2">
            <AISummarySection
              summary={aiSummary.trim()}
              isModal={isModal}
              surface="decode"
            />
          </div>
        ) : null}
      </div>

    </section>

      {/* Scroll hint — portal to body so GSAP pin transforms don't break fixed positioning */}
      {portalTarget &&
        createPortal(
          <div
            ref={scrollHintRef}
            className="fixed inset-x-0 bottom-8 z-[9999] flex flex-col items-center gap-1.5 pointer-events-none"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
              Scroll to decode
            </span>
            <svg
              width="20"
              height="28"
              viewBox="0 0 20 28"
              fill="none"
              className="animate-bounce-slow"
              aria-hidden
            >
              <rect
                x="1"
                y="1"
                width="18"
                height="26"
                rx="9"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-white/30"
              />
              <circle cx="10" cy="9" r="2" className="fill-white/60 animate-scroll-dot" />
            </svg>
          </div>,
          portalTarget,
        )}
    </>
  );
}
