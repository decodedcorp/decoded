"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Props = {
  title: string;
  subtitle: string | null;
};

export function MagazineTitleSection({ title, subtitle }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const tl = gsap.timeline();
    tl.fromTo(
      sectionRef.current.querySelector(".mag-overline"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    )
      .fromTo(
        sectionRef.current.querySelector(".mag-title"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        sectionRef.current.querySelector(".mag-subtitle"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
  });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[25vh] flex-col items-center justify-center px-6 pt-16 pb-4 text-center md:pt-20 md:pb-6"
    >
      <p className="mag-overline typography-overline mb-6 text-muted-foreground opacity-0">
        Editorial
      </p>
      <h1 className="mag-title typography-hero max-w-3xl opacity-0">{title}</h1>
      {subtitle && (
        <p className="mag-subtitle mt-6 max-w-xl text-lg font-light leading-relaxed text-muted-foreground opacity-0">
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
