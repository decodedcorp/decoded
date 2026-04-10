"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import DecodedLogo from "../DecodedLogo";

interface HeroCoverProps {
  onRevealed: () => void;
}

/**
 * HeroCover — Branded intro with neon ASCII-style logo.
 *
 * Uses CSS-based logo (no Three.js) for instant rendering.
 * Cover splits open → hero images fly in simultaneously.
 */
export function HeroCover({ onRevealed }: HeroCoverProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const topHalfRef = useRef<HTMLDivElement>(null);
  const bottomHalfRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    tlRef.current?.kill();

    // Trigger hero images immediately
    onRevealed();

    const tl = gsap.timeline();

    // Fade center content fast
    const center = [logoRef, accentRef, taglineRef, lineRef];
    center.forEach((ref) => {
      if (ref.current) gsap.to(ref.current, { autoAlpha: 0, duration: 0.2 });
    });

    // Split cover
    if (topHalfRef.current) {
      tl.to(
        topHalfRef.current,
        { y: "-100%", duration: 0.7, ease: "power4.inOut" },
        0
      );
    }
    if (bottomHalfRef.current) {
      tl.to(
        bottomHalfRef.current,
        { y: "100%", duration: 0.7, ease: "power4.inOut" },
        0
      );
    }
  };

  useEffect(() => {
    const logo = logoRef.current;
    const accent = accentRef.current;
    const tagline = taglineRef.current;
    const line = lineRef.current;
    if (!logo || !accent || !tagline || !line) return;

    const tl = gsap.timeline({ onComplete: reveal });
    tlRef.current = tl;

    // 1. Logo glitch in
    tl.fromTo(
      logo,
      { autoAlpha: 0, scale: 0.9 },
      { autoAlpha: 1, scale: 1, duration: 0.1, ease: "none" },
      "+=0.3"
    );
    // Glitch flicker
    tl.to(logo, {
      keyframes: [
        { x: -4, skewX: 8, duration: 0.04 },
        { x: 5, skewX: -5, duration: 0.04 },
        { x: -2, skewX: 3, duration: 0.04 },
        { x: 0, skewX: 0, duration: 0.08 },
      ],
    });
    tl.fromTo(
      logo,
      { scale: 1.03 },
      { scale: 1, duration: 0.4, ease: "power2.out" }
    );

    // 2. Accent line
    tl.fromTo(
      accent,
      { autoAlpha: 0, scaleX: 0 },
      { autoAlpha: 1, scaleX: 1, duration: 0.4, ease: "power3.out" },
      "-=0.15"
    );

    // 3. Tagline
    tl.fromTo(
      tagline,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
      "-=0.1"
    );

    // 4. Neon line
    tl.fromTo(
      line,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.4, ease: "power3.out" },
      "-=0.1"
    );

    // 5. Hold + reveal
    tl.to({}, { duration: 0.5 });
    tl.call(() => reveal());

    return () => {
      tl.kill();
    };
  }, []);

  if (revealed) return null;

  return (
    <div
      ref={coverRef}
      className="absolute inset-0 z-[100] cursor-pointer"
      onClick={reveal}
      onTouchStart={reveal}
    >
      {/* Top half */}
      <div
        ref={topHalfRef}
        className="absolute inset-x-0 top-0 h-1/2 bg-[#050505]"
      />
      {/* Bottom half */}
      <div
        ref={bottomHalfRef}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[#050505]"
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Logo — Three.js ASCII art, matches brand */}
        <div
          ref={logoRef}
          className="invisible relative w-[320px] h-[80px] sm:w-[400px] sm:h-[100px] md:w-[600px] md:h-[140px] lg:w-[800px] lg:h-[180px]"
        >
          <DecodedLogo
            asciiFontSize={6}
            textFontSize={300}
            planeBaseHeight={16}
            enableWaves={false}
            enableHueRotate={true}
          />
        </div>

        {/* Neon accent line */}
        <div
          ref={accentRef}
          className="invisible w-[200px] md:w-[350px] h-[2px] mt-5 origin-center"
          style={{
            background:
              "linear-gradient(90deg, transparent, #eafd67, transparent)",
            boxShadow:
              "0 0 20px rgba(234,253,103,0.4), 0 0 60px rgba(234,253,103,0.15)",
          }}
        />

        {/* Tagline */}
        <div
          ref={taglineRef}
          className="invisible mt-4 text-center"
          style={{ paddingLeft: "0.15em" }}
        >
          <p
            className="text-xs md:text-sm text-white/40 tracking-[0.15em] uppercase font-light"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Discover fashion in every frame
          </p>
        </div>

        {/* Expanding neon line */}
        <div
          ref={lineRef}
          className="mt-4 w-[120px] md:w-[200px] h-[1px] origin-center"
          style={{
            background: "#eafd67",
            boxShadow: "0 0 8px rgba(234,253,103,0.5)",
            transform: "scaleX(0)",
          }}
        />
      </div>

      {/* Skip hint */}
      <p
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/15 tracking-[0.15em] uppercase pointer-events-none"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        tap to explore
      </p>
    </div>
  );
}
