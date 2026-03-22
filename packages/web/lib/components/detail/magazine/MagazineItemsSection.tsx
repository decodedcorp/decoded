"use client";

import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type {
  PostMagazineSpotItem,
  PostMagazineRelatedItem,
} from "@/lib/api/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  items: PostMagazineSpotItem[];
  relatedItems?: PostMagazineRelatedItem[];
  accentColor?: string;
};

export function MagazineItemsSection({
  items,
  relatedItems = [],
  accentColor,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

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

  useGSAP(() => {
    if (!sectionRef.current) return;

    const cards = gsap.utils.toArray<HTMLElement>(
      sectionRef.current.querySelectorAll(".item-card")
    );

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
  });

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
          const meta = item.metadata as {
            price?: string;
            sub_category?: string;
            material?: string[];
          } | undefined;
          const price = meta?.price;
          const spotRelated = relatedBySpot.get(item.spot_id) ?? [];

          return (
            <div key={item.spot_id} className="item-card">
              <div
                className={`flex flex-col gap-6 md:flex-row md:gap-10 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Item Image */}
                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-72 lg:w-80">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  ) : (
                    <div
                      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
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
                  <h3 className="typography-h4 mb-2">{item.title}</h3>
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
                <div className="mt-6 ml-0 md:ml-[calc(18rem+2.5rem)] lg:ml-[calc(20rem+2.5rem)]">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Similar Items
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {spotRelated.slice(0, 3).map((ri, j) => (
                      <a
                        key={`${ri.title}-${j}`}
                        href={ri.original_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-border hover:shadow-md"
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-muted">
                          {ri.image_url ? (
                            <Image
                              src={ri.image_url}
                              alt={ri.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, 160px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="text-2xl text-muted-foreground/20">
                                {(j + 1).toString().padStart(2, "0")}
                              </span>
                            </div>
                          )}
                          <div
                            className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm"
                            style={{
                              backgroundColor:
                                ri.source === "external"
                                  ? accentColor
                                    ? `${accentColor}80`
                                    : "hsl(var(--primary) / 0.5)"
                                  : "hsl(var(--muted) / 0.8)",
                              color:
                                ri.source === "external"
                                  ? "white"
                                  : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {ri.source === "external" ? "External" : "Internal"}
                          </div>
                        </div>
                        <div className="p-2">
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
