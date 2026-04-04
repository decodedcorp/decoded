"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { StyleCardData } from "./StyleCard";
import type { ItemCardData } from "./ItemCard";
import { useState, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Sample data
const sampleStyleData: StyleCardData = {
  id: "dp-1",
  title: "Modern Minimalist\nNarrative",
  description: "",
  artistName: "Blackpink Lisa",
  link: "/feed",
  imageUrl:
    "https://images.unsplash.com/photo-1699847061593-188987efcd3e?w=800",
  spots: [
    { id: "dp-s1", x: 42, y: 35, label: "Shoulder Bag" },
    { id: "dp-s2", x: 58, y: 25, label: "Oversized Shades" },
    { id: "dp-s3", x: 45, y: 85, label: "Leather Boots" },
    { id: "dp-s4", x: 52, y: 15, label: "Gold Chain" },
  ],
  items: [
    {
      id: "dp-i1",
      label: "ACC",
      brand: "Prada",
      name: "Leather Tote",
      imageUrl:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
    },
    {
      id: "dp-i2",
      label: "ACC",
      brand: "Celine",
      name: "Cat-eye Shades",
      imageUrl:
        "https://images.unsplash.com/photo-1564848005333-590727c99921?w=400",
    },
    {
      id: "dp-i3",
      label: "SHOES",
      brand: "Saint Laurent",
      name: "Chelsea Boots",
      imageUrl:
        "https://images.unsplash.com/photo-1518738058435-19149697112a?w=400",
    },
    {
      id: "dp-i4",
      label: "ACC",
      brand: "Cartier",
      name: "Love Necklace",
      imageUrl:
        "https://images.unsplash.com/photo-1641206189215-9533ceb7a1df?w=400",
    },
  ],
};

interface DecodedPickSectionProps {
  styleData?: StyleCardData;
  items?: ItemCardData[];
  pickDate?: string | null;
  curatedBy?: string | null;
  note?: string | null;
}

function formatPickDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" }) + " Pick";
}

