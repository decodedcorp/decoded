"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

import type { FloatingHeroImage } from "./types";
import type { ScatterResult } from "./scatter";
import { HeroSpotMarker } from "./HeroSpotMarker";

gsap.registerPlugin(Draggable);

interface HeroCardProps {
  image: FloatingHeroImage;
  position: ScatterResult;
  index: number;
  isFocused: boolean;
  isDimmed: boolean;
  onToggleFocus: (id: string) => void;
  bumpZ: () => number;
  coverDone: boolean;
  priority?: boolean;
}

export function HeroCard({
  image,
  position,
  index,
  isFocused,
  isDimmed,
  onToggleFocus,
  bumpZ,
  coverDone,
  priority = false,
}: HeroCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<gsap.core.Tween | null>(null);
  const spotRefs = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const wasFocusedRef = useRef(false);
  const preFocusPosRef = useRef({ x: 0, y: 0 });
  const currentZRef = useRef(position.zIndex);
  const imageLoadedRef = useRef(false);
  const [showSpots, setShowSpots] = useState(false);

  const onToggleFocusRef = useRef(onToggleFocus);
  onToggleFocusRef.current = onToggleFocus;

  const { interactive, floatAmplitude, floatSpeed } = position;

  const startFloat = useCallback(
    (el: HTMLElement) => {
      floatRef.current = gsap.to(el, {
        y: `+=${floatAmplitude}`,
        duration: floatSpeed + (index % 4) * 0.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });
    },
    [index, floatAmplitude, floatSpeed]
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Entry animation handled by coverDone + imageLoaded effect below

    // Only add draggable for interactive cards
    if (!interactive) return;

    const [inst] = Draggable.create(el, {
      type: "x,y",
      inertia: false,
      allowEventDefault: false,
      onClick() {
        if (animatingRef.current) return;
        onToggleFocusRef.current(image.id);
      },
      onPress() {
        const newZ = bumpZ();
        currentZRef.current = newZ;
        gsap.set(el, { zIndex: newZ });
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
        if (draggingRef.current) setShowSpots(false);
        draggingRef.current = false;
        // Keep the bumped z-index — most recently interacted card stays on top
        setTimeout(() => {
          if (wasFocusedRef.current) return;
          gsap.set(el, { zIndex: currentZRef.current });
          floatRef.current?.kill();
          startFloat(el);
        }, 300);
      },
    });

    return () => {
      inst.kill();
      floatRef.current?.kill();
      gsap.killTweensOf(el);
    };
  }, []);

  // Entry animation — triggered when cover is done AND image is loaded
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !coverDone || !imageLoadedRef.current) return;

    // Random direction from outside viewport
    const directions = [
      { x: -window.innerWidth * 0.5, y: 0 }, // from left
      { x: window.innerWidth * 0.5, y: 0 }, // from right
      { x: 0, y: -window.innerHeight * 0.5 }, // from top
      { x: 0, y: window.innerHeight * 0.5 }, // from bottom
    ];
    const dir = directions[index % 4];
    const delay = index * 0.01; // Nearly simultaneous burst

    gsap.fromTo(
      el,
      {
        autoAlpha: 0,
        x: dir.x + (Math.random() - 0.5) * 150,
        y: dir.y + (Math.random() - 0.5) * 150,
        scale: 0.4,
        rotation: position.rotate + (Math.random() - 0.5) * 30,
      },
      {
        autoAlpha: position.initialOpacity,
        x: 0,
        y: 0,
        scale: 1,
        rotation: position.rotate,
        duration: 0.5 + Math.random() * 0.2,
        delay,
        ease: "power4.out",
        onComplete: () => startFloat(el),
      }
    );
  }, [coverDone]);

  // Sync showSpots
  useEffect(() => {
    if (!isFocused && !isDimmed) {
      const t = setTimeout(() => setShowSpots(false), 400);
      return () => clearTimeout(t);
    }
  }, [isFocused, isDimmed]);

  // Focus/dim state changes
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !interactive) return;

    if (isFocused) {
      wasFocusedRef.current = true;
      animatingRef.current = true;
      floatRef.current?.kill();

      preFocusPosRef.current = {
        x: gsap.getProperty(el, "x") as number,
        y: gsap.getProperty(el, "y") as number,
      };

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
        const scaledLeft =
          el.offsetLeft + targetX - (scaledW - elRect.width) / 2;
        const scaledTop =
          el.offsetTop + targetY - (scaledH - elRect.height) / 2;
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
          zIndex: 10000,
          scale,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => {
            animatingRef.current = false;
          },
        });
      }

      if (spotRefs.current) {
        const dots = spotRefs.current.querySelectorAll(".spot-marker");
        gsap.fromTo(
          dots,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, stagger: 0.06, ease: "power2.out" }
        );
      }
    } else if (isDimmed) {
      gsap.to(el, {
        opacity: 0.15,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      animatingRef.current = true;
      const anim: gsap.TweenVars = {
        opacity: position.initialOpacity,
        filter: position.cssFilter || "none",
        scale: 1,
        zIndex: currentZRef.current,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          animatingRef.current = false;
          wasFocusedRef.current = false;
          startFloat(el);
        },
      };
      if (wasFocusedRef.current) {
        anim.x = preFocusPosRef.current.x;
        anim.y = preFocusPosRef.current.y;
      }
      gsap.to(el, anim);
    }
  }, [
    isFocused,
    isDimmed,
    position.zIndex,
    position.initialOpacity,
    position.cssFilter,
    startFloat,
    interactive,
  ]);

  const isHero = position.tier === "hero";
  const isSmall = position.tier === "small";

  const shadow = isHero
    ? "0 8px 35px rgba(0,0,0,0.7), 0 3px 10px rgba(0,0,0,0.5)"
    : isSmall
      ? "0 3px 12px rgba(0,0,0,0.5)"
      : "0 5px 22px rgba(0,0,0,0.6)";

  const cursorClass = interactive
    ? "cursor-grab active:cursor-grabbing"
    : "pointer-events-none";

  return (
    <div
      ref={cardRef}
      className={`absolute ${cursorClass} transform-gpu touch-none will-change-transform`}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: isFocused ? 10000 : currentZRef.current,
        transform: `rotate(${position.rotate}deg)`,
        filter: isFocused ? "none" : position.cssFilter,
        opacity: 0,
        visibility: "hidden",
      }}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? image.label || "Hero image" : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!animatingRef.current) onToggleFocus(image.id);
              }
            }
          : undefined
      }
    >
      <div
        className="relative rounded-2xl"
        style={{
          border:
            isFocused || showSpots
              ? "1.5px solid rgba(234,253,103,0.5)"
              : "1px solid rgba(255,255,255,0.06)",
          boxShadow: shadow,
        }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ aspectRatio: position.aspectRatio }}
        >
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
              const card = cardRef.current;
              if (!card) return;
              if (ratio > 1.8 || ratio < 0.4) {
                card.style.display = "none";
                floatRef.current?.kill();
                return;
              }
              imageLoadedRef.current = true;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Spot markers — only for interactive cards */}
        {interactive &&
          (isFocused || showSpots) &&
          image.spots &&
          image.spots.length > 0 && (
            <div
              ref={spotRefs}
              className="absolute inset-0 pointer-events-none"
            >
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
