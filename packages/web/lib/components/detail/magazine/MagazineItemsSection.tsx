"use client";

import { useEffect, useMemo, useRef, useState, RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { ExternalLink } from "lucide-react";
import { ItemImage } from "@/lib/components/shared/ItemImage";
import type {
  PostMagazineSpotItem,
  PostMagazineRelatedItem,
} from "@/lib/api/mutation-types";
import { useBatchTextLayout } from "@/lib/hooks/usePretext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  items: PostMagazineSpotItem[];
  relatedItems?: PostMagazineRelatedItem[];
  accentColor?: string;
  isModal?: boolean;
  compact?: boolean;
  scrollContainerRef?: RefObject<HTMLElement>;
  onActiveIndexChange?: (index: number | null) => void;
  brandProfiles?: Record<string, { name: string; profileImageUrl: string | null }>;
};

export function MagazineItemsSection({
  items,
  relatedItems = [],
  accentColor,
  isModal,
  compact = false,
  scrollContainerRef,
  onActiveIndexChange,
  brandProfiles,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionWidth, setSectionWidth] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) =>
      setSectionWidth(entry.contentRect.width)
    );
    obs.observe(el);
    setSectionWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  // Estimate text container width beside the image (md:w-60 lg:w-64 + gap-10 + section px-8*2)
  const titleContainerWidth =
    sectionWidth >= 768
      ? Math.max(sectionWidth - 256 - 40 - 64, 0) // desktop: section - image - gap - section padding
      : Math.max(sectionWidth - 32, 0); // mobile: section - px-4*2

  const titleLayouts = useBatchTextLayout({
    items: items.map((item) => ({
      key: item.spot_id,
      text: item.title,
    })),
    font: "700 20px system-ui, -apple-system, sans-serif",
    lineHeight: 28,
    containerWidth: titleContainerWidth,
  });

  const relatedBySpot = useMemo(() => {
    const map = new Map<string, PostMagazineRelatedItem[]>();
    for (const ri of relatedItems) {
      if (!ri.for_spot_id) continue;
      const list = map.get(ri.for_spot_id) ?? [];
      list.push(ri);
      map.set(ri.for_spot_id, list);
    }
    return map;
  }, [relatedItems]);

  // Track active index ref for stale closure prevention
  const activeIndexRef = useRef<number | null>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll("[data-item-index]")
      );

      if (!isModal) {
        // Full page: entry animation
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              delay: i * 0.15,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }

      // Modal: ScrollTrigger for scroll-spot sync
      // Use RAF loop to wait until scroller has scrollable content before initializing
      if (isModal && onActiveIndexChange && cards.length > 0) {
        const scroller = scrollContainerRef?.current || window;
        let cancelled = false;
        // Ignore initial ScrollTrigger fire — only activate after user scrolls
        let hasScrolled = false;
        const scrollerTarget = scroller instanceof Window ? window : scroller;
        const markScrolled = () => {
          hasScrolled = true;
          scrollerTarget.removeEventListener("scroll", markScrolled);
          // Re-evaluate triggers now that hasScrolled is true
          ScrollTrigger.update();
        };
        scrollerTarget.addEventListener("scroll", markScrolled, { passive: true });

        const initScrollTriggers = () => {
          if (cancelled) return;

          cards.forEach((card, index) => {
            ScrollTrigger.create({
              scroller,
              trigger: card,
              start: "top 70%",
              end: "bottom center",
              invalidateOnRefresh: true,
              onEnter: () => {
                if (!hasScrolled) return;
                activeIndexRef.current = index;
                onActiveIndexChange(index);
              },
              onEnterBack: () => {
                if (!hasScrolled) return;
                activeIndexRef.current = index;
                onActiveIndexChange(index);
              },
              onLeave: () => {
                if (!hasScrolled) return;
                if (activeIndexRef.current === index) {
                  onActiveIndexChange(null);
                }
              },
              onLeaveBack: () => {
                if (!hasScrolled) return;
                if (activeIndexRef.current === index) {
                  onActiveIndexChange(null);
                }
              },
            });
          });
          ScrollTrigger.refresh();
        };

        const scrollerEl = scroller instanceof Window ? document.documentElement : scroller as HTMLElement;
        let attempts = 0;
        const maxAttempts = 25;

        const checkReady = () => {
          if (cancelled) return;
          attempts++;
          if (scrollerEl.scrollHeight > scrollerEl.clientHeight || attempts >= maxAttempts) {
            initScrollTriggers();
          } else {
            requestAnimationFrame(checkReady);
          }
        };

        requestAnimationFrame(checkReady);

        return () => {
          cancelled = true;
          ScrollTrigger.getAll().forEach((trigger) => {
            if (cards.includes(trigger.vars.trigger as HTMLElement)) {
              trigger.kill();
            }
          });
        };
      }
    },
    { scope: sectionRef, dependencies: [items.length, isModal] }
  );

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`mx-auto ${compact ? "max-w-5xl px-4 py-4 md:px-6 md:py-6" : "max-w-5xl px-4 py-12 md:px-8 md:py-16"}`}
    >
      {!compact && (
        <>
          <h2 className="typography-h3 mb-2 text-center">The Look</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            아이템 상세 & 에디토리얼
          </p>
        </>
      )}

      <div className={compact ? "divide-y divide-border/20" : "space-y-12 md:space-y-16"}>
        {items.map((item, i) => {
          const meta = item.metadata as
            | {
                price?: string;
                sub_category?: string;
                material?: string[];
              }
            | undefined;
          const price = meta?.price;
          const spotRelated = relatedBySpot.get(item.spot_id) ?? [];
          const titleHeight = titleLayouts[item.spot_id]?.height ?? 0;

          return (
            <div key={item.spot_id} className={compact ? "item-card py-5 first:pt-0 last:pb-0" : "item-card"} data-item-index={i}>
              <div
                className={`flex flex-col ${compact ? "gap-4 md:flex-row md:gap-5" : `gap-6 md:flex-row md:gap-10 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}`}
              >
                {/* Item Image */}
                <div className={`w-full shrink-0 ${compact ? "md:w-52 lg:w-56" : "md:w-60 lg:w-64"}`}>
                  {item.image_url ? (
                    <ItemImage
                      src={item.image_url}
                      alt={item.title}
                      size="card"
                      className="rounded-xl"
                    />
                  ) : (
                    <div
                      className={`flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border/50 bg-muted text-center ${compact ? "aspect-square p-4" : "aspect-[3/4] gap-3 p-6"}`}
                      style={{
                        background: accentColor
                          ? `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`
                          : undefined,
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      {item.brand && (
                        <>
                          <div className="mx-auto h-px w-8 bg-border/30" />
                          <span className={`font-serif font-light tracking-wide text-foreground/70 ${compact ? "text-lg" : "text-2xl md:text-3xl"}`}>
                            {item.brand}
                          </span>
                        </>
                      )}
                      {meta?.sub_category && (
                        <>
                          <div className="mx-auto h-px w-8 bg-border/30" />
                          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                            {meta.sub_category}
                          </span>
                        </>
                      )}
                      {!compact && meta?.material && meta.material.length > 0 && (
                        <>
                          <div className="mx-auto h-px w-8 bg-border/30" />
                          <span className="text-[10px] italic text-muted-foreground/40">
                            {meta.material.join(" · ")}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex flex-1 flex-col justify-center">
                  {item.brand && (
                    <div className={`flex items-center gap-2 ${compact ? "mb-1" : "mb-2"}`}>
                      {(() => {
                        const bp = brandProfiles?.[item.brand.toLowerCase()];
                        if (!bp?.profileImageUrl) return null;
                        return (
                          <img
                            src={`/api/v1/image-proxy?url=${encodeURIComponent(bp.profileImageUrl)}`}
                            alt={bp.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        );
                      })()}
                      <p className="typography-overline text-muted-foreground">
                        {item.brand}
                      </p>
                    </div>
                  )}
                  <h3
                    className={compact ? "text-base font-semibold mb-1" : "typography-h4 mb-2"}
                    style={
                      !compact && titleHeight > 0 ? { minHeight: titleHeight } : undefined
                    }
                  >
                    {item.title}
                  </h3>
                  {compact ? (
                    /* Compact: description + price + Shop Now inline */
                    <>
                      {item.editorial_paragraphs.length > 0 && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                          {item.editorial_paragraphs[0]}
                        </p>
                      )}
                    <div className="flex items-center gap-3 mt-1">
                      {price && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {price}
                        </span>
                      )}
                      {item.original_url && (
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Shop
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    </>
                  ) : (
                    /* Full: original layout */
                    <>
                      {price && (
                        <p className="mb-4 text-sm font-medium text-muted-foreground">
                          {price}
                        </p>
                      )}

                      {item.editorial_paragraphs.length > 0 && (
                        <div className="mb-6 space-y-3">
                          {item.editorial_paragraphs.map((p, j) => (
                            <p
                              key={j}
                              className="font-serif text-sm leading-relaxed text-foreground/80 md:text-base"
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      )}

                      {item.original_url && (
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
                          style={
                            accentColor
                              ? { borderColor: `${accentColor}40` }
                              : undefined
                          }
                        >
                          Shop Now
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Similar Items for this spot */}
              {spotRelated.length > 0 && (
                <div className={compact ? "mt-3" : "mt-6 ml-0 md:ml-[calc(15rem+2.5rem)] lg:ml-[calc(16rem+2.5rem)]"}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Similar Items
                  </p>
                  <div className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-4 sm:grid-cols-3"}`}>
                    {spotRelated.slice(0, 3).map((ri, j) => (
                      <a
                        key={`${ri.title}-${j}`}
                        href={ri.original_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-border hover:shadow-md"
                      >
                        <ItemImage
                          src={ri.image_url || ""}
                          alt={ri.title}
                          size={compact ? "thumbnail" : "card"}
                          imgClassName="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className={compact ? "p-1.5" : "p-2"}>
                          {ri.brand && (
                            <p className={`font-medium uppercase tracking-wider text-muted-foreground ${compact ? "text-[8px]" : "text-[10px]"}`}>
                              {ri.brand}
                            </p>
                          )}
                          <p className={`mt-0.5 font-medium leading-snug line-clamp-1 ${compact ? "text-[10px]" : "text-xs line-clamp-2"}`}>
                            {ri.title}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
