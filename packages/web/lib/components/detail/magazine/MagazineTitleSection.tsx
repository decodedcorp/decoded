"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTextLayout } from "@/lib/hooks/usePretext";

type Props = {
  title: string;
  subtitle: string | null;
  /** Skip GSAP animations (for drawer/modal context) */
  isModal?: boolean;
};

export function MagazineTitleSection({ title, subtitle, isModal }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Pretext.js: measure title height for CLS prevention and animation offset
  const { containerRef: titleRef, height: titleHeight } = useTextLayout({
    text: title,
    font: '700 clamp(2rem, 5vw, 3.5rem) "Playfair Display", serif',
    lineHeight: 1.1 * 56, // approximate hero font size * line-height
  });

  useGSAP(() => {
    if (!sectionRef.current || isModal) return;

    // Use measured title height for animation offset (fallback to 40px)
    const titleOffset = titleHeight > 0 ? Math.min(titleHeight * 0.5, 60) : 40;

    const tl = gsap.timeline();
    tl.fromTo(
      sectionRef.current.querySelector(".mag-overline"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    )
      .fromTo(
        sectionRef.current.querySelector(".mag-title"),
        { y: titleOffset, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        sectionRef.current.querySelector(".mag-subtitle"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
  }, [titleHeight, isModal]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[25vh] flex-col items-center justify-center px-6 pt-16 pb-4 text-center md:pt-20 md:pb-6"
    >
      <p
        className={`mag-overline typography-overline mb-6 text-muted-foreground ${isModal ? "" : "opacity-0"}`}
      >
        Editorial
      </p>
      <h1
        ref={titleRef as React.RefObject<HTMLHeadingElement>}
        className={`mag-title ${isModal ? "typography-h2" : "typography-h1"} max-w-3xl break-keep ${isModal ? "" : "opacity-0"}`}
        style={titleHeight > 0 ? { minHeight: titleHeight } : undefined}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className={`mag-subtitle mt-6 max-w-xl text-lg font-light leading-relaxed text-muted-foreground break-keep ${isModal ? "" : "opacity-0"}`}
        >
          {subtitle}
        </p>
      )}
      <div className="mt-12 flex items-center gap-4">
        <div className="h-px w-12 bg-border/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-border/40" />
        <div className="h-px w-12 bg-border/40" />
      </div>
    </section>
  );
}
