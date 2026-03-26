"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Applies a ScrollTrigger-based entry animation to the item card content.
 * When isModal is true, no animation is applied (modal context does not scroll the card in).
 */
export function useItemCardGSAP(
  cardRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  isModal: boolean
): void {
  useGSAP(
    () => {
      if (!contentRef.current || isModal) return;

      gsap.fromTo(
        contentRef.current,
        {
          y: 60,
          opacity: 0,
          scale: 0.98,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: cardRef }
  );
}
