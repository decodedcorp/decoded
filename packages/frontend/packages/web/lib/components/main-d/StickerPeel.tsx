"use client";

/**
 * StickerPeel — adapted from react-bits/StickerPeel
 * https://reactbits.dev/animations/sticker-peel
 *
 * Peel-back animation on hover/active using CSS clip-path.
 * Draggable via GSAP Draggable plugin.
 * SVG filters for realistic lighting + shadow.
 *
 * Simplified for the decoded collage: no initialPosition randomness,
 * positioning handled by parent (scatter engine).
 */

import {
  useRef,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

interface StickerPeelProps {
  imageSrc: string;
  width: number;
  rotate?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  peelDirection?: number;
  shadowIntensity?: number;
  lightingIntensity?: number;
  className?: string;
  children?: ReactNode;
}

interface CSSVars extends CSSProperties {
  "--sticker-p"?: string;
  "--sticker-peelback-hover"?: string;
  "--sticker-peelback-active"?: string;
  "--sticker-width"?: string;
  "--sticker-shadow-opacity"?: number;
  "--sticker-start"?: string;
  "--sticker-end"?: string;
  "--peel-direction"?: string;
}

/** Unique ID counter to avoid SVG filter collisions between cards */
let idCounter = 0;

export function StickerPeel({
  imageSrc,
  width,
  rotate = 0,
  peelBackHoverPct = 25,
  peelBackActivePct = 35,
  peelDirection = 0,
  shadowIntensity = 0.5,
  lightingIntensity = 0.08,
  className = "",
}: StickerPeelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<HTMLDivElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const filterId = useRef(`sp-${++idCounter}`);
  const pad = 10;

  // Draggable
  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target) return;

    const [inst] = Draggable.create(target, {
      type: "x,y",
      // No bounds — free movement across entire canvas
      inertia: true,
      onDrag(this: Draggable) {
        const rot = gsap.utils.clamp(-25, 25, this.deltaX * 0.4);
        gsap.to(target, { rotation: rot, duration: 0.1, ease: "power1.out" });
      },
      onDragEnd() {
        gsap.to(target, { rotation: 0, duration: 0.6, ease: "power2.out" });
      },
      onPress() {
        // Bring to front when grabbed
        gsap.set(target.parentNode, { zIndex: 50 });
      },
      onRelease() {
        gsap.to(target.parentNode as HTMLElement, {
          zIndex: "auto",
          delay: 0.3,
        });
      },
    });

    return () => {
      inst.kill();
    };
  }, []);

  // Lighting follows mouse
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      if (pointLightRef.current) {
        gsap.set(pointLightRef.current, {
          attr: { x: e.clientX - r.left, y: e.clientY - r.top },
        });
      }
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, []);

  // Touch peel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const on = () => el.classList.add("sp-touch");
    const off = () => el.classList.remove("sp-touch");
    el.addEventListener("touchstart", on);
    el.addEventListener("touchend", off);
    el.addEventListener("touchcancel", off);
    return () => {
      el.removeEventListener("touchstart", on);
      el.removeEventListener("touchend", off);
      el.removeEventListener("touchcancel", off);
    };
  }, []);

  const fid = filterId.current;
  const vars: CSSVars = useMemo(
    () => ({
      "--sticker-p": `${pad}px`,
      "--sticker-peelback-hover": `${peelBackHoverPct}%`,
      "--sticker-peelback-active": `${peelBackActivePct}%`,
      "--sticker-width": `${width}px`,
      "--sticker-shadow-opacity": shadowIntensity,
      "--sticker-start": `calc(-1 * ${pad}px)`,
      "--sticker-end": `calc(100% + ${pad}px)`,
      "--peel-direction": `${peelDirection}deg`,
    }),
    [width, peelBackHoverPct, peelBackActivePct, shadowIntensity, peelDirection]
  );

  const mainClip: CSSProperties = {
    clipPath:
      "polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))",
    transition: "clip-path 0.5s ease-out",
    filter: `url(#${fid}-shadow)`,
    willChange: "clip-path",
  };

  const flapClip: CSSProperties = {
    clipPath:
      "polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))",
    top: "calc(-100% - var(--sticker-p) - var(--sticker-p))",
    transform: "scaleY(-1)",
    transition: "all 0.5s ease-out",
    willChange: "clip-path, transform",
  };

  const imgStyle: CSSProperties = {
    transform: `rotate(${rotate - peelDirection}deg)`,
    width: `${width}px`,
  };

  return (
    <div
      ref={dragTargetRef}
      className={`absolute cursor-grab active:cursor-grabbing transform-gpu ${className}`}
      style={vars}
    >
      {/* Scoped peel styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
.sp-${fid}:hover .sp-main,.sp-${fid}.sp-touch .sp-main{clip-path:polygon(var(--sticker-start) var(--sticker-peelback-hover),var(--sticker-end) var(--sticker-peelback-hover),var(--sticker-end) var(--sticker-end),var(--sticker-start) var(--sticker-end))!important}
.sp-${fid}:hover .sp-flap,.sp-${fid}.sp-touch .sp-flap{clip-path:polygon(var(--sticker-start) var(--sticker-start),var(--sticker-end) var(--sticker-start),var(--sticker-end) var(--sticker-peelback-hover),var(--sticker-start) var(--sticker-peelback-hover))!important;top:calc(-100% + 2*var(--sticker-peelback-hover) - 1px)!important}
.sp-${fid}:active .sp-main{clip-path:polygon(var(--sticker-start) var(--sticker-peelback-active),var(--sticker-end) var(--sticker-peelback-active),var(--sticker-end) var(--sticker-end),var(--sticker-start) var(--sticker-end))!important}
.sp-${fid}:active .sp-flap{clip-path:polygon(var(--sticker-start) var(--sticker-start),var(--sticker-end) var(--sticker-start),var(--sticker-end) var(--sticker-peelback-active),var(--sticker-start) var(--sticker-peelback-active))!important;top:calc(-100% + 2*var(--sticker-peelback-active) - 1px)!important}
`,
        }}
      />

      {/* SVG filters — unique per instance */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id={`${fid}-light`}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={`${fid}-shadow`}>
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>
          <filter id={`${fid}-back`}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(180,180,180)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      {/* Sticker container */}
      <div
        ref={containerRef}
        className={`sp-${fid} relative select-none touch-none sm:touch-auto`}
        style={{
          transform: `rotate(${peelDirection}deg)`,
          transformOrigin: "center",
        }}
      >
        {/* Main visible part */}
        <div className="sp-main" style={mainClip}>
          <div style={{ filter: `url(#${fid}-light)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="block"
              style={imgStyle}
              draggable={false}
            />
          </div>
        </div>

        {/* Shadow of flap */}
        <div
          className="absolute top-4 left-2 w-full h-full opacity-40"
          style={{ filter: "brightness(0) blur(8px)" }}
        >
          <div className="sp-flap" style={flapClip}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="block"
              style={{ ...imgStyle, filter: `url(#${fid}-back)` }}
              draggable={false}
            />
          </div>
        </div>

        {/* Flap (peel-back surface) */}
        <div className="sp-flap absolute w-full h-full left-0" style={flapClip}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            className="block"
            style={{ ...imgStyle, filter: `url(#${fid}-back)` }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
