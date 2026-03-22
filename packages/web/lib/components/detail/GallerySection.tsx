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

type GalleryImage = {
  id: string;
  image_url: string | null;
};

type Props = {
  images: GalleryImage[];
};

/**
 * GallerySection - "More from this Look" image grid
 *
 * Renders a responsive image grid:
 * - Row 1: up to 3 images
 * - Row 2: remaining images (up to 2)
 *
 * Mobile: 140px height images, rounded-lg, gap-3
 * Desktop: 400px/300px height images, rounded-xl, gap-4
 */
export function GallerySection({ images }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Only render if images exist
  if (!images || images.length === 0) return null;

  // Split into rows
  const row1 = images.slice(0, Math.min(3, images.length));
  const row2 = images.length > 3 ? images.slice(3, 5) : [];
  const isSingleRow = images.length <= 3;

  // GSAP stagger fade-in
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const galleryImages = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll(".gallery-img")
      );

      if (galleryImages.length > 0) {
        gsap.from(galleryImages, {
          y: 20,
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
    { scope: sectionRef, dependencies: [images.length] }
  );

  return (
    <section ref={sectionRef} className="bg-card p-6 md:py-12 md:px-16">
      {/* Section header */}
      <div className="flex flex-col gap-1.5 mb-4 md:mb-8">
        <span className="font-sans text-[9px] md:text-[10px] font-semibold uppercase tracking-[3px] text-muted-foreground">
          <span className="md:hidden">MORE FROM THIS LOOK</span>
          <span className="hidden md:inline">PHOTO GALLERY</span>
        </span>
        <h2 className="font-serif text-2xl md:text-[32px] font-bold text-foreground">
          <span className="md:hidden">Gallery</span>
          <span className="hidden md:inline">More from this Look</span>
        </h2>
      </div>

      {/* Image grid */}
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Row 1 */}
        <div
          className={`grid gap-3 md:gap-4 ${
            row1.length === 1
              ? "grid-cols-1"
              : row1.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {row1.map((img) => (
            <GalleryImageCard
              key={img.id}
              image={img}
              heightClass="h-[140px] md:h-[400px]"
            />
          ))}
        </div>

        {/* Row 2 */}
        {row2.length > 0 && (
          <div
            className={`grid gap-3 md:gap-4 ${
              row2.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {row2.map((img) => (
              <GalleryImageCard
                key={img.id}
                image={img}
                heightClass="h-[140px] md:h-[300px]"
              />
            ))}
          </div>
        )}

        {/* If 3 or fewer, and we want a second row with remainder */}
        {isSingleRow && images.length === 2 && null}
      </div>
    </section>
  );
}

/**
 * Individual gallery image card
 */
function GalleryImageCard({
  image,
  heightClass,
}: {
  image: GalleryImage;
  heightClass: string;
}) {
  const content = (
    <div
      className={`gallery-img relative ${heightClass} rounded-lg md:rounded-xl overflow-hidden bg-muted group`}
    >
      {image.image_url ? (
        <Image
          src={image.image_url}
          alt={`Gallery image ${image.id}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No Image</span>
        </div>
      )}
    </div>
  );

  if (image.id) {
    return (
      <Link href={`/posts/${image.id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
