"use client";

import { useRef, useEffect, useState, useCallback, RefObject } from "react";
import type { UiItem } from "./types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type ConnectorData = {
  itemId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  path: string;
  length: number;
};

type Props = {
  items: UiItem[];
  activeIndex: number | null;
  imageContainerRef: React.RefObject<HTMLDivElement | null>;
  cardsContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef?: RefObject<HTMLElement>;
};

/**
 * ConnectorLayer - SVG Bezier curves connecting image items to cards
 */
export function ConnectorLayer({
  items,
  activeIndex,
  imageContainerRef,
  cardsContainerRef,
  scrollContainerRef,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connectors, setConnectors] = useState<ConnectorData[]>([]);

  // Calculate connector coordinates and Bezier paths
  const calculateConnectors = useCallback(() => {
    if (
      !imageContainerRef.current ||
      !cardsContainerRef.current ||
      !svgRef.current
    ) {
      return;
    }

    const imageRect = imageContainerRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();

    const newConnectors: ConnectorData[] = [];

    items.forEach((item, index) => {
      if (!item.normalizedCenter || !item.normalizedBox) return;

      // Get card element
      const cardElement = cardsContainerRef.current?.querySelector(
        `[data-item-index="${index}"]`
      ) as HTMLElement;

      if (!cardElement) return;

      const cardRect = cardElement.getBoundingClientRect();

      // Calculate start point (item center in image)
      const center = item.normalizedCenter;
      const startX = imageRect.left + center.x * imageRect.width - svgRect.left;
      const startY = imageRect.top + center.y * imageRect.height - svgRect.top;

      // Calculate end point (card left edge or center depending on layout)
      // For desktop split layout, we connect to the left edge of the card
      const isDesktop = window.innerWidth >= 1024;
      const endX = isDesktop
        ? cardRect.left - svgRect.left
        : cardRect.left + cardRect.width / 2 - svgRect.left;
      const endY = cardRect.top + 40 - svgRect.top; // Connect slightly below the top of the card

      // Create a smooth Bezier curve
      // Control points are offset horizontally to create a nice "S" curve
      const cp1x = startX + (endX - startX) * 0.5;
      const cp1y = startY;
      const cp2x = startX + (endX - startX) * 0.5;
      const cp2y = endY;

      const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

      // Approximate length for animation
      const length =
        Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) *
        1.2;

      newConnectors.push({
        itemId: item.id.toString(),
        startX,
        startY,
        endX,
        endY,
        path,
        length,
      });
    });

    setConnectors(newConnectors);
  }, [items, imageContainerRef, cardsContainerRef]);

  // Recalculate on resize and scroll
  useEffect(() => {
    calculateConnectors();

    let ticking = false;
    const handleUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          calculateConnectors();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("resize", handleUpdate, { passive: true });

    // Add scroll listener to specific container or window
    const scroller = scrollContainerRef?.current || window;
    scroller.addEventListener("scroll", handleUpdate as EventListener, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      scroller.removeEventListener("scroll", handleUpdate as EventListener);
    };
  }, [calculateConnectors, scrollContainerRef]);

  // Animate connector paths with GSAP
  useGSAP(
    () => {
      if (!svgRef.current) return;

      connectors.forEach((connector) => {
        const path = svgRef.current?.querySelector(
          `[data-connector-id="${connector.itemId}"]`
        ) as SVGPathElement;

        if (!path) return;

        const isActive =
          items.findIndex((item) => item.id.toString() === connector.itemId) ===
          activeIndex;

        if (isActive) {
          const length = path.getTotalLength();

          gsap.fromTo(
            path,
            {
              strokeDasharray: length,
              strokeDashoffset: length,
              opacity: 0,
            },
            {
              strokeDashoffset: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.inOut",
            }
          );
        } else {
          gsap.to(path, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      });
    },
    { scope: svgRef, dependencies: [connectors, activeIndex] }
  );

  if (connectors.length === 0) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <marker
          id="dot"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
        >
          <circle
            cx="5"
            cy="5"
            r="4"
            fill="currentColor"
            className="text-primary"
          />
        </marker>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {connectors.map((connector) => {
        const isActive =
          items.findIndex((item) => item.id.toString() === connector.itemId) ===
          activeIndex;

        return (
          <g
            key={connector.itemId}
            style={{ opacity: isActive ? 1 : 0 }}
            filter={isActive ? "url(#glow)" : undefined}
          >
            <path
              data-connector-id={connector.itemId}
              d={connector.path}
              fill="none"
              stroke="url(#lineGradient)"
              className="text-primary/60 dark:text-primary/80"
              strokeWidth="2"
              strokeLinecap="round"
              markerStart="url(#dot)"
              style={{
                filter: isActive
                  ? "drop-shadow(0 0 8px rgba(var(--primary), 0.5))"
                  : "none",
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
