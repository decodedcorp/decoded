"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useGesture } from "@use-gesture/react";
import { FALLBACK_IMAGES, type ImageItem } from "@/lib/utils/fallbackImages";

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  segments: 20,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};

interface BuiltItem {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  src: string;
  alt: string;
}

function buildItems(pool: ImageItem[], seg: number): BuiltItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: "", alt: "" }));
  }

  const normalizedImages: ImageItem[] = pool.map((image) => {
    if (typeof image === "string") {
      return { src: image, alt: "" };
    }
    return {
      src: image.src || "",
      alt: image.alt || "",
    };
  });

  const usedImages = Array.from(
    { length: totalSlots },
    (_, i) => normalizedImages[i % normalizedImages.length]
  );

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }));
}

export interface DomeGalleryRef {
  publicGetCurrentPosition: () => { x: number; y: number };
  applyTransform: (x: number, y: number) => void;
}

interface DomeGalleryProps {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: string;
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  segments?: number;
  dragDampening?: number;
  imageBorderRadius?: string;
  grayscale?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /** Vignette gradient start % (0–100). Higher = less edge darkening. Default 65 */
  vignetteStart?: number;
  /** Height guard multiplier for radius clamping. Default 1.35 */
  heightGuardMultiplier?: number;
}

const DomeGallery = forwardRef<DomeGalleryRef, DomeGalleryProps>(
  (
    {
      images,
      fit = 0.5,
      fitBasis = "auto",
      minRadius = 600,
      maxRadius = Infinity,
      padFactor = 0.25,
      overlayBlurColor = "#060010",
      maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
      dragSensitivity = DEFAULTS.dragSensitivity,
      segments = DEFAULTS.segments,
      dragDampening = 2,
      imageBorderRadius = "30px",
      grayscale = true,
      autoRotate = false,
      autoRotateSpeed = 0.015,
      vignetteStart = 65,
      heightGuardMultiplier = 1.35,
    },
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const sphereRef = useRef<HTMLDivElement>(null);

    // Use provided images or fallback
    const displayImages = useMemo(() => {
      if (images && images.length > 0) {
        return images;
      }
      return FALLBACK_IMAGES;
    }, [images]);

    // ref를 통해 외부에서 접근할 수 있는 메서드들
    useImperativeHandle(ref, () => ({
      publicGetCurrentPosition: () => rotationRef.current,
      applyTransform: (x: number, y: number) => {
        rotationRef.current = { x, y };
        applyTransform(x, y);
      },
    }));

    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const draggingRef = useRef(false);
    const movedRef = useRef(false);
    const inertiaRAF = useRef<number | null>(null);
    const pointerTypeRef = useRef("mouse");
    const lastDragEndAt = useRef(0);

    const scrollLockedRef = useRef(false);
    const lockScroll = useCallback(() => {
      if (scrollLockedRef.current) return;
      scrollLockedRef.current = true;
      document.body.classList.add("dg-scroll-lock");
    }, []);
    const unlockScroll = useCallback(() => {
      if (!scrollLockedRef.current) return;
      scrollLockedRef.current = false;
      document.body.classList.remove("dg-scroll-lock");
    }, []);

    const items = useMemo(
      () => buildItems(displayImages, segments),
      [displayImages, segments]
    );

    const applyTransform = (xDeg: number, yDeg: number) => {
      const el = sphereRef.current;
      if (el) {
        el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
      }
    };

    const lockedRadiusRef = useRef<number | null>(null);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      const updateSize = (entries?: ResizeObserverEntry[]) => {
        const cr = entries?.[0]?.contentRect || root.getBoundingClientRect();
        const w = Math.max(1, cr.width),
          h = Math.max(1, cr.height);
        const minDim = Math.min(w, h),
          maxDim = Math.max(w, h),
          aspect = w / h;
        let basis;
        switch (fitBasis) {
          case "min":
            basis = minDim;
            break;
          case "max":
            basis = maxDim;
            break;
          case "width":
            basis = w;
            break;
          case "height":
            basis = h;
            break;
          default:
            basis = aspect >= 1.3 ? w : minDim;
        }
        let radius = basis * fit;
        const heightGuard = h * heightGuardMultiplier;
        radius = Math.min(radius, heightGuard);
        radius = clamp(radius, minRadius, maxRadius);
        lockedRadiusRef.current = Math.round(radius);

        const viewerPad = Math.max(8, Math.round(minDim * padFactor));
        root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
        root.style.setProperty("--viewer-pad", `${viewerPad}px`);
        root.style.setProperty("--overlay-blur-color", overlayBlurColor);
        root.style.setProperty("--tile-radius", imageBorderRadius);
        root.style.setProperty(
          "--image-filter",
          grayscale ? "grayscale(1)" : "none"
        );
        applyTransform(rotationRef.current.x, rotationRef.current.y);
      };

      updateSize();

      const ro = new ResizeObserver((entries) => {
        updateSize(entries);
      });
      ro.observe(root);
      return () => ro.disconnect();
    }, [
      fit,
      fitBasis,
      minRadius,
      maxRadius,
      padFactor,
      overlayBlurColor,
      grayscale,
      imageBorderRadius,
    ]);

    useEffect(() => {
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    }, []);

    // Auto-rotate effect
    const autoRotateRAF = useRef<number | null>(null);
    useEffect(() => {
      if (!autoRotate) {
        if (autoRotateRAF.current) {
          cancelAnimationFrame(autoRotateRAF.current);
          autoRotateRAF.current = null;
        }
        return;
      }

      const animate = () => {
        // Only rotate when not dragging and no inertia
        if (!draggingRef.current && !inertiaRAF.current) {
          const nextY = rotationRef.current.y + autoRotateSpeed;
          rotationRef.current = { x: rotationRef.current.x, y: nextY };
          applyTransform(rotationRef.current.x, nextY);
        }
        autoRotateRAF.current = requestAnimationFrame(animate);
      };

      autoRotateRAF.current = requestAnimationFrame(animate);

      return () => {
        if (autoRotateRAF.current) {
          cancelAnimationFrame(autoRotateRAF.current);
          autoRotateRAF.current = null;
        }
      };
    }, [autoRotate, autoRotateSpeed]);

    const stopInertia = useCallback(() => {
      if (inertiaRAF.current) {
        cancelAnimationFrame(inertiaRAF.current);
        inertiaRAF.current = null;
      }
    }, []);

    const startInertia = useCallback(
      (vx: number, vy: number) => {
        const MAX_V = 1.4;
        let vX = clamp(vx, -MAX_V, MAX_V) * 80;
        let vY = clamp(vy, -MAX_V, MAX_V) * 80;
        let frames = 0;
        const d = clamp(dragDampening ?? 0.6, 0, 1);
        const frictionMul = 0.94 + 0.055 * d;
        const stopThreshold = 0.015 - 0.01 * d;
        const maxFrames = Math.round(90 + 270 * d);
        const step = () => {
          vX *= frictionMul;
          vY *= frictionMul;
          if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
            inertiaRAF.current = null;
            return;
          }
          if (++frames > maxFrames) {
            inertiaRAF.current = null;
            return;
          }
          const nextX = clamp(
            rotationRef.current.x - vY / 200,
            -maxVerticalRotationDeg,
            maxVerticalRotationDeg
          );
          const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
          inertiaRAF.current = requestAnimationFrame(step);
        };
        stopInertia();
        inertiaRAF.current = requestAnimationFrame(step);
      },
      [dragDampening, maxVerticalRotationDeg, stopInertia]
    );

    useGesture(
      {
        onDragStart: ({ event }) => {
          stopInertia();

          pointerTypeRef.current =
            (event as PointerEvent).pointerType || "mouse";
          if (pointerTypeRef.current === "touch")
            (event as Event).preventDefault();
          if (pointerTypeRef.current === "touch") lockScroll();
          draggingRef.current = true;
          movedRef.current = false;
          startRotRef.current = { ...rotationRef.current };
          startPosRef.current = {
            x: (event as PointerEvent).clientX,
            y: (event as PointerEvent).clientY,
          };
        },
        onDrag: ({
          event,
          last,
          velocity: velArr = [0, 0],
          direction: dirArr = [0, 0],
          movement,
        }) => {
          if (!draggingRef.current || !startPosRef.current) return;

          if (pointerTypeRef.current === "touch")
            (event as Event).preventDefault();

          const dxTotal =
            (event as PointerEvent).clientX - startPosRef.current.x;
          const dyTotal =
            (event as PointerEvent).clientY - startPosRef.current.y;

          if (!movedRef.current) {
            const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
            if (dist2 > 16) movedRef.current = true;
          }

          const nextX = clamp(
            startRotRef.current.x - dyTotal / dragSensitivity,
            -maxVerticalRotationDeg,
            maxVerticalRotationDeg
          );
          const nextY = startRotRef.current.y + dxTotal / dragSensitivity;

          const cur = rotationRef.current;
          if (cur.x !== nextX || cur.y !== nextY) {
            rotationRef.current = { x: nextX, y: nextY };
            applyTransform(nextX, nextY);
          }

          if (last) {
            draggingRef.current = false;
            let isTap = false;

            if (startPosRef.current) {
              const dx =
                (event as PointerEvent).clientX - startPosRef.current.x;
              const dy =
                (event as PointerEvent).clientY - startPosRef.current.y;
              const dist2 = dx * dx + dy * dy;
              const TAP_THRESH_PX = pointerTypeRef.current === "touch" ? 10 : 6;
              if (dist2 <= TAP_THRESH_PX * TAP_THRESH_PX) {
                isTap = true;
              }
            }

            const [vMagX, vMagY] = velArr;
            const [dirX, dirY] = dirArr;
            let vx = vMagX * dirX;
            let vy = vMagY * dirY;

            if (
              !isTap &&
              Math.abs(vx) < 0.001 &&
              Math.abs(vy) < 0.001 &&
              Array.isArray(movement)
            ) {
              const [mx, my] = movement;
              vx = (mx / dragSensitivity) * 0.02;
              vy = (my / dragSensitivity) * 0.02;
            }

            if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) {
              startInertia(vx, vy);
            }
            startPosRef.current = null;

            if (movedRef.current) lastDragEndAt.current = performance.now();
            movedRef.current = false;
            if (pointerTypeRef.current === "touch") unlockScroll();
          }
        },
      },
      { target: mainRef, eventOptions: { passive: false } }
    );

    useEffect(() => {
      return () => {
        document.body.classList.remove("dg-scroll-lock");
      };
    }, []);

    const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }

    .sphere-root * {
      box-sizing: border-box;
    }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }

    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }

    .sphere {
      transform: translateZ(calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
    }

    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
                 translateZ(var(--radius));
    }

    .item__image {
      position: absolute;
      inset: 10px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: none;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    .item__image img {
      transition: filter 300ms ease-in-out;
    }
  `;

    if (displayImages.length === 0) {
      return null;
    }

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div
          ref={rootRef}
          className="sphere-root relative w-full h-full"
          style={
            {
              "--segments-x": segments,
              "--segments-y": segments,
              "--overlay-blur-color": overlayBlurColor,
              "--tile-radius": imageBorderRadius,
              "--image-filter": grayscale ? "grayscale(1)" : "none",
            } as React.CSSProperties
          }
        >
          <main
            ref={mainRef}
            className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
            style={{
              touchAction: "none",
              WebkitUserSelect: "none",
            }}
          >
            <div className="stage">
              <div ref={sphereRef} className="sphere">
                {items.map((it, i) => (
                  <div
                    key={`${it.x},${it.y},${i}`}
                    className="sphere-item absolute m-auto"
                    data-src={it.src}
                    data-alt={it.alt}
                    data-offset-x={it.x}
                    data-offset-y={it.y}
                    data-size-x={it.sizeX}
                    data-size-y={it.sizeY}
                    style={
                      {
                        "--offset-x": it.x,
                        "--offset-y": it.y,
                        "--item-size-x": it.sizeX,
                        "--item-size-y": it.sizeY,
                        top: "-999px",
                        bottom: "-999px",
                        left: "-999px",
                        right: "-999px",
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className="item__image absolute block overflow-hidden bg-black"
                      style={{
                        inset: "10px",
                        borderRadius: `var(--tile-radius, ${imageBorderRadius})`,
                        backfaceVisibility: "hidden",
                      }}
                    >
                      {/* Blur background fill */}
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${it.src})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: `blur(16px) brightness(0.6) ${grayscale ? "grayscale(1)" : ""}`,
                          transform: "scale(1.15)",
                          backfaceVisibility: "hidden",
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.src}
                        draggable={false}
                        alt={it.alt}
                        className="relative z-10 w-full h-full object-contain pointer-events-none"
                        style={{
                          backfaceVisibility: "hidden",
                          filter: `var(--image-filter, ${grayscale ? "grayscale(1)" : "none"})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="absolute inset-0 m-auto z-[3] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) ${vignetteStart}%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`,
              }}
            />

            <div
              className="absolute inset-0 m-auto z-[3] pointer-events-none"
              style={{
                WebkitMaskImage: `radial-gradient(rgba(235, 235, 235, 0) ${vignetteStart + 5}%, var(--overlay-blur-color, ${overlayBlurColor}) ${vignetteStart + 25}%)`,
                maskImage: `radial-gradient(rgba(235, 235, 235, 0) ${vignetteStart + 5}%, var(--overlay-blur-color, ${overlayBlurColor}) ${vignetteStart + 25}%)`,
                backdropFilter: "blur(3px)",
              }}
            />

            <div
              className="absolute left-0 right-0 top-0 h-[120px] z-[5] pointer-events-none rotate-180"
              style={{
                background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`,
              }}
            />
            <div
              className="absolute left-0 right-0 bottom-0 h-[120px] z-[5] pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`,
              }}
            />
          </main>
        </div>
      </>
    );
  }
);

DomeGallery.displayName = "DomeGallery";

export default DomeGallery;
