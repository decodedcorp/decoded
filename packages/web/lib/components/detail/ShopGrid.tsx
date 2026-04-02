"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { UiItem } from "./types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ItemImage } from "@/lib/components/shared/ItemImage";
import { SpotlightCard } from "@/lib/components/ui/SpotlightCard";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  items: UiItem[];
  isModal?: boolean;
  /** 포스트 ID – 솔루션 등록 시트용 */
  postId?: string;
  /** CTA 클릭 시 솔루션 등록 시트 열기 (postId 필요) */
  onAddSolutionClick?: (spotId: string) => void;
};

/**
 * ShopGrid - "Shop the Look" section
 *
 * Horizontal carousel displaying items extracted from the image.
 * Prioritizes spotted items (items with confirmed spots) first.
 * Uses stagger animation for sequential card appearance.
 * Features ReactBits Spotlight Card effect.
 *
 * Layout:
 * - Mobile: horizontal scroll carousel with snap points
 * - Desktop: responsive grid (3-4 columns)
 */
export function ShopGrid({
  items,
  isModal = false,
  postId,
  onAddSolutionClick,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const track = useTrackEvent();

  // Sort items - spotted items first, then related suggestions
  const sortedItems = [...items].sort((a, b) => {
    // Assume items are spotted if they have valid coordinates/center
    const aSpotted = a.normalizedCenter ? 1 : 0;
    const bSpotted = b.normalizedCenter ? 1 : 0;
    return bSpotted - aSpotted;
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [sortedItems]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 280; // Adjusted for smaller card width
    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  useGSAP(
    () => {
      // Skip GSAP animations in modal to avoid ScrollTrigger issues
      if (isModal || !containerRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(
        containerRef.current.querySelectorAll(".shop-card")
      );

      gsap.fromTo(
        cards,
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: containerRef, dependencies: [isModal] }
  );

  if (sortedItems.length === 0) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className={`border-t border-border/40 overflow-hidden w-full ${
        isModal ? "py-12 md:py-16" : "py-24"
      }`}
    >
      <div
        className={`mx-auto ${isModal ? "max-w-full px-4 md:px-6" : "max-w-7xl px-6 md:px-8"}`}
      >
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3 md:mb-4">
            Featured Items
          </span>
          <h2
            className={`text-lg font-medium text-foreground ${
              isModal
                ? "text-2xl md:text-3xl"
                : "text-3xl md:text-4xl lg:text-5xl"
            }`}
          >
            Shop the Look
          </h2>
        </div>
      </div>

      <div className="relative group/carousel w-full">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all duration-300 shadow-lg ${
            !canScrollLeft
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover/carousel:opacity-100 hover:bg-background hover:scale-110"
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all duration-300 shadow-lg ${
            !canScrollRight
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover/carousel:opacity-100 hover:bg-background hover:scale-110"
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Container - Mobile: scroll, Desktop: grid */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={`flex md:grid md:grid-cols-3 lg:grid-cols-4 overflow-x-auto md:overflow-visible scrollbar-hide snap-x snap-mandatory md:snap-none w-full ${
            isModal
              ? "gap-3 md:gap-4 px-4 md:px-6 pb-8 md:pb-10 pt-2 md:pt-4"
              : "gap-4 md:gap-6 px-4 md:px-8 pb-12 pt-4"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sortedItems.map((item, index) => {
            const needsSolution = !item.imageUrl && !item.product_name;
            const addSolutionHref = item.image_id
              ? `${item.spot_id ? `/posts/${item.image_id}?spot=${item.spot_id}` : `/posts/${item.image_id}`}`
              : "#";

            return (
              <div
                key={item.id}
                className={`shop-card flex-none md:flex-auto snap-center md:snap-start group flex flex-col ${
                  isModal
                    ? "w-[43%] sm:w-[30%] md:w-auto"
                    : "w-[43%] sm:w-[30%] md:w-auto"
                }`}
              >
                <SpotlightCard className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
                  <div
                    className={`flex flex-col h-full ${isModal ? "p-3" : "p-3 md:p-4"}`}
                  >
                    {needsSolution ? (
                      /* CTA 카드: 솔루션 등록 유도 */
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddSolutionClick && item.spot_id) {
                            onAddSolutionClick(item.spot_id);
                          } else if (
                            addSolutionHref &&
                            addSolutionHref !== "#"
                          ) {
                            router.push(addSolutionHref);
                          }
                        }}
                        className="flex flex-col h-full gap-3 md:gap-4 group/cta w-full text-left cursor-pointer"
                      >
                        <div
                          className={`relative w-full aspect-square overflow-hidden rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center ${
                            isModal ? "mb-2 md:mb-3" : "mb-3 md:mb-4"
                          }`}
                        >
                          {item.spot_index != null && (
                            <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                              {item.spot_index}
                            </span>
                          )}
                          <Plus className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/60 group-hover/cta:text-primary transition-colors" />
                          <p className="mt-2 text-xs md:text-sm font-medium text-muted-foreground group-hover/cta:text-foreground transition-colors text-center px-2">
                            {item.spot_index != null
                              ? `#${item.spot_index} 아이템을 알고 계신가요?`
                              : "이 아이템을 알고 계신가요?"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center text-center flex-grow">
                          <span
                            className={`w-full inline-flex items-center justify-center gap-2 border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-[9px] md:text-[10px] uppercase tracking-widest rounded-sm ${
                              isModal
                                ? "mt-auto py-1.5 md:py-2"
                                : "mt-auto py-2"
                            }`}
                          >
                            솔루션 등록하기
                          </span>
                        </div>
                      </button>
                    ) : (
                      <>
                        {/* Item Image */}
                        <ItemImage
                          src={item.imageUrl || ""}
                          alt={item.product_name || "Item"}
                          size="card"
                          className={`rounded-lg ${
                            isModal ? "mb-2 md:mb-3" : "mb-3 md:mb-4"
                          }`}
                          imgClassName="transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Item Details */}
                        <div className="flex flex-col items-center text-center flex-grow">
                          {item.brand && (
                            <p
                              className={`text-xs uppercase tracking-wide text-muted-foreground ${
                                isModal ? "mb-1" : "mb-2"
                              }`}
                            >
                              {item.brand}
                            </p>
                          )}
                          <h3
                            className={`text-sm font-medium truncate w-full ${
                              isModal ? "mb-1 md:mb-2" : "mb-2"
                            }`}
                          >
                            {item.product_name || "Untitled Item"}
                          </h3>
                          {item.price && (
                            <p className={`text-sm text-foreground mt-auto`}>
                              {item.price.split("|")[0].trim()}
                            </p>
                          )}

                          <button
                            onClick={() => {
                              if (item.spot_id) {
                                track({
                                  event_type: "spot_click",
                                  entity_id: item.spot_id,
                                  metadata: { post_id: postId },
                                });
                              }
                            }}
                            className={`w-full border border-border/50 bg-background/50 hover:bg-foreground hover:text-background transition-all duration-300 text-[9px] md:text-[10px] uppercase tracking-widest rounded-sm ${
                              isModal
                                ? "mt-2 md:mt-3 py-1.5 md:py-2"
                                : "mt-3 md:mt-4 py-2"
                            }`}
                          >
                            View Details
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </SpotlightCard>
              </div>
            );
          })}
          {/* End spacer for smooth scrolling on mobile */}
          <div className="w-2 flex-none md:hidden" />
        </div>
      </div>
    </section>
  );
}
