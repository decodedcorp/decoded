"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DomeGallery } from "@/lib/components/dome";

import type { PersonalizeBannerData } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface PersonalizeBannerProps {
  data: PersonalizeBannerData;
  className?: string;
}

/**
 * PersonalizeBanner -- Soft Wall CTA section.
 *
 * Uses DomeGallery (3D sphere gallery) as immersive background.
 * Headline + CTA encourage login through compelling visual experience.
 */
const SNS_NAMES = [
  "Instagram",
  "Facebook",
  "YouTube",
  "TikTok",
  "Pinterest",
  "X",
];

export default function PersonalizeBanner({
  data,
  className,
}: PersonalizeBannerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const snsNames = data.snsNames ?? SNS_NAMES;

  const galleryImages = useMemo(
    () =>
      data.images.map((src, i) => ({ src, alt: `Magazine image ${i + 1}` })),
    [data.images]
  );

  // Slot machine animation -- cycles SNS names vertically
  const animateSlot = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;

    // Slide current name up and fade out
    gsap.to(el, {
      yPercent: -100,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        setCurrentIndex((prev) => (prev + 1) % snsNames.length);
        // Position new name below, then slide up into view
        gsap.set(el, { yPercent: 100, opacity: 0 });
        gsap.to(el, {
          yPercent: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      },
    });
  }, [snsNames.length]);

  // Start slot machine cycling
  useEffect(() => {
    const interval = setInterval(animateSlot, 2000);
    return () => clearInterval(interval);
  }, [animateSlot]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Text entry: fade up
      if (textRef.current) {
        gsap.fromTo(
          textRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // CTA entry: slide up after text
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const handleCtaClick = () => {
    console.log("Soft wall: navigate to /magazine/personal");
  };

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-[80vh] overflow-hidden bg-mag-bg ${className ?? ""}`}
    >
      {/* DomeGallery background -- 3D sphere of images */}
      <div className="absolute inset-0 z-0">
        <DomeGallery
          images={galleryImages}
          grayscale={true}
          overlayBlurColor="#050505"
          segments={25}
          fit={0.6}
          imageBorderRadius="12px"
          dragDampening={1.5}
          autoRotate={true}
          autoRotateSpeed={0.015}
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[6] bg-black/40" />

      {/* Center content: headline + CTA */}
      <div className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4">
        <div ref={textRef} className="text-center opacity-0">
          <h2 className="font-serif text-3xl font-bold leading-tight text-mag-text sm:text-4xl lg:text-5xl">
            당신의{" "}
            <span className="relative inline-block h-[1.2em] w-[5.5em] overflow-hidden align-bottom sm:w-[6em]">
              <span
                ref={slotRef}
                className="absolute inset-0 flex items-center justify-center text-mag-accent"
              >
                {snsNames[currentIndex]}
              </span>
            </span>
            를
            <br />한 권의 잡지로
          </h2>
          {data.subtext && (
            <p className="mx-auto mt-4 max-w-md text-base text-mag-text/60">
              {data.subtext}
            </p>
          )}
        </div>

        <button
          ref={ctaRef}
          onClick={handleCtaClick}
          className="mt-8 rounded-full bg-mag-accent px-8 py-4 font-bold text-mag-bg opacity-0 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_var(--mag-accent)]"
        >
          {data.ctaLabel}
        </button>
      </div>
    </section>
  );
}
