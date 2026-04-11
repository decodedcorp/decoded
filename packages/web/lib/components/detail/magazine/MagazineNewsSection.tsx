"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import type { PostMagazineNewsReference } from "@/lib/api/mutation-types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  newsReferences: PostMagazineNewsReference[];
  accentColor?: string;
  isModal?: boolean;
};

export function MagazineNewsSection({
  newsReferences,
  accentColor,
  isModal,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || isModal) return;

    const cards = gsap.utils.toArray<HTMLElement>(
      sectionRef.current.querySelectorAll(".news-card")
    );

    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: i * 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  });

  if (newsReferences.length === 0) return null;

  // Group by matched_item
  const grouped = new Map<string, PostMagazineNewsReference[]>();
  for (const ref of newsReferences) {
    const key = ref.matched_item || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ref);
  }

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16"
    >
      <h2 className="typography-h3 mb-2 text-center">Related News</h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        News about the items featured in this editorial
      </p>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([itemName, refs]) => (
          <div key={itemName}>
            <div className="mb-4 flex items-center gap-2">
              <div
                className="h-1 w-4 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {itemName}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {refs.map((ref, i) => (
                <a
                  key={`${ref.url}-${i}`}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card group flex gap-3 rounded-lg border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-md"
                >
                  {ref.og_image && (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={ref.og_image}
                        alt={ref.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-foreground/80">
                        {ref.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {ref.summary}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {ref.source}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
