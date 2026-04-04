"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { SpotRow, SolutionRow } from "@/lib/supabase/types";
import { ChevronRight, ShoppingBag, Bookmark, Share2 } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  spots: SpotRow[];
  solutions: SolutionRow[];
};

type DecodedItem = {
  spot: SpotRow;
  solution: SolutionRow | undefined;
  title: string;
  brand: string;
  price: string;
  thumbnailUrl: string | null;
  description: string;
  matchType: string;
  shopUrl: string | null;
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
 * Extract brand from solution title or keywords
 */
function extractBrand(solution: SolutionRow | undefined): string {
  if (!solution) return "Unknown";
  // Try keywords first
  const kw = solution.keywords as string[] | null;
  if (kw && kw.length > 0) {
    return kw[0].toUpperCase();
  }
  // Try extracting from title -- take first word as brand
  if (solution.title) {
    const firstWord = solution.title.split(" ")[0];
    if (firstWord && firstWord.length > 1) {
      return firstWord.toUpperCase();
    }
  }
  return "BRAND";
}

/**
 * DecodedItemsSection - Decoded Items with item list + expandable detail card
 *
 * Replaces the old ShopGrid for post detail. Shows a selectable item list
 * with an expandable detail card for the selected item.
 *
 * Mobile: stacked vertical layout
 * Desktop: side-by-side with item list on left, detail card on right
 */
export function DecodedItemsSection({ spots, solutions }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Build combined data array
  const items: DecodedItem[] = spots.map((spot) => {
    const solution = solutions.find((s) => s.spot_id === spot.id);
    return {
      spot,
      solution,
      title: solution?.title || "Unknown Item",
      brand: extractBrand(solution),
      price: formatPrice(
        solution?.price_amount ?? null,
        solution?.price_currency || "USD"
      ),
      thumbnailUrl: solution?.thumbnail_url || null,
      description: solution?.description || "",
      matchType: solution?.match_type || "EXACT MATCH",
      shopUrl: solution?.affiliate_url || solution?.original_url || null,
    };
  });

  // GSAP stagger animation on scroll (y only, keep items visible)
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const itemRows = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll(".decoded-item-row")
      );

      if (itemRows.length > 0) {
        gsap.from(itemRows, {
          y: 20,
          duration: 0.5,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
          },
        });
      }
    },
    { scope: sectionRef, dependencies: [items.length] }
  );

  if (items.length === 0) return null;

  const selected = items[selectedIndex];

  return (
    <section ref={sectionRef} className="bg-card/50">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-8 md:px-8 md:pt-14 md:pb-10">
        {/* Desktop: side-by-side layout */}
        <div className="md:flex md:flex-row md:gap-6">
          {/* Left side: header + item list */}
          <div className="md:w-[400px] md:flex-shrink-0">
            {/* Section header */}
            <div className="flex items-end justify-between mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[3px] text-muted-foreground">
                  SPOT SOLUTIONS
                </span>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  Decoded Items
                </h2>
              </div>
              {items.length > 3 && (
                <span className="text-[13px] font-medium font-sans text-primary cursor-pointer hover:underline py-3 px-2 -my-3 -mx-2">
                  View All
                </span>
              )}
            </div>

            {/* Item list */}
            <div className="flex flex-col gap-3">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.spot.id}
                    onClick={() => setSelectedIndex(index)}
                    className={`decoded-item-row w-full rounded-xl p-3 flex flex-row items-center gap-3 transition-colors duration-200 text-left ${
                      isSelected ? "bg-primary" : "bg-card hover:bg-card/80"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground text-xs font-serif italic">
                            N/A
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <span
                        className={`text-sm font-semibold line-clamp-1 ${
                          isSelected
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`text-xs ${
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.brand}
                        {item.price && ` \u00B7 ${item.price}`}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronRight
                      className={`w-5 h-5 flex-shrink-0 ${
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side / Below on mobile: expanded detail card */}
          {selected && (
            <div className="mt-4 md:mt-0 md:flex-1">
              <ExpandedDetailCard item={selected} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Expanded detail card for a selected decoded item
 */
function ExpandedDetailCard({ item }: { item: DecodedItem }) {
  return (
    <div className="bg-secondary rounded-xl p-4 md:p-6 flex flex-col gap-3 md:gap-4">
      {/* Header row */}
      <div className="flex flex-row gap-3 md:gap-4">
        {/* Image */}
        <div className="w-20 h-[100px] md:w-[140px] md:h-[180px] flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              width={140}
              height={180}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <span className="text-muted-foreground text-xs font-serif italic">
                No Image
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Title */}
          <h3 className="text-sm md:text-xl font-semibold text-foreground line-clamp-2">
            {item.title}
          </h3>

          {/* Brand */}
          <span className="text-xs text-muted-foreground">{item.brand}</span>

          {/* Price */}
          {item.price && (
            <span className="text-base md:text-2xl font-bold text-primary">
              {item.price}
            </span>
          )}
        </div>
      </div>

      {/* Styling tip */}
      {item.description && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-semibold tracking-[1px] text-muted-foreground uppercase">
            STYLING TIP
          </span>
          <p className="text-xs md:text-sm text-foreground leading-[1.4] md:leading-[1.6]">
            {item.description}
          </p>
        </div>
      )}

      {/* Similar options (desktop only, if multiple solutions for same spot) */}
      {item.solution && (
        <SimilarOptions
          spotId={item.spot.id}
          currentSolutionId={item.solution.id}
          solutions={[]}
        />
      )}

      {/* Action row */}
      <div className="flex flex-row gap-2 mt-1">
        {/* Shop Now button */}
        {item.shopUrl ? (
          <a
            href={item.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary rounded-lg py-2.5 px-3.5 transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="w-4 h-4 text-primary-foreground" />
            <span className="text-[13px] font-semibold text-primary-foreground">
              Shop Now
            </span>
          </a>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 bg-primary/50 rounded-lg py-2.5 px-3.5 cursor-not-allowed">
            <ShoppingBag className="w-4 h-4 text-primary-foreground/50" />
            <span className="text-[13px] font-semibold text-primary-foreground/50">
              Unavailable
            </span>
          </div>
        )}

        {/* Save button */}
        <button className="flex items-center justify-center bg-card rounded-lg py-2.5 px-3.5 transition-colors hover:bg-card/80">
          <Bookmark className="w-4 h-4 text-foreground" />
        </button>

        {/* Share button (desktop only) */}
        <button className="hidden md:flex items-center justify-center bg-card rounded-lg py-2.5 px-3.5 transition-colors hover:bg-card/80">
          <Share2 className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}

/**
 * Similar options section (desktop only)
 * Shows additional solutions for the same spot
 */
function SimilarOptions({
  spotId: _spotId,
  currentSolutionId: _currentSolutionId,
  solutions: _solutions,
}: {
  spotId: string;
  currentSolutionId: string;
  solutions: SolutionRow[];
}) {
  // Placeholder for future implementation: show other solutions for the same spot
  // Currently not wired up since we'd need to pass all solutions per spot
  return null;
}
