"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import type { SolutionRow } from "@/lib/supabase/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  solutions: SolutionRow[];
};

/**
 * Format price with currency
 */
function formatPrice(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return "";
  if (currency === "KRW") {
    return `\u20A9${amount.toLocaleString()}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Extract brand from solution
 */
function extractBrand(solution: SolutionRow): string {
  if (solution.keywords && solution.keywords.length > 0) {
    return solution.keywords[0].toUpperCase();
  }
  if (solution.title) {
    const firstWord = solution.title.split(" ")[0];
    if (firstWord && firstWord.length > 1) {
      return firstWord.toUpperCase();
    }
  }
  return "BRAND";
}

/**
 * ShopCarouselSection - "Shop the Look" product carousel
 *
 * Horizontal scroll carousel of product cards derived from solutions.
 * Mobile: snap-x horizontal scroll
 * Desktop: same horizontal scroll with navigation arrows
 */
export function ShopCarouselSection({ solutions }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [solutions]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;
    scrollRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  // GSAP stagger animation (y only, keep cards visible)
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll(".shop-carousel-card")
      );

      if (cards.length > 0) {
        gsap.from(cards, {
          y: 30,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
          },
        });
      }
    },
    { scope: sectionRef, dependencies: [solutions.length] }
  );

  if (solutions.length === 0) return null;

  return (
    <section ref={sectionRef} className="bg-card/50 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="px-6 md:px-8 mb-6 md:mb-8 flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[9px] font-semibold uppercase tracking-[3px] text-muted-foreground">
              CURATED SELECTION
            </span>
            <h2 className="font-serif text-[28px] md:text-[32px] font-bold text-foreground">
              Shop the Look
            </h2>
          </div>

          {/* Desktop nav arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollLeft
                  ? "bg-secondary hover:bg-secondary/80 text-foreground"
                  : "bg-secondary/40 text-muted-foreground/40 cursor-not-allowed"
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollRight
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-primary/40 text-primary-foreground/40 cursor-not-allowed"
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-4 pl-6 md:pl-8 pr-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {solutions.map((solution, index) => {
            const brand = extractBrand(solution);
            const price = formatPrice(
              solution.price_amount,
              solution.price_currency
            );
            const shopUrl =
              solution.affiliate_url || solution.original_url || "#";

            return (
              <a
                key={solution.id}
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-carousel-card flex-none snap-center w-[140px] md:w-[280px] bg-card/50 border border-border/10 rounded-xl p-2 flex flex-col gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
              >
                {/* Product image */}
                <div className="relative w-full h-[160px] md:h-[280px] rounded-lg overflow-hidden bg-muted">
                  {solution.thumbnail_url ? (
                    <Image
                      src={solution.thumbnail_url}
                      alt={solution.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 140px, 280px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30">
                      <span className="text-muted-foreground text-xs font-serif italic">
                        No Image
                      </span>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[9px] font-semibold tracking-[1px] text-muted-foreground uppercase">
                    {brand}
                  </span>
                  <span className="font-serif text-[13px] font-semibold text-foreground line-clamp-1">
                    {solution.title}
                  </span>
                  {price && (
                    <span className="font-sans text-[11px] font-semibold text-primary">
                      {price}
                    </span>
                  )}
                </div>

                {/* View Details button */}
                <button
                  className={`w-full h-8 rounded-md flex items-center justify-center text-[11px] font-semibold transition-colors ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  View Details
                </button>
              </a>
            );
          })}

          {/* End spacer for smooth scrolling */}
          <div className="w-2 flex-none" />
        </div>
      </div>
    </section>
  );
}
