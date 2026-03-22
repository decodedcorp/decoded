"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MainCPost } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface EditorialHeroProps {
  mainImage: MainCPost;
  detailImage?: MainCPost;
}

export function EditorialHero({ mainImage, detailImage }: EditorialHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal-up]", {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const displayName =
    mainImage.artistName ?? mainImage.brand ?? "Unknown Artist";

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen grid grid-cols-12 gap-4 px-6 md:px-12 pt-24 pb-16 overflow-hidden"
    >
      {/* Left subtitle block — col 1-4 */}
      <div
        className="col-span-12 md:col-span-4 flex flex-col justify-end pb-12 z-10"
        data-reveal-up
      >
        <p className="text-[11px] font-mono tracking-[0.3em] text-white/40 uppercase mb-3">
          Issue N° {new Date().getFullYear()}.
          {String(new Date().getMonth() + 1).padStart(2, "0")}
        </p>
        <h2 className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-extralight leading-[1.3] text-white/80 mb-4">
          {displayName}
        </h2>
        <p className="text-[13px] leading-relaxed text-white/50 max-w-[280px] mb-3">
          A curated lens on fashion&apos;s boldest expressions — where editorial
          vision meets street culture.
        </p>
        {mainImage.brand && (
          <p className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase mb-1">
            {mainImage.brand}
            {mainImage.productName && (
              <span className="text-white/20"> / {mainImage.productName}</span>
            )}
          </p>
        )}
        {mainImage.itemCount > 0 && (
          <p className="text-[9px] font-mono tracking-[0.2em] text-[#eafd67]/50 uppercase mt-2">
            {mainImage.itemCount} item{mainImage.itemCount > 1 ? "s" : ""}{" "}
            detected
          </p>
        )}
        {mainImage.artistName && (
          <p className="mt-3 text-[11px] font-mono tracking-[0.2em] text-[#eafd67]/70 uppercase">
            feat. {mainImage.artistName}
          </p>
        )}
      </div>

      {/* Center — giant typography */}
      <div className="col-span-12 absolute inset-0 flex items-center justify-center pointer-events-none select-none z-[1]">
        <div className="text-center" data-reveal-up>
          <h1 className="text-[14vw] md:text-[12vw] font-black uppercase leading-[0.85] tracking-[-0.03em] text-white/[0.06]">
            DECO
            <span className="italic text-[#eafd67]/[0.12]">DED</span>
          </h1>
          <p
            className="text-[6vw] md:text-[5vw] font-extralight uppercase tracking-[0.4em] text-white/[0.04]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.06)" }}
          >
            FA_SHION
          </p>
        </div>
      </div>

      {/* Right — main image col 6-12 */}
      <div
        className="col-span-12 md:col-span-6 md:col-start-7 relative z-10"
        data-reveal-up
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={mainImage.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-[1.03]"
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#080808] to-transparent" />
          {/* Image caption overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <p className="text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase">
              {displayName}
            </p>
          </div>
        </div>

        {/* Floating detail image */}
        {detailImage && (
          <div
            className="absolute -bottom-8 -left-12 w-[35%] z-20"
            data-reveal-up
          >
            <div className="aspect-square overflow-hidden border border-white/10">
              <img
                src={detailImage.imageUrl}
                alt={detailImage.artistName ?? detailImage.brand ?? "Detail"}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="mt-2">
              <p className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
                {detailImage.artistName ?? detailImage.brand ?? "Detail_01"}
              </p>
              {detailImage.brand && detailImage.artistName && (
                <p className="text-[8px] font-mono tracking-[0.15em] text-white/20 uppercase">
                  {detailImage.brand}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="col-span-12 absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[9px] font-mono tracking-[0.3em] text-white/20 uppercase">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
