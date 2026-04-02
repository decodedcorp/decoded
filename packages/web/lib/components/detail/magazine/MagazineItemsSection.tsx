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
  scrollContainerRef?: RefObject<HTMLElement>;
  onActiveIndexChange?: (index: number | null) => void;
};

export function MagazineItemsSection({
  items,
  relatedItems = [],
  accentColor,
  isModal,
  scrollContainerRef,
  onActiveIndexChange,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionWidth, setSectionWidth] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setSectionWidth(entry.contentRect.width));
    obs.observe(el);
    setSectionWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  // Estimate text container width beside the image (md:w-60 lg:w-64 + gap-10 + section px-8*2)
  const titleContainerWidth = sectionWidth >= 768
    ? Math.max(sectionWidth - 256 - 40 - 64, 0)  // desktop: section - image - gap - section padding
    : Math.max(sectionWidth - 32, 0);              // mobile: section - px-4*2

  const titleLayouts = useBatchTextLayout({
    items: items.map((item) => ({
      key: item.spot_id,
      text: item.title,
    })),
    font: '700 20px system-ui, -apple-system, sans-serif',
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

  useGSAP(() => {
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
    if (isModal && onActiveIndexChange && cards.length > 0) {
      const scroller = scrollContainerRef?.current || window;

      cards.forEach((card, index) => {
        ScrollTrigger.create({
          scroller,
          trigger: card,
          start: "top center",
          end: "bottom center",
          invalidateOnRefresh: true,
          onEnter: () => {
            activeIndexRef.current = index;
            onActiveIndexChange(index);
          },
          onEnterBack: () => {
            activeIndexRef.current = index;
            onActiveIndexChange(index);
          },
          onLeave: () => {
            if (activeIndexRef.current === index) {
              onActiveIndexChange(null);
            }
          },
          onLeaveBack: () => {
            if (activeIndexRef.current === index) {
              onActiveIndexChange(null);
            }
          },
        });
      });

      // Refresh after layout stabilizes
      if (scrollContainerRef?.current) {
        const timer = setTimeout(() => ScrollTrigger.refresh(), 300);
        return () => {
          clearTimeout(timer);
          ScrollTrigger.getAll().forEach((trigger) => {
            if (cards.includes(trigger.vars.trigger as HTMLElement)) {
              trigger.kill();
            }
          });
        };
      }
    }
  }, { scope: sectionRef, dependencies: [items.length, isModal] });

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16"
    >
      <h2 className="typography-h3 mb-2 text-center">The Look</h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        아이템 상세 & 에디토리얼
      </p>

      <div className="space-y-12 md:space-y-16">
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
            <div key={item.spot_id} className="item-card" data-item-index={i}>
              <div
                className={`flex flex-col gap-6 md:flex-row md:gap-10 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Item Image */}
                <div className="w-full shrink-0 md:w-60 lg:w-64">
                  {item.image_url ? (
                    <ItemImage
                      src={item.image_url}
                      alt={item.title}
                      size="card"
                      className="rounded-xl"
                    />
                  ) : (
                    <div
                      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-muted p-6 text-center"
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
                        <span className="font-serif text-2xl font-light tracking-wide text-foreground/70 md:text-3xl">
                          {item.brand}
                        </span>
                      )}
                      {meta?.sub_category && (
                        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                          {meta.sub_category}
                        </span>
                      )}
                      {meta?.material && meta.material.length > 0 && (
                        <span className="text-[10px] italic text-muted-foreground/40">
                          {meta.material.join(" · ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Item Details + Editorial */}
                <div className="flex flex-1 flex-col justify-center">
                  {item.brand && (
                    <p className="typography-overline mb-2 text-muted-foreground">
                      {item.brand}
                    </p>
                  )}
                  <h3
                    className="typography-h4 mb-2"
                    style={titleHeight > 0 ? { minHeight: titleHeight } : undefined}
                  >
                    {item.title}
                  </h3>
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
                </div>
              </div>

              {/* Similar Items for this spot */}
              {spotRelated.length > 0 && (
                <div className="mt-6 ml-0 md:ml-[calc(15rem+2.5rem)] lg:ml-[calc(16rem+2.5rem)]">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Similar Items
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                          size="card"
                          imgClassName="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="p-2.5">
                          {ri.brand && (
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              {ri.brand}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs font-medium leading-snug line-clamp-2">
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
