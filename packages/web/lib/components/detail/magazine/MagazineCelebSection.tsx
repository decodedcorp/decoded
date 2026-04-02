"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import type { PostMagazineCelebWithItem } from "@/lib/api/mutation-types";
import { useBatchTextLayout } from "@/lib/hooks/usePretext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  celebs: PostMagazineCelebWithItem[];
  accentColor?: string;
  isModal?: boolean;
};

export function MagazineCelebSection({ celebs, accentColor, isModal }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width));
    obs.observe(el);
    setGridWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  // Card width based on container (45% mobile, 30% md, 23% lg)
  const cardRatio = gridWidth >= 1024 ? 0.23 : gridWidth >= 768 ? 0.30 : 0.45;
  const cardTextWidth = gridWidth > 0
    ? gridWidth * cardRatio - 24  // subtract p-3 padding (12*2)
    : 0;

  const nameLayouts = useBatchTextLayout({
    items: celebs.map((c, i) => ({
      key: `${c.celeb_name}-${i}`,
      text: c.celeb_name,
    })),
    font: '600 14px "Playfair Display", serif',
    lineHeight: 20,
    containerWidth: cardTextWidth,
  });

  useGSAP(() => {
    if (!sectionRef.current || isModal) return;

    const cards = gsap.utils.toArray<HTMLElement>(
      sectionRef.current.querySelectorAll(".celeb-card")
    );

    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: i * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  });

  if (celebs.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16"
    >
      <h2 className="typography-h3 mb-2 text-center">Style Archive</h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        같은 아이템을 착용한 셀럽들
      </p>

      <div
        ref={gridRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {celebs.slice(0, 4).map((celeb, i) => {
          const nameHeight = nameLayouts[`${celeb.celeb_name}-${i}`]?.height ?? 0;
          return (
            <Link
              key={`${celeb.celeb_name}-${i}`}
              href={`/posts/${celeb.post_id}`}
              className="celeb-card group relative flex-shrink-0 snap-start overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg w-[45%] md:w-[30%] lg:w-[23%]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                {celeb.celeb_image_url ? (
                  <Image
                    src={celeb.celeb_image_url}
                    alt={celeb.celeb_name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-serif text-4xl text-muted-foreground/30">
                      {celeb.celeb_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p
                  className="font-serif text-sm font-semibold text-white"
                  style={nameHeight > 0 ? { minHeight: nameHeight } : undefined}
                >
                  {celeb.celeb_name}
                </p>
                {celeb.item_brand && (
                  <p className="mt-0.5 text-xs text-white/70">
                    {celeb.item_brand}
                    {celeb.item_name ? ` — ${celeb.item_name}` : ""}
                  </p>
                )}
              </div>

            </Link>
          );
        })}
      </div>
    </section>
  );
}
