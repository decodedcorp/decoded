"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MainCPost } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface MoodboardGridProps {
  images: MainCPost[]; // expects 2 images
}

/** Build a short label from post data: brand or artist or fallback code */
function buildLabel(post: MainCPost, fallback: string): string {
  if (post.brand) return post.brand;
  if (post.artistName) return post.artistName;
  return fallback;
}

export function MoodboardGrid({ images }: MoodboardGridProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal-mood]", {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
      gsap.from("[data-reveal-text]", {
        x: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const [img1, img2] = images;

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 md:px-12 overflow-hidden"
    >
      {/* Background giant text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[30vw] font-black uppercase text-white/[0.02] leading-none">
          CORE
        </span>
      </div>

      <div className="relative grid grid-cols-12 gap-6 items-center">
        {/* Left — typography block */}
        <div className="col-span-12 md:col-span-4" data-reveal-text>
          <p className="text-[9px] font-mono tracking-[0.4em] text-[#eafd67]/50 uppercase mb-4">
            Moodboard / Vol.01
          </p>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-extralight leading-[1.1] text-white/90 mb-6">
            The New
            <br />
            <span className="font-bold italic">Symmetry</span>
          </h2>
          <div className="w-12 h-px bg-[#eafd67]/30 mb-4" />
          <p className="text-[12px] leading-relaxed text-white/35 max-w-[240px]">
            Asymmetry as balance. Deconstruction as form. The tension between
            what is seen and what is sensed.
          </p>
          {/* Show featured brands/artists from moodboard */}
          {images.some((i) => i.brand || i.artistName) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {images.map(
                (img, i) =>
                  (img.brand || img.artistName) && (
                    <span
                      key={i}
                      className="text-[8px] font-mono tracking-[0.2em] text-[#eafd67]/40 uppercase border border-[#eafd67]/15 px-2 py-1"
                    >
                      {img.brand ?? img.artistName}
                    </span>
                  )
              )}
            </div>
          )}
        </div>

        {/* Right — 2 images asymmetric */}
        <div className="col-span-12 md:col-span-7 md:col-start-6 relative">
          <div className="flex gap-6 items-start">
            {/* Image 1 — rotated slightly */}
            {img1 && (
              <div
                className="relative w-[55%] group"
                style={{ transform: "rotate(-2.5deg)" }}
                data-reveal-mood
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={img1.imageUrl}
                    alt={img1.artistName ?? img1.brand ?? "Moodboard 1"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.08] transition-all duration-700"
                  />
                </div>
                <span className="absolute -top-3 -right-3 text-[9px] font-mono tracking-[0.2em] text-[#eafd67]/60 bg-[#080808] px-2 py-1 border border-[#eafd67]/20">
                  {buildLabel(img1, "TS_01")}
                </span>
                {/* Caption below image */}
                <div className="mt-3 space-y-0.5">
                  {img1.artistName && (
                    <p className="text-[10px] font-mono tracking-[0.15em] text-white/40 uppercase">
                      {img1.artistName}
                    </p>
                  )}
                  {img1.productName && (
                    <p className="text-[9px] text-white/25 leading-snug truncate">
                      {img1.productName}
                    </p>
                  )}
                  {img1.itemCount > 0 && (
                    <p className="text-[8px] font-mono text-[#eafd67]/30">
                      {img1.itemCount} item{img1.itemCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Image 2 — offset down, opposite rotation */}
            {img2 && (
              <div
                className="relative w-[45%] mt-16 group"
                style={{ transform: "rotate(3deg)" }}
                data-reveal-mood
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={img2.imageUrl}
                    alt={img2.artistName ?? img2.brand ?? "Moodboard 2"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.08] transition-all duration-700"
                  />
                </div>
                <span className="absolute -bottom-3 -left-3 text-[9px] font-mono tracking-[0.2em] text-[#eafd67]/60 bg-[#080808] px-2 py-1 border border-[#eafd67]/20">
                  {buildLabel(img2, "OBJ_77")}
                </span>
                {/* Caption below image */}
                <div className="mt-3 space-y-0.5">
                  {img2.artistName && (
                    <p className="text-[10px] font-mono tracking-[0.15em] text-white/40 uppercase">
                      {img2.artistName}
                    </p>
                  )}
                  {img2.productName && (
                    <p className="text-[9px] text-white/25 leading-snug truncate">
                      {img2.productName}
                    </p>
                  )}
                  {img2.itemCount > 0 && (
                    <p className="text-[8px] font-mono text-[#eafd67]/30">
                      {img2.itemCount} item{img2.itemCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
