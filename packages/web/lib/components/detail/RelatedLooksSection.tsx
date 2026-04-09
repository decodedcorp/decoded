"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RelatedImage = {
  id: string;
  image_url: string | null;
  image_width?: number | null;
  image_height?: number | null;
};

type Props = {
  images: RelatedImage[];
  displayName: string;
};

/**
 * RelatedLooksSection - Masonry-style 2-column grid of related posts
 *
 * Shows up to 4 images in a masonry layout with alternating heights.
 * Column 1: tall + short
 * Column 2: short + tall
 *
 * Hover: scale-105 + gradient overlay with @displayName
 */
export function RelatedLooksSection({ images, displayName }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  // Take first 4 images
  const visibleImages = images.slice(0, 4);

  // Split into two columns for masonry
  const col1 = visibleImages.filter((_, i) => i % 2 === 0);
  const col2 = visibleImages.filter((_, i) => i % 2 === 1);

  // GSAP stagger reveal
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll(".related-look-card")
      );

      if (cards.length > 0) {
        gsap.from(cards, {
          y: 25,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
          },
        });
      }
    },
    { scope: sectionRef, dependencies: [images.length] }
  );

  return (
    <section ref={sectionRef} className="bg-card p-6 md:p-8">
      {/* Section header */}
      <div className="flex flex-col gap-1.5 mb-4 md:mb-6">
        <span className="font-sans text-[9px] font-semibold uppercase tracking-[3px] text-muted-foreground">
          MORE FROM @{displayName.toUpperCase()}
        </span>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Related Looks
        </h2>
      </div>

      {/* Masonry 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Column 1: tall + short */}
        <div className="flex flex-col gap-3">
          {col1.map((img, index) => (
            <RelatedLookCard
              key={img.id}
              image={img}
              displayName={displayName}
              fallbackHeightClass={index === 0 ? "h-[200px]" : "h-[140px]"}
            />
          ))}
        </div>

        {/* Column 2: short + tall */}
        <div className="flex flex-col gap-3">
          {col2.map((img, index) => (
            <RelatedLookCard
              key={img.id}
              image={img}
              displayName={displayName}
              fallbackHeightClass={index === 0 ? "h-[140px]" : "h-[200px]"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Individual related look card.
 * Uses DB dimensions for aspect ratio when available, falls back to fixed height.
 */
function RelatedLookCard({
  image,
  displayName,
  fallbackHeightClass,
}: {
  image: RelatedImage;
  displayName: string;
  /** Fallback Tailwind height class when DB dimensions are absent */
  fallbackHeightClass: string;
}) {
  const aspectRatio =
    image.image_width && image.image_height
      ? image.image_width / image.image_height
      : undefined;

  return (
    <Link
      href={`/posts/${image.id}`}
      className={`related-look-card block relative rounded-xl overflow-hidden bg-muted group ${aspectRatio ? "" : fallbackHeightClass}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {image.image_url ? (
        <Image
          src={image.image_url}
          alt={`Related look by @${displayName}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 50vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No Image</span>
        </div>
      )}

      {/* Hover overlay with displayName */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-3 left-3 text-white text-sm font-medium">
          @{displayName}
        </div>
      </div>
    </Link>
  );
}
