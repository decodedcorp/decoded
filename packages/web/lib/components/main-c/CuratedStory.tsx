"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MainCPost } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface CuratedStoryProps {
  images: MainCPost[]; // expects up to 4 images
}

/** Image caption block — shows artist, brand, product, item count */
function ImageCaption({ post }: { post: MainCPost }) {
  const hasInfo = post.artistName || post.brand || post.productName;
  if (!hasInfo) return null;

  return (
    <div className="mt-3 space-y-0.5">
      {post.artistName && (
        <p className="text-[10px] font-mono tracking-[0.15em] text-white/40 uppercase">
          {post.artistName}
        </p>
      )}
      {post.brand && (
        <p className="text-[9px] font-mono tracking-[0.1em] text-white/25 uppercase">
          {post.brand}
          {post.productName && (
            <span className="text-white/15"> — {post.productName}</span>
          )}
        </p>
      )}
      {!post.brand && post.productName && (
        <p className="text-[9px] text-white/25 leading-snug truncate">
          {post.productName}
        </p>
      )}
      {post.itemCount > 0 && (
        <p className="text-[8px] font-mono text-[#eafd67]/30 mt-1">
          {post.itemCount} item{post.itemCount > 1 ? "s" : ""} decoded
        </p>
      )}
    </div>
  );
}

export function CuratedStory({ images }: CuratedStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal-story]").forEach((el) => {
        gsap.from(el, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const [feat, pair1, pair2, portrait] = images;

  // Collect unique brands/artists for the sidebar summary
  const featuredNames = images
    .map((i) => i.artistName ?? i.brand)
    .filter((n): n is string => n !== null);
  const uniqueNames = [...new Set(featuredNames)].slice(0, 3);

  return (
    <section ref={sectionRef} className="relative py-24 px-6 md:px-12">
      <div className="grid grid-cols-12 gap-6">
        {/* Left — sticky sidebar */}
        <div className="col-span-12 md:col-span-4">
          <div className="md:sticky md:top-24">
            <p className="text-[9px] font-mono tracking-[0.4em] text-[#eafd67]/50 uppercase mb-6">
              Curated / Story
            </p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extralight leading-[1.2] text-white/90 mb-8">
              Beyond the
              <br />
              <span className="font-bold">Surface</span>
            </h2>
            <blockquote className="border-l-2 border-[#eafd67]/30 pl-4 mb-8">
              <p className="text-[12px] italic text-white/40 leading-relaxed">
                &ldquo;Style is a way of saying who you are without having to
                speak.&rdquo;
              </p>
            </blockquote>
            <p className="text-[11px] leading-relaxed text-white/30 max-w-[260px]">
              Each piece in this collection tells a story of intentional design
              — where craftsmanship meets cultural expression. Curated through
              the DECODED editorial lens.
            </p>

            {/* Featured names summary */}
            {uniqueNames.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[8px] font-mono tracking-[0.3em] text-white/20 uppercase mb-3">
                  Featuring
                </p>
                <div className="space-y-1.5">
                  {uniqueNames.map((name) => (
                    <p
                      key={name}
                      className="text-[11px] font-mono tracking-[0.1em] text-[#eafd67]/40 uppercase"
                    >
                      {name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Total items stat */}
            {images.some((i) => i.itemCount > 0) && (
              <div className="mt-6">
                <p className="text-[9px] font-mono tracking-[0.2em] text-white/15 uppercase">
                  {images.reduce((sum, i) => sum + i.itemCount, 0)} items across{" "}
                  {images.length} looks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — gallery */}
        <div className="col-span-12 md:col-span-7 md:col-start-6 space-y-12">
          {/* Feature image — 3:4 */}
          {feat && (
            <div className="group" data-reveal-story>
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={feat.imageUrl}
                  alt={feat.artistName ?? feat.brand ?? "Featured"}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.05] transition-all duration-700"
                />
                {/* Hover overlay with info */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-[11px] font-mono tracking-[0.15em] text-white/80 uppercase">
                    {feat.artistName ?? feat.brand ?? "Featured Look"}
                  </p>
                  {feat.productName && (
                    <p className="text-[9px] text-white/50 mt-0.5">
                      {feat.productName}
                    </p>
                  )}
                </div>
              </div>
              <ImageCaption post={feat} />
            </div>
          )}

          {/* Asymmetric pair — square image + neon text block */}
          <div className="grid grid-cols-2 gap-4" data-reveal-story>
            {pair1 && (
              <div className="group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={pair1.imageUrl}
                    alt={pair1.artistName ?? pair1.brand ?? "Pair 1"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.08] transition-all duration-700"
                  />
                </div>
                <ImageCaption post={pair1} />
              </div>
            )}
            <div className="flex items-center justify-center bg-[#eafd67]/[0.04] border border-[#eafd67]/10 p-6">
              <div className="text-center">
                <p className="text-[clamp(1.2rem,2.5vw,2rem)] font-black text-[#eafd67]/20 uppercase leading-tight">
                  EDIT
                  <br />
                  ORIAL
                </p>
                <p className="mt-2 text-[9px] font-mono tracking-[0.3em] text-[#eafd67]/40">
                  2026 — SS
                </p>
                {pair1?.brand && (
                  <p className="mt-3 text-[8px] font-mono tracking-[0.2em] text-[#eafd67]/25 uppercase">
                    {pair1.brand}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Second pair — reversed */}
          {pair2 && (
            <div className="grid grid-cols-2 gap-4" data-reveal-story>
              <div className="flex flex-col justify-end p-6">
                <p className="text-[11px] leading-relaxed text-white/25 mb-4">
                  Texture, tone, and tension — the quiet details that define a
                  collection&apos;s character.
                </p>
                {pair2.brand && (
                  <p className="text-[10px] font-mono tracking-[0.15em] text-[#eafd67]/35 uppercase">
                    {pair2.brand}
                  </p>
                )}
                {pair2.productName && (
                  <p className="text-[9px] text-white/20 mt-1 truncate">
                    {pair2.productName}
                  </p>
                )}
              </div>
              <div className="group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={pair2.imageUrl}
                    alt={pair2.artistName ?? pair2.brand ?? "Pair 2"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.08] transition-all duration-700"
                  />
                </div>
                <ImageCaption post={pair2} />
              </div>
            </div>
          )}

          {/* Portrait with neon-lime border accent */}
          {portrait && (
            <div className="relative" data-reveal-story>
              <div className="absolute -left-3 top-8 bottom-8 w-px bg-[#eafd67]/40" />
              <div className="group">
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={portrait.imageUrl}
                    alt={portrait.artistName ?? portrait.brand ?? "Portrait"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[11px] font-mono tracking-[0.15em] text-white/80 uppercase">
                      {portrait.artistName ?? portrait.brand ?? "Portrait"}
                    </p>
                  </div>
                </div>
                <ImageCaption post={portrait} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
