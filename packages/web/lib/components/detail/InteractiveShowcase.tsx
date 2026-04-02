"use client";

import { useState, useRef, useEffect, RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { ImageRow } from "@/lib/supabase/types";
import type { UiItem } from "./types";
import { ImageCanvas } from "./ImageCanvas";
import { ItemDetailCard } from "./ItemDetailCard";
import { ConnectorLayer } from "./ConnectorLayer";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  image: ImageRow;
  items: UiItem[];
  isModal?: boolean;
  scrollContainerRef?: RefObject<HTMLElement>;
  // Controlled mode props
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  renderImage?: boolean;
  /** 솔루션 등록 시트 열기 (spotId 전달) */
  onAddSolution?: (spotId: string) => void;
  /** 포스트 작성자 ID - 채택 UI 표시 여부 판단 */
  postOwnerId?: string | null;
};

/**
 * Interactive Showcase - The Core Feature
 *
 * Desktop: Sticky split layout (left image fixed / right text scrolls)
 * Mobile: Stack layout (top image fixed ~40vh / bottom text scrolls)
 *
 * Uses ScrollTrigger to sync active item with scroll position.
 */
export function InteractiveShowcase({
  image,
  items,
  isModal = false,
  scrollContainerRef,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
  renderImage = true,
  onAddSolution,
  postOwnerId = null,
}: Props) {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(
    null
  );

  // Use controlled or internal state
  const isControlled = controlledActiveIndex !== undefined;
  const activeIndex = isControlled
    ? controlledActiveIndex
    : internalActiveIndex;

  // Track activeIndex in ref to prevent stale closures in GSAP callbacks
  // while keeping dependency array clean (only items.length)
  const activeIndexRef = useRef<number | null>(null);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleActiveIndexChange = (index: number | null) => {
    if (!isControlled) {
      setInternalActiveIndex(index);
    }
    onActiveIndexChange?.(index);
  };

  const sectionRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Setup ScrollTrigger for each card
  useGSAP(
    () => {
      if (!sectionRef.current || items.length === 0) return;

      const scroller = scrollContainerRef?.current || window;
      const cards = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll("[data-item-index]")
      );

      cards.forEach((card, index) => {
        ScrollTrigger.create({
          scroller,
          trigger: card,
          start: "top center",
          end: "bottom center",
          invalidateOnRefresh: true,
          onEnter: () => handleActiveIndexChange(index),
          onEnterBack: () => handleActiveIndexChange(index),
          onLeave: () => {
            if (activeIndexRef.current === index) {
              handleActiveIndexChange(null);
            }
          },
          onLeaveBack: () => {
            if (activeIndexRef.current === index) {
              handleActiveIndexChange(null);
            }
          },
        });
      });

      // Modal: refresh after layout stabilizes (content may load async)
      if (scrollContainerRef?.current) {
        const timer = setTimeout(() => ScrollTrigger.refresh(), 300);
        return () => {
          clearTimeout(timer);
          ScrollTrigger.getAll().forEach((trigger) => {
            if (cards.includes(trigger.vars.trigger as HTMLElement)) {
              trigger.kill();
            }
          });
        };
      }

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (cards.includes(trigger.vars.trigger as HTMLElement)) {
            trigger.kill();
          }
        });
      };
    },
    { scope: sectionRef, dependencies: [items.length] }
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={`flex flex-col relative h-auto ${isModal ? "" : "lg:flex-row lg:min-h-screen"}`}
    >
      {/* Left: Sticky Image Canvas (Desktop) / Top: Fixed Image (Mobile) */}
      {renderImage && (
        <div
          ref={imageContainerRef}
          className={`sticky top-0 w-full z-10 ${isModal ? "h-[30vh] md:h-[40vh]" : "h-[30vh] md:h-[40vh] lg:h-screen lg:w-1/2"}`}
        >
          <ImageCanvas image={image} items={items} activeIndex={activeIndex} />
        </div>
      )}

      {/* Right: Scrollable Item Details (Desktop) / Bottom: Scrollable (Mobile) */}
      <div
        ref={cardsContainerRef}
        className={`w-full px-4 py-6 bg-background relative ${
          isModal
            ? renderImage
              ? "overflow-visible"
              : "w-full pt-0"
            : "z-20 lg:w-1/2 lg:pl-8 lg:pt-12"
        }`}
      >
        {items.map((item, index) => (
          <ItemDetailCard
            key={item.id}
            item={item}
            index={index}
            isModal={isModal}
            onActivate={() => handleActiveIndexChange(index)}
            onDeactivate={() => handleActiveIndexChange(null)}
            spotId={item.spot_id ?? null}
            onAddSolution={onAddSolution}
            postOwnerId={postOwnerId}
          />
        ))}
      </div>

      {/* Connector Lines Layer - Only show if image is rendered internally */}
      {renderImage && (
        <ConnectorLayer
          items={items}
          activeIndex={activeIndex}
          imageContainerRef={imageContainerRef}
          cardsContainerRef={cardsContainerRef}
          scrollContainerRef={scrollContainerRef}
        />
      )}
    </section>
  );
}
