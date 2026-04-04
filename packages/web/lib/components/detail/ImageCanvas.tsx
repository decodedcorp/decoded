"use client";

import { useRef, useEffect, useState } from "react";
import type { ImageRow } from "@/lib/supabase/types";
import type { UiItem, BoundingBox } from "./types";
import { getHighlightStyle } from "./types";
import { SpotDot } from "./SpotDot";

import gsap from "gsap";

type Props = {
  image: ImageRow;
  items: UiItem[];
  activeIndex: number | null;
  objectFit?: "cover" | "contain";
};

/**
 * ImageCanvas - Main image display with spotlight effect
 *
 * Features:
 * - Spotlight effect: Active item stays in color, rest is grayscale
 * - Coordinate-based highlighting boxes
 * - Pan & Zoom effect (scale + translation, not transform-origin)
 * - Object-fit: cover coordinate correction
 */
export function ImageCanvas({
  image,
  items,
  activeIndex,
  objectFit = "cover",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<{ scale: number; x: number; y: number }>({
    scale: 1,
    x: 0,
    y: 0,
  });

  // State for coordinate correction (object-fit: cover)
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // ResizeObserver for container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Helper: Calculate displayed image rect (px) considering object-fit mode
  const getDisplayedRect = () => {
    if (!naturalSize || !containerSize) return null;

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;

    let width, height, left, top;

    if (objectFit === "contain") {
      // contain: image fits inside container, letterboxed — no cropping
      if (imageAspect > containerAspect) {
        // Image is wider → width fills container, vertical letterbox
        width = containerSize.width;
        height = width / imageAspect;
        left = 0;
        top = (containerSize.height - height) / 2;
      } else {
        // Image is taller → height fills container, horizontal letterbox
        height = containerSize.height;
        width = height * imageAspect;
        top = 0;
        left = (containerSize.width - width) / 2;
      }
    } else {
      // cover: image fills container, excess cropped
      if (imageAspect > containerAspect) {
        // Image is wider than container (height fits, width cropped)
        height = containerSize.height;
        width = height * imageAspect;
        top = 0;
        left = (containerSize.width - width) / 2; // Center horizontally
      } else {
        // Image is taller than container (width fits, height cropped)
        width = containerSize.width;
        height = width / imageAspect;
        left = 0;
        top = (containerSize.height - height) / 2; // Center vertically
      }
    }

    return { width, height, left, top };
  };

  // Helper: Get corrected box style (px)
  const getCorrectedBoxStyle = (box: BoundingBox) => {
    const rect = getDisplayedRect();
    if (!rect) {
      // Fallback to simple percent if not ready (might be inaccurate for object-cover)
      return getHighlightStyle(box);
    }

    return {
      left: `${rect.left + box.left * rect.width}px`,
      top: `${rect.top + box.top * rect.height}px`,
      width: `${box.width * rect.width}px`,
      height: `${box.height * rect.height}px`,
    };
  };

  // Pre-set initial transforms with GPU acceleration to avoid first-scroll jank
  useEffect(() => {
    if (imageRef.current) gsap.set(imageRef.current, { scale: 1, x: 0, y: 0, force3D: true, willChange: "transform" });
    if (boxesRef.current) gsap.set(boxesRef.current, { scale: 1, x: 0, y: 0, force3D: true, willChange: "transform" });
    if (overlayRef.current) gsap.set(overlayRef.current, { scale: 1, x: 0, y: 0, force3D: true, willChange: "transform" });
  }, []);

  // Pan & Zoom effect: lightweight useEffect (no GSAP context recreation)
  useEffect(() => {
    const targets = [imageRef.current, boxesRef.current, overlayRef.current].filter(Boolean);
    if (targets.length === 0) return;

    if (activeIndex === null) {
      // Reset to default state
      const resetVars = { scale: 1, x: 0, y: 0, duration: 0.5, ease: "power2.out", overwrite: true as const, force3D: true };
      targets.forEach((el) => gsap.to(el!, resetVars));
      transformRef.current = { scale: 1, x: 0, y: 0 };
      return;
    }

    const activeItem = items[activeIndex];
    if (!activeItem?.normalizedCenter || !activeItem?.normalizedBox) return;
    if (!containerRef.current || !imageRef.current || !naturalSize || !containerSize) return;

    const rect = getDisplayedRect();
    if (!rect) return;

    const center = activeItem.normalizedCenter;
    const scale = 1.2;
    const offsetX = (center.x - 0.5) * (scale - 1) * rect.width;
    const offsetY = (center.y - 0.5) * (scale - 1) * rect.height;

    const animVars = { scale, x: -offsetX, y: -offsetY, duration: 0.5, ease: "power2.out", overwrite: true as const, force3D: true };
    targets.forEach((el) => gsap.to(el!, animVars));
    transformRef.current = { scale, x: -offsetX, y: -offsetY };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, naturalSize, containerSize]);

  // Spotlight effect: Update overlay mask
  useEffect(() => {
    if (!overlayRef.current) return;

    if (activeIndex === null) {
      overlayRef.current.style.filter = "none";
      overlayRef.current.style.opacity = "0";
      return;
    }

    const activeItem = items[activeIndex];
    if (!activeItem?.normalizedBox) {
      return;
    }

    const box = activeItem.normalizedBox;
    const rect = getDisplayedRect();

    // Calculate clip path points (px or %)
    let points = {
      tl: { x: box.left * 100, y: box.top * 100 },
      tr: { x: (box.left + box.width) * 100, y: box.top * 100 },
      br: { x: (box.left + box.width) * 100, y: (box.top + box.height) * 100 },
      bl: { x: box.left * 100, y: (box.top + box.height) * 100 },
      unit: "%",
    };

    if (rect) {
      // Use pixel values relative to container if we have rect info
      // This accounts for object-fit: cover offsets
      points = {
        tl: {
          x: rect.left + box.left * rect.width,
          y: rect.top + box.top * rect.height,
        },
        tr: {
          x: rect.left + (box.left + box.width) * rect.width,
          y: rect.top + box.top * rect.height,
        },
        br: {
          x: rect.left + (box.left + box.width) * rect.width,
          y: rect.top + (box.top + box.height) * rect.height,
        },
        bl: {
          x: rect.left + box.left * rect.width,
          y: rect.top + (box.top + box.height) * rect.height,
        },
        unit: "px",
      };
    }

    const clipPath = `polygon(
      0% 0%,
      0% 100%,
      ${points.bl.x}${points.unit} 100%,
      ${points.bl.x}${points.unit} ${points.bl.y}${points.unit},
      ${points.br.x}${points.unit} ${points.br.y}${points.unit},
      ${points.tr.x}${points.unit} ${points.tr.y}${points.unit},
      ${points.tl.x}${points.unit} ${points.tl.y}${points.unit},
      ${points.bl.x}${points.unit} ${points.bl.y}${points.unit},
      ${points.bl.x}${points.unit} 100%,
      100% 100%,
      100% 0%
    )`;

    overlayRef.current.style.clipPath = clipPath;
    overlayRef.current.style.filter = "grayscale(60%) brightness(0.6)";
    overlayRef.current.style.opacity = "1";
  }, [activeIndex, naturalSize, containerSize]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {image.image_url && (
        <>
          {/* Main Image */}
          <img
            ref={imageRef}
            src={image.image_url}
            alt={`Image ${image.id}`}
            className={`h-full w-full ${objectFit === "contain" ? "object-contain" : "object-cover"} will-change-transform`}
            style={{ transformOrigin: "center center" }}
            loading="lazy"
            onLoad={(e) => {
              setNaturalSize({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              });
            }}
          />

          {/* Spotlight Overlay (grayscale mask) */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/40 transition-opacity duration-500 pointer-events-none will-change-transform"
            style={{ opacity: 0, transformOrigin: "center center" }}
          />

          {/* Spot Dots Container - Applies same transform as image */}
          <div
            ref={boxesRef}
            className="absolute inset-0 pointer-events-none"
            style={{ transformOrigin: "center center" }}
          >
            {items.map((item, index) => {
              if (!item.normalizedCenter) return null;

              const rect = getDisplayedRect();
              if (!rect) return null;

              const isActive = index === activeIndex;
              const pixelLeft = rect.left + rect.width * item.normalizedCenter.x;
              const pixelTop = rect.top + rect.height * item.normalizedCenter.y;
              const meta = item.metadata as unknown as Record<string, unknown> | undefined;

              return (
                <div
                  key={item.id}
                  className={`transition-all duration-300 ${
                    isActive ? "opacity-100 scale-125" : "opacity-0 scale-100"
                  }`}
                  style={{ position: "absolute", left: 0, top: 0, transformOrigin: `${pixelLeft}px ${pixelTop}px` }}
                >
                  <SpotDot
                    mode="pixel"
                    leftPx={pixelLeft}
                    topPx={pixelTop}
                    label={item.product_name ?? ""}
                    brand={meta?.brand as string | undefined}
                    category={meta?.sub_category as string | undefined}
                    accentColor="var(--mag-accent)"
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
