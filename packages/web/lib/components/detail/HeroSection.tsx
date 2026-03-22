"use client";

import type { ImageRow } from "@/lib/supabase/types";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  image: ImageRow;
  isModal?: boolean;
  onClick?: () => void;
};

/**
 * Hero Section - The Hook
 *
 * Full-screen hero image with dramatic typography and entrance animations.
 * Features parallax effect on scroll for deep spatial feel.
 */
export function HeroSection({ image, isModal = false, onClick }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!heroRef.current || !imageRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      // Entrance Ken Burns
      gsap.fromTo(
        imageRef.current,
        { scale: 1.15 },
        {
          scale: 1.0,
          duration: 2,
          ease: "power2.out",
        }
      );

      // Title reveal
      gsap.fromTo(
        titleRef.current,
        { y: "60%", opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.5,
          delay: 0.5,
          ease: "expo.out",
        }
      );

      // Enhanced scroll animations
      if (!isModal) {
        // Hero image parallax (moves slower than scroll)
        gsap.to(imageRef.current, {
          y: 100,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Title fade-out as user scrolls past
        gsap.to(titleRef.current, {
          opacity: 0,
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "30% top",
            scrub: true,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [isModal]);

  return (
    <div
      ref={heroRef}
      className={`relative w-full overflow-hidden ${
        isModal
          ? "h-[45vh] min-h-[250px]"
          : "h-[426px] md:h-[60vh] md:max-h-[600px]"
      }`}
    >
      {image.image_url && (
        <img
          id={`hero-image-${image.id}`}
          ref={imageRef}
          src={image.image_url}
          alt={`Image ${image.id}`}
          className={`h-full w-full object-cover will-change-transform ${
            onClick ? "cursor-pointer" : ""
          }`}
          loading="eager"
          onClick={onClick}
          aria-label={onClick ? "View fullscreen" : undefined}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Hero Title */}
      <div
        className={`absolute inset-0 flex items-end justify-center px-4 ${isModal ? "pb-8" : "pb-20"}`}
      >
        <div ref={titleRef} className="overflow-hidden">
          <h1
            className={`font-serif font-bold text-white tracking-tight ${
              isModal
                ? "text-4xl md:text-5xl"
                : "text-5xl md:text-6xl lg:text-7xl"
            }`}
          >
            Editorial
          </h1>
        </div>
      </div>
    </div>
  );
}
