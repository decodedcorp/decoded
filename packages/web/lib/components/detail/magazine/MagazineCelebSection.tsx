"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import type { PostMagazineCelebWithItem } from "@/lib/api/mutation-types";

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
    <section ref={sectionRef} className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      <h2 className="typography-h3 mb-2 text-center">Style Archive</h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        같은 아이템을 착용한 셀럽들
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {celebs.map((celeb, i) => (
          <Link
            key={`${celeb.celeb_name}-${i}`}
            href={`/posts/${celeb.post_id}`}
            className="celeb-card group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg"
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
              <p className="font-serif text-sm font-semibold text-white">
                {celeb.celeb_name}
              </p>
              {celeb.item_brand && (
                <p className="mt-0.5 text-xs text-white/70">
                  {celeb.item_brand}
                  {celeb.item_name ? ` — ${celeb.item_name}` : ""}
                </p>
              )}
            </div>

            <div
              className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              style={{
                backgroundColor: accentColor
                  ? `${accentColor}80`
                  : "hsl(var(--primary) / 0.5)",
              }}
            >
              View Post
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
