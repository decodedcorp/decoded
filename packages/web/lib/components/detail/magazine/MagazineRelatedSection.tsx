"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { RelatedEditorialItem } from "@/lib/api/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  relatedEditorials: RelatedEditorialItem[];
};

export function MagazineRelatedSection({ relatedEditorials }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelector(".related-content"),
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  if (!relatedEditorials?.length) return null;

  const [featured, ...rest] = relatedEditorials;
  const bgColor = featured.bg_color || "#1f1f1f";

  return (
    <section
      ref={sectionRef}
      className="related-content mx-auto max-w-5xl border-t border-border/50 px-4 py-12 md:px-8 md:py-16"
    >
      <h2 className="typography-h3 mb-2 text-center">Related Editorials</h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        같은 아티스트의 다른 에디토리얼
      </p>

      <div className="space-y-6 md:space-y-8">
        {/* Featured (first) - use <a> for full page nav (avoid modal intercept) */}
        <a
          href={`/posts/${featured.post_id}`}
          className="group/featured relative flex min-h-[32vh] flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-12 transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: bgColor }}
        >
          {featured.image_url && (
            <Image
              src={featured.image_url}
              alt={featured.title || "Related editorial"}
              fill
              className="pointer-events-none object-cover opacity-30"
              sizes="100vw"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {featured.title && (
              <h2 className="typography-h2 max-w-2xl text-white">
                {featured.title}
              </h2>
            )}
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-all group-hover/featured:bg-white group-hover/featured:text-black">
              Read
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </a>

        {/* Rest as grid */}
        {rest.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <a
                key={item.post_id}
                href={`/posts/${item.post_id}`}
                className="group relative flex min-h-[20rem] cursor-pointer flex-col justify-end overflow-hidden rounded-xl p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: item.bg_color || "#1f1f1f",
                }}
              >
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt={item.title || ""}
                    fill
                    className="pointer-events-none object-cover opacity-30 transition-opacity group-hover:opacity-50"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                )}
                <div className="relative z-10">
                  <h3 className="typography-h4 max-w-md text-white line-clamp-2">
                    {item.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/70 group-hover:text-white">
                    Read
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
