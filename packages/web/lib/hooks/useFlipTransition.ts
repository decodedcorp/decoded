"use client";

import { useEffect, useRef, RefObject } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useTransitionStore } from "@/lib/stores/transitionStore";

// Register GSAP Flip plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

/**
 * Hook for handling FLIP animations when entering (card -> modal)
 *
 * @param targetRef - Ref to the modal element that should animate
 * @param imageId - Image ID to match with stored transition state
 */
export function useFlipEnter(
  targetRef: RefObject<HTMLElement>,
  imageId: string
) {
  const { originState, originRect } = useTransitionStore();

  useEffect(() => {
    if (!targetRef.current) return;

    const element = targetRef.current;

    // If we have origin state, perform FLIP animation
    if (originState && originRect) {
      // Set initial state: match the card's position and size
      gsap.set(element, {
        x: originRect.left,
        y: originRect.top,
        width: originRect.width,
        height: originRect.height,
        scale: 1,
        opacity: 0,
      });

      // Get current state (modal's final position)
      const state = Flip.getState(element);

      // Animate from origin to current
      Flip.from(originState, {
        duration: 0.6,
        ease: "power2.inOut",
        scale: true,
        onComplete: () => {
          // Clean up inline styles after animation
          gsap.set(element, { clearProps: "all" });
        },
      });
    } else {
      // Fallback: center fade-in animation (for direct URL access or refresh)
      gsap.fromTo(
        element,
        {
          opacity: 0,
          scale: 0.95,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        }
      );
    }
  }, [targetRef, imageId, originState, originRect]);
}

/**
 * Hook for handling FLIP exit animation (modal -> card)
 *
 * @param targetRef - Ref to the modal element
 * @param onComplete - Callback when animation completes
 * @returns Function to trigger exit animation
 */
export function useFlipExit(
  targetRef: RefObject<HTMLElement>,
  onComplete?: () => void
) {
  const { originState, originRect, reset } = useTransitionStore();

  const playExitAnimation = async (): Promise<void> => {
    if (!targetRef.current) {
      onComplete?.();
      return;
    }

    return new Promise((resolve) => {
      const element = targetRef.current!;

      if (originState && originRect) {
        // Get current state
        const state = Flip.getState(element);

        // Animate back to origin
        Flip.to(state, {
          duration: 0.5,
          ease: "power2.inOut",
          scale: true,
          onComplete: () => {
            reset();
            onComplete?.();
            resolve();
          },
        });
      } else {
        // Fallback: fade out
        gsap.to(element, {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            reset();
            onComplete?.();
            resolve();
          },
        });
      }
    });
  };

  // Handle browser back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (targetRef.current) {
        // Quick fade-out for browser navigation
        gsap.to(targetRef.current, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            reset();
          },
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [targetRef, reset]);

  return playExitAnimation;
}