export function DecodedPickSection({
  styleData = sampleStyleData,
  items,
  pickDate,
  curatedBy,
  note,
}: DecodedPickSectionProps) {
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);

  // Convert StyleCard items to ItemCardData with required link field
  const itemCards: ItemCardData[] =
    items ||
    (sampleStyleData.items?.map((item) => ({
      ...item,
      link: `/items/${item.id}`,
    })) ??
      []);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. Header: scrub-linked slide from left
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, x: -80, filter: "blur(8px)" },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            end: "top 50%",
            scrub: 0.8,
          },
        }
      );

      // 2. Spotlight image: scale + parallax scrub
      gsap.fromTo(
        imageWrapperRef.current,
        { opacity: 0, scale: 0.88, y: 80 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: imageWrapperRef.current,
            start: "top 95%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );

      // Parallax: image drifts slower than scroll
      gsap.to(imageWrapperRef.current, {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: imageWrapperRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // 3. Overlay text: scrub-linked reveal
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: imageWrapperRef.current,
            start: "top 60%",
            end: "top 25%",
            scrub: 0.6,
          },
        }
      );

      // 4. Item cards: staggered scrub from right
      const pickItems =
        itemsContainerRef.current?.querySelectorAll(".decoded-pick-item");
      if (pickItems?.length) {
        pickItems.forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0, x: 60, y: 30 },
            {
              opacity: 1,
              x: 0,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 95%",
                end: "top 60%",
                scrub: 0.6 + i * 0.15,
              },
            }
          );
        });
      }

      // 5. CTA link: fade up scrub
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 95%",
            end: "top 70%",
            scrub: 0.6,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="bg-black text-white py-24 md:py-40 px-6 md:px-12 rounded-t-[60px] md:rounded-t-[100px] -mt-20 relative z-20 shadow-[0_-30px_100px_rgba(0,0,0,0.8)] border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 md:mb-32 gap-10">
          <div className="max-w-2xl">
            <div ref={headerRef} style={{ opacity: 0 }}>
              <span className="text-primary font-sans font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-6 block">
                {curatedBy === "editor" ? "Editor\u2019s Choice" : "AI Curated"}
              </span>
              <h2 className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter leading-[0.85]">
                Decoded&apos;s
                <br />
                Pick
              </h2>
              {pickDate && (
                <p className="mt-6 text-sm font-sans tracking-[0.2em] text-white/40 uppercase">
                  {formatPickDate(pickDate)}
                </p>
              )}
              {note && (
                <p className="mt-4 text-sm md:text-base font-sans text-white/50 italic max-w-md leading-relaxed">
                  &ldquo;{note}&rdquo;
                </p>
              )}
            </div>
          </div>
          <Link
            href="/feed"
            className="group flex items-center gap-4 text-xs font-sans font-bold tracking-[0.3em] text-white/30 hover:text-white transition-all uppercase"
          >
            <span>View all narratives</span>
            <div className="w-12 h-[1px] bg-white/10 group-hover:bg-primary transition-all group-hover:w-16" />
          </Link>
        </div>

        {/* Content Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-start">
          {/* Left: Spotlight Image Section */}
          <div className="lg:col-span-7 relative group">
            <div
              ref={imageWrapperRef}
              style={{ opacity: 0 }}
              className="relative aspect-[3/4] md:aspect-[4/5] rounded-[48px] overflow-hidden cursor-crosshair bg-neutral-900 shadow-3xl"
            >
              {/* Grayscale Base Layer */}
              <div className="absolute inset-0 z-0">
                {styleData.imageUrl && (
                  <Image
                    src={styleData.imageUrl}
                    alt={styleData.title}
                    fill
                    className="object-cover grayscale brightness-40 contrast-[1.1]"
                  />
                )}
              </div>

              {/* Spotlight Color Layer (Clipping Mask) — kept as motion.div for reactive animate */}
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none"
                animate={{
                  clipPath: activeSpotId
                    ? `circle(140px at ${styleData.spots?.find((s) => s.id === activeSpotId)?.x ?? 50}% ${styleData.spots?.find((s) => s.id === activeSpotId)?.y ?? 50}%)`
                    : "circle(0% at 50% 50%)",
                }}
                transition={{ type: "spring", stiffness: 120, damping: 24 }}
              >
                {styleData.imageUrl && (
                  <Image
                    src={styleData.imageUrl}
                    alt={styleData.title}
                    fill
                    className="object-cover"
                  />
                )}
              </motion.div>

              {/* Interactive Spots */}
              <div className="absolute inset-0 z-20">
                {styleData.spots?.map((spot) => (
                  <button
                    key={spot.id}
                    onMouseEnter={() => setActiveSpotId(spot.id)}
                    onMouseLeave={() => setActiveSpotId(null)}
                    onClick={() =>
                      setActiveSpotId(spot.id === activeSpotId ? null : spot.id)
                    }
                    className="absolute w-14 h-14 -ml-7 -mt-7 flex items-center justify-center group/spot"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 border-white transition-all duration-300 shadow-2xl",
                        activeSpotId === spot.id
                          ? "bg-primary scale-125"
                          : "bg-white/20 backdrop-blur-md group-hover/spot:bg-white/50"
                      )}
                    />

                    <AnimatePresence>
                      {activeSpotId === spot.id && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute inset-0 rounded-full bg-primary/30 animate-ping z-[-1]"
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full mb-4 px-5 py-2.5 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-full whitespace-nowrap z-30"
                          >
                            <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-white uppercase">
                              {spot.label}
                            </span>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>

              {/* Static Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14 z-30 pointer-events-none">
                <div ref={overlayRef} style={{ opacity: 0 }}>
                  <p className="text-white/50 font-sans font-bold tracking-[0.3em] text-[10px] uppercase mb-3">
                    {styleData.artistName}
                  </p>
                  <h3 className="text-3xl md:text-5xl font-serif font-bold italic leading-[1.1] max-w-lg tracking-tighter">
                    {styleData.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Featured Items List */}
          <div className="lg:col-span-5 flex flex-col gap-12">
            <div className="space-y-6">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.3em] text-white/30 uppercase">
                Product Breakdown
              </h4>
              <div className="h-[1px] w-full bg-white/5" />
            </div>

            <div ref={itemsContainerRef} className="grid grid-cols-1 gap-10">
              {itemCards.map((item) => (
                <div
                  key={item.id}
                  className="decoded-pick-item"
                  style={{ opacity: 0 }}
                >
                  <Link
                    href={item.link}
                    className={cn(
                      "group flex items-center gap-8 p-5 rounded-[32px] transition-all duration-700 hover:bg-white/5 border border-transparent hover:border-white/5",
                      activeSpotId &&
                        styleData.items?.find((si) => si.id === item.id)
                        ? "bg-white/10 border-white/10 scale-[1.02]"
                        : ""
                    )}
                  >
                    <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0 bg-neutral-900 shadow-lg">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-neutral-800" />
                      )}
                    </div>

                    <div className="flex-1">
                      <span className="text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-primary mb-2 block uppercase">
                        {item.brand}
                      </span>
                      <h5 className="text-xl md:text-2xl font-sans font-medium text-white group-hover:text-primary transition-colors line-clamp-1 mb-3 tracking-tight">
                        {item.name}
                      </h5>
                      <div className="flex items-center justify-between">
                        <span className="text-lg md:text-xl font-serif italic text-white/40 group-hover:text-white/60 transition-colors">
                          {item.price}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <Link
              ref={ctaRef}
              href={styleData.link}
              style={{ opacity: 0 }}
              className="mt-6 py-7 w-full border border-white/10 rounded-[24px] text-center text-[10px] font-sans font-bold tracking-[0.3em] text-white/30 hover:text-white hover:border-white/40 hover:bg-white/[0.02] transition-all uppercase"
            >
              Discover full aesthetic
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
