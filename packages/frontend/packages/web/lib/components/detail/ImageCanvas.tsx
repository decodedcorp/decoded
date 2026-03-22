"use client";

import { useRef, useEffect, useState } from "react";
import type { ImageRow } from "@/lib/supabase/types";
import type { UiItem, BoundingBox } from "./types";
import { getHighlightStyle } from "./types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Props = {
  image: ImageRow;
  items: UiItem[];
  activeIndex: number | null;
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
export function ImageCanvas({ image, items, activeIndex }: Props) {
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

  // Helper: Calculate displayed image rect (px) considering object-fit: cover
  const getDisplayedRect = () => {
    if (!naturalSize || !containerSize) return null;

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;

    let width, height, left, top;

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

  // Pan & Zoom effect: Calculate scale and translation
  useGSAP(
    () => {
      if (!imageRef.current || activeIndex === null) {
        // Reset to default state
        if (imageRef.current) {
          const resetVars = {
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          };

          gsap.to(imageRef.current, resetVars);

          if (boxesRef.current) {
            gsap.to(boxesRef.current, resetVars);
          }

          if (overlayRef.current) {
            gsap.to(overlayRef.current, resetVars);
          }

          transformRef.current = { scale: 1, x: 0, y: 0 };
        }
        return;
      }

      const activeItem = items[activeIndex];
      if (!activeItem?.normalizedCenter || !activeItem?.normalizedBox) {
        return;
      }

      const center = activeItem.normalizedCenter;
      const scale = 1.2; // Zoom level

      // Calculate translation to center the item
      // We reuse logic similar to getDisplayedRect but within the GSAP context
      if (
        containerRef.current &&
        imageRef.current &&
        naturalSize &&
        containerSize
      ) {
        const rect = getDisplayedRect();

        if (rect) {
          // Calculate offset needed to center the item based on displayed dimensions
          const offsetX = (center.x - 0.5) * (scale - 1) * rect.width;
          const offsetY = (center.y - 0.5) * (scale - 1) * rect.height;

          const animVars = {
            scale,
            x: -offsetX,
            y: -offsetY,
            duration: 0.8,
            ease: "power2.out",
          };

          gsap.to(imageRef.current, animVars);

          // Apply same transform to boxes container
          if (boxesRef.current) {
            gsap.to(boxesRef.current, animVars);
          }

          // Apply same transform to overlay to keep spotlight aligned
          if (overlayRef.current) {
            gsap.to(overlayRef.current, animVars);
          }

          transformRef.current = { scale, x: -offsetX, y: -offsetY };
        }
      }
    },
    {
      scope: containerRef,
      dependencies: [activeIndex, naturalSize, containerSize],
    }
  );

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
            className="h-full w-full object-cover will-change-transform"
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

          {/* Highlight Boxes Container - Applies same transform as image */}
          <div
            ref={boxesRef}
            className="absolute inset-0 pointer-events-none"
            style={{ transformOrigin: "center center" }}
          >
            {items.map((item, index) => {
              if (!item.normalizedBox) return null;

              const isActive = index === activeIndex;
              // Use corrected style for object-fit: cover
              const style = getCorrectedBoxStyle(item.normalizedBox);

              return (
                <div
                  key={item.id}
                  className={`absolute transition-all duration-300 pointer-events-none ${
                    isActive
                      ? "border border-white/90 shadow-sm opacity-100"
                      : "border-0 opacity-0"
                  }`}
                  style={style}
                >
                  {/* Index Label */}
                  {isActive && (
                    <div className="absolute -top-6 left-0 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
