"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { PostMagazineEditorialSection } from "@/lib/api/mutation-types";
import { useTextLayout } from "@/lib/hooks/usePretext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  editorial: PostMagazineEditorialSection;
  accentColor?: string;
  /** Skip GSAP animations (for drawer/modal context) */
  isModal?: boolean;
};

export function MagazineEditorialSection({ editorial, accentColor, isModal }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(isModal ?? false);

  // Pretext.js: measure pull quote for layout stability
  const { containerRef: quoteRef, height: quoteHeight } = useTextLayout({
    text: editorial.pull_quote ?? "",
    font: 'italic 20px "Playfair Display", serif',
    lineHeight: 28,
  });

  useEffect(() => {
    if (isModal) return; // Skip reveal animation in modal
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => cancelAnimationFrame(t);
  }, [isModal]);

  useGSAP(() => {
    if (!sectionRef.current || isModal) return;

    const paragraphs = sectionRef.current.querySelectorAll(".editorial-p");
    paragraphs.forEach((p) => {
      gsap.fromTo(
        p,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: p,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  }, [isModal]);

  const accentStyle = accentColor
    ? ({ "--magazine-accent": accentColor } as React.CSSProperties)
    : undefined;

  return (
    <section
      ref={sectionRef}
      style={accentStyle}
      className={`mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16 overflow-hidden transition-opacity ${isRevealed ? "animate-ai-summary-reveal" : "opacity-0 invisible"}`}
    >
      <article className="space-y-6 md:space-y-8">
        {editorial.paragraphs.map((text, i) => (
          <p
            key={i}
            className={`editorial-p font-serif text-base leading-loose text-foreground md:text-lg ${
              i === 0
                ? "[&]:first-letter:text-6xl md:[&]:first-letter:text-7xl [&]:first-letter:font-serif [&]:first-letter:font-bold [&]:first-letter:mr-3 [&]:first-letter:float-left [&]:first-letter:text-foreground [&]:first-letter:leading-[0.8] [&]:first-letter:mt-2"
                : ""
            }`}
          >
            {text}
          </p>
        ))}
      </article>

      {editorial.pull_quote && (
        <blockquote
          ref={quoteRef as unknown as React.RefObject<HTMLQuoteElement>}
          className="relative my-10 py-8 md:my-12"
          style={quoteHeight > 0 ? { minHeight: quoteHeight + 64 } : undefined}
        >
          <div
            className="absolute left-0 top-0 h-0.5 w-12"
            style={{
              backgroundColor: accentColor
                ? `${accentColor}4D`
                : "var(--primary-30, hsl(var(--primary) / 0.3))",
            }}
          />
          <p className="font-serif text-xl italic text-foreground md:text-2xl">
            {editorial.pull_quote}
          </p>
          <div
            className="absolute bottom-0 right-0 h-0.5 w-12"
            style={{
              backgroundColor: accentColor
                ? `${accentColor}4D`
                : "var(--primary-30, hsl(var(--primary) / 0.3))",
            }}
          />
        </blockquote>
      )}

      <div className="mt-12 mb-8 flex items-center justify-center gap-4">
        <div className="h-px w-12 bg-border/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-border/40" />
        <div className="h-px w-12 bg-border/40" />
      </div>
    </section>
  );
}
