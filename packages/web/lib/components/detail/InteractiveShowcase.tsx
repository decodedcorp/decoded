"use client";

import { useState, useRef, useEffect, RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { ImageRow } from "@/lib/supabase/types";
import type { UiItem } from "./types";
import { ItemDetailCard } from "./ItemDetailCard";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  image: ImageRow;
  items: UiItem[];
  isModal?: boolean;
  /** Dense preview layout for explore-preview modal */
  compact?: boolean;
  scrollContainerRef?: RefObject<HTMLElement>;
  // Controlled mode props
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** 솔루션 등록 시트 열기 (spotId 전달) */
  onAddSolution?: (spotId: string) => void;
  /** 포스트 작성자 ID - 채택 UI 표시 여부 판단 */
  postOwnerId?: string | null;
};

/**
 * Item detail cards with scroll-linked active state (highlights on hover).
 * Post image / detection UX is handled by DecodeShowcase above on full page.
 */
export function InteractiveShowcase({
  image: _image,
  items,
  isModal = false,
  compact = false,
  scrollContainerRef,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
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
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Setup ScrollTrigger for each card
  useGSAP(
    () => {
      if (!sectionRef.current || items.length === 0) return;

      const scroller = scrollContainerRef?.current || window;
      const cards = gsap.utils.toArray<HTMLElement>(
        sectionRef.current.querySelectorAll("[data-item-index]")
      );

      // Ignore initial ScrollTrigger fire — only activate after user scrolls
      let hasScrolled = false;
      const scrollerTarget = scroller instanceof Window ? window : scroller;
      const markScrolled = () => {
        hasScrolled = true;
        scrollerTarget.removeEventListener("scroll", markScrolled);
        ScrollTrigger.update();
      };
      scrollerTarget.addEventListener("scroll", markScrolled, {
        passive: true,
      });

      cards.forEach((card, index) => {
        ScrollTrigger.create({
          scroller,
          trigger: card,
          start: "top 70%",
          end: "bottom center",
          invalidateOnRefresh: true,
          onEnter: () => {
            if (hasScrolled) handleActiveIndexChange(index);
          },
          onEnterBack: () => {
            if (hasScrolled) handleActiveIndexChange(index);
          },
          onLeave: () => {
            if (hasScrolled && activeIndexRef.current === index) {
              handleActiveIndexChange(null);
            }
          },
          onLeaveBack: () => {
            if (hasScrolled && activeIndexRef.current === index) {
              handleActiveIndexChange(null);
            }
          },
        });
      });

      // Modal: refresh once scroller has scrollable content (content may load async)
      if (scrollContainerRef?.current) {
        let cancelled = false;
        const scrollerEl = scrollContainerRef.current;
        let attempts = 0;
        const maxAttempts = 25;

        const checkReady = () => {
          if (cancelled) return;
          attempts++;
          if (
            scrollerEl.scrollHeight > scrollerEl.clientHeight ||
            attempts >= maxAttempts
          ) {
            ScrollTrigger.refresh();
          } else {
            requestAnimationFrame(checkReady);
          }
        };

        requestAnimationFrame(checkReady);

        return () => {
          cancelled = true;
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
    <section ref={sectionRef} className="relative flex flex-col h-auto">
      {/* Scrollable item cards — full width (post image: DecodeShowcase / modal chrome) */}
      <div
        ref={cardsContainerRef}
        className={`relative z-20 w-full bg-background px-4 py-6 ${
          isModal ? "overflow-visible pt-0" : "mx-auto max-w-6xl lg:px-8 lg:pt-12"
        }`}
      >
        {items.map((item, index) => (
          <ItemDetailCard
            key={item.id}
            item={item}
            index={index}
            isModal={isModal}
            compact={compact}
            onActivate={() => handleActiveIndexChange(index)}
            onDeactivate={() => handleActiveIndexChange(null)}
            spotId={item.spot_id ?? null}
            onAddSolution={onAddSolution}
            postOwnerId={postOwnerId}
          />
        ))}
      </div>
    </section>
  );
}
