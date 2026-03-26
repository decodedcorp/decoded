"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

import type { FloatingHeroImage, ScatterPosition } from "./types";
import { HeroSpotMarker } from "./HeroSpotMarker";

gsap.registerPlugin(Draggable);

interface HeroCardProps {
  image: FloatingHeroImage;
  position: ScatterPosition;
  index: number;
  isFocused: boolean;
  isDimmed: boolean;
  onToggleFocus: (id: string) => void;
  priority?: boolean;
}

export function HeroCard({
  image,
  position,
  index,
  isFocused,
  isDimmed,
  onToggleFocus,
  priority = false,
}: HeroCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<gsap.core.Tween | null>(null);
  const spotRefs = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const wasFocusedRef = useRef(false);
  const preFocusPosRef = useRef({ x: 0, y: 0 });
  const [showSpots, setShowSpots] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Stable callback for draggable onClick
  const onToggleFocusRef = useRef(onToggleFocus);
  onToggleFocusRef.current = onToggleFocus;

  // Start float animation from current position
  const startFloat = useCallback((el: HTMLElement) => {
    const floatY = 6 + (index % 3) * 3;
    const floatDuration = 3.5 + (index % 4) * 0.8;
    floatRef.current = gsap.to(el, {
      y: `+=${floatY}`,
      duration: floatDuration,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0.3,
    });
  }, [index]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Entry animation
    gsap.fromTo(
      el,
      { opacity: 0, y: 40, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.0,
        delay: 0.2 + index * 0.1,
        ease: "power3.out",
        onComplete: () => startFloat(el),
      },
    );

    // Draggable
    const [inst] = Draggable.create(el, {
      type: "x,y",
      inertia: false,
      allowEventDefault: false,
      onClick() {
        if (animatingRef.current) return; // Block during animation
        onToggleFocusRef.current(image.id);
      },
      onPress() {
        gsap.set(el, { zIndex: 50 });
        // Pause float instead of killing it
        floatRef.current?.pause();
        draggingRef.current = false;
        setShowSpots(true);
      },
      onDrag(this: Draggable) {
        draggingRef.current = true;
        const rot = gsap.utils.clamp(-25, 25, this.deltaX * 0.4);
        gsap.to(el, { rotation: rot, duration: 0.1, ease: "power1.out" });
      },
      onDragEnd() {
        gsap.to(el, {
          rotation: position.rotate,
          duration: 0.5,
          ease: "elastic.out(1,0.5)",
        });
      },
      onRelease() {
        if (draggingRef.current) {
          setShowSpots(false);
        }
        draggingRef.current = false;
        const targetZ = 40;
        gsap.to(el, {
          zIndex: targetZ,
          delay: 0.3,
          onComplete: () => {
            // Resume float from current position after interaction
            if (!wasFocusedRef.current) {
              floatRef.current?.kill();
              startFloat(el);
            }
          },
        });
      },
    });

    return () => {
      inst.kill();
      floatRef.current?.kill();
      gsap.killTweensOf(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync showSpots with focus — hide when card returns to normal
  useEffect(() => {
    if (!isFocused && !isDimmed) {
      const t = setTimeout(() => setShowSpots(false), 400);
      return () => clearTimeout(t);
    }
  }, [isFocused, isDimmed]);

  // Focus/dim state changes
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (isFocused) {
      wasFocusedRef.current = true;
      animatingRef.current = true;
      floatRef.current?.kill();

      // Save current position before centering
      preFocusPosRef.current = {
        x: gsap.getProperty(el, "x") as number,
        y: gsap.getProperty(el, "y") as number,
      };

      // Move card to center, clamped within hero bounds
      const parent = el.parentElement;
      if (parent) {
        const scale = 1.2;
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scaledW = elRect.width * scale;
        const scaledH = elRect.height * scale;
        const margin = 20;
        let targetX = parentRect.width / 2 - elRect.width / 2 - el.offsetLeft;
        let targetY = parentRect.height / 2 - elRect.height / 2 - el.offsetTop;
        const scaledLeft = el.offsetLeft + targetX - (scaledW - elRect.width) / 2;
        const scaledTop = el.offsetTop + targetY - (scaledH - elRect.height) / 2;
        if (scaledLeft < margin) targetX += margin - scaledLeft;
        if (scaledTop < margin) targetY += margin - scaledTop;
        if (scaledLeft + scaledW > parentRect.width - margin)
          targetX -= scaledLeft + scaledW - (parentRect.width - margin);
        if (scaledTop + scaledH > parentRect.height - margin)
          targetY -= scaledTop + scaledH - (parentRect.height - margin);

        gsap.to(el, {
          x: targetX,
          y: targetY,
          opacity: 1,
          filter: "none",
          zIndex: 40,
          scale,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => { animatingRef.current = false; },
        });
      }

      // Animate spots in
      if (spotRefs.current) {
        const dots = spotRefs.current.querySelectorAll(".spot-marker");
        gsap.fromTo(
          dots,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, stagger: 0.06, ease: "power2.out" },
        );
      }
    } else if (isDimmed) {
      // No per-card blur — handled by MainHero backdrop-filter
      gsap.to(el, {
        opacity: 0.2,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      // Restore
      animatingRef.current = true;
      const anim: gsap.TweenVars = {
        opacity: 1,
        filter: "none",
        scale: 1,
        zIndex: position.zIndex,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          animatingRef.current = false;
          // Restart float after returning to position
          if (wasFocusedRef.current) {
            wasFocusedRef.current = false;
          }
          startFloat(el);
        },
      };
      // Return to pre-focus position (drag position, not scatter origin)
      if (wasFocusedRef.current) {
        anim.x = preFocusPosRef.current.x;
        anim.y = preFocusPosRef.current.y;
      }
      gsap.to(el, anim);
    }
  }, [isFocused, isDimmed, position.zIndex, startFloat]);

  const isHero = position.tier === "hero";
  const isSmall = position.tier === "small";

  const shadow = isHero
    ? "0 8px 35px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"
    : isSmall
      ? "0 3px 12px rgba(0,0,0,0.5)"
      : "0 5px 22px rgba(0,0,0,0.6)";

  if (hidden) return null;

  return (
    <div
      ref={cardRef}
      className="absolute cursor-grab active:cursor-grabbing transform-gpu touch-none opacity-0 will-change-transform"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: position.zIndex,
        transform: `rotate(${position.rotate}deg)`,
      }}
      tabIndex={0}
      role="button"
      aria-label={image.label || "Hero image"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!animatingRef.current) onToggleFocus(image.id);
        }
      }}
    >
      {/* Card */}
      <div
        className="relative rounded-2xl"
        style={{
          border: (isFocused || showSpots)
            ? "1.5px solid rgba(234,253,103,0.5)"
            : "1px solid rgba(255,255,255,0.12)",
          boxShadow: (isFocused || showSpots)
            ? `${shadow}, 0 0 24px rgba(234,253,103,0.2)`
            : shadow,
        }}
      >
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: position.aspectRatio }}>
          <Image
            src={image.imageUrl}
            alt={image.label || ""}
            fill
            sizes={
              isHero
                ? "(max-width: 768px) 55vw, 24vw"
                : isSmall
                  ? "(max-width: 768px) 25vw, 10vw"
                  : "(max-width: 768px) 35vw, 16vw"
            }
            className="object-cover pointer-events-none select-none"
            draggable={false}
            priority={priority}
            onLoad={(e) => {
              const img = e.currentTarget;
              const ratio = img.naturalHeight / img.naturalWidth;
              if (ratio > 1.8 || ratio < 0.4) setHidden(true);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Spot markers */}
        {(isFocused || showSpots) && image.spots && image.spots.length > 0 && (
          <div ref={spotRefs} className="absolute inset-0 pointer-events-none">
            {image.spots.map((spot) => (
              <div key={spot.id} className="spot-marker pointer-events-auto">
                <HeroSpotMarker spot={spot} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
