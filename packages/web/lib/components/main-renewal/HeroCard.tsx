"use client";

import { useRef, useEffect, useState } from "react";
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
  const [showSpots, setShowSpots] = useState(false);

  // Entry animation + continuous float + draggable
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Entry
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
      },
    );

    // Continuous float
    const floatY = 6 + (index % 3) * 3;
    const floatDuration = 3.5 + (index % 4) * 0.8;
    floatRef.current = gsap.to(el, {
      y: `+=${floatY}`,
      duration: floatDuration,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: index * 0.3,
    });

    // Draggable
    const [inst] = Draggable.create(el, {
      type: "x,y",
      inertia: false,
      allowEventDefault: false,
      onClick() {
        onToggleFocus(image.id);
      },
      onPress() {
        gsap.set(el, { zIndex: 50 });
        floatRef.current?.kill();
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
        // Only hide spots if it was a drag (not a click)
        if (draggingRef.current) {
          setShowSpots(false);
        }
        draggingRef.current = false;
        const targetZ = isFocused ? 40 : position.zIndex;
        gsap.to(el, { zIndex: targetZ, delay: 0.3 });

        // Restart float after a pause
        const floatY = 6 + (index % 3) * 3;
        const floatDuration = 3.5 + (index % 4) * 0.8;
        floatRef.current = gsap.to(el, {
          y: `+=${floatY}`,
          duration: floatDuration,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.5,
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
      gsap.to(el, {
        opacity: 1,
        filter: "none",
        zIndex: 40,
        duration: 0.4,
        ease: "power2.out",
      });
      // Animate spots in (opacity only — scale animation breaks line positions)
      if (spotRefs.current) {
        const dots = spotRefs.current.querySelectorAll(".spot-marker");
        gsap.fromTo(
          dots,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.3,
            stagger: 0.06,
            ease: "power2.out",
          },
        );
      }
    } else if (isDimmed) {
      gsap.to(el, {
        opacity: 0.3,
        filter: "blur(2px) brightness(0.6)",
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      gsap.to(el, {
        opacity: 1,
        filter: "none",
        zIndex: position.zIndex,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [isFocused, isDimmed, position.zIndex]);

  const isHero = position.tier === "hero";
  const isSmall = position.tier === "small";

  const shadow = isHero
    ? "0 8px 35px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"
    : isSmall
      ? "0 3px 12px rgba(0,0,0,0.5)"
      : "0 5px 22px rgba(0,0,0,0.6)";

  return (
    <div
      ref={cardRef}
      className="absolute cursor-grab active:cursor-grabbing transform-gpu touch-none opacity-0"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: position.zIndex,
        transform: `rotate(${position.rotate}deg)`,
      }}
    >
      {/* Card — relative so spots overlay matches image exactly */}
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
        {/* Image — clipped by rounded corners */}
        <Image
          src={image.imageUrl}
          alt={image.label || ""}
          width={400}
          height={500}
          sizes={
            isHero
              ? "(max-width: 768px) 55vw, 24vw"
              : isSmall
                ? "(max-width: 768px) 25vw, 10vw"
                : "(max-width: 768px) 35vw, 16vw"
          }
          className="w-full h-auto block rounded-2xl pointer-events-none select-none"
          draggable={false}
          priority={priority}
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Spot markers — absolute inset-0 matches this relative container = image area */}
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
