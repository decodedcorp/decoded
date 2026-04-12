"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { gsap } from "gsap";

interface UseImageModalAnimationOptions {
  imageId: string;
  reset: () => void;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  drawerRef: React.RefObject<HTMLElement | null>;
  leftImageContainerRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  router: AppRouterInstance;
}

export interface UseImageModalAnimationReturn {
  handleClose: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleMaximize: () => void;
  isClosing: boolean;
  isMaximizing: boolean;
}

/**
 * Close-only GSAP controller for ImageDetailModal.
 * Entrance is pure CSS layout — left image panel and drawer mount at final
 * position immediately, with skeletons covering data load. This hook owns:
 * - body scroll lock
 * - fade-out close animation
 * - mobile swipe-to-close gesture
 * - escape key
 * - maximize navigation
 */
export function useImageModalAnimation({
  imageId,
  reset,
  backdropRef,
  drawerRef,
  leftImageContainerRef,
  containerRef,
  scrollContainerRef,
  router,
}: UseImageModalAnimationOptions): UseImageModalAnimationReturn {
  const [isClosing, setIsClosing] = useState(false);
  const [isMaximizing, setIsMaximizing] = useState(false);
  const ctxRef = useRef<gsap.Context>(null);

  // Swipe gesture state
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  // Body scroll lock + GSAP context (used by close + swipe)
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    ctxRef.current = gsap.context(() => {}, containerRef);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      ctxRef.current?.revert();
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosing || isMaximizing || !ctxRef.current) return;
    setIsClosing(true);

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    ctxRef.current.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Hide container before navigation to prevent GSAP context revert
          // from flashing elements back to visible during unmount
          if (containerRef.current) {
            containerRef.current.style.visibility = "hidden";
          }
          gsap.delayedCall(0.05, () => {
            reset();
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          });
        },
      });

      // Fade out all elements together for a clean, synchronized close
      const targets = [backdropRef.current, drawerRef.current];
      if (isDesktop && leftImageContainerRef.current) {
        targets.push(leftImageContainerRef.current);
      }

      tl.to(targets, { opacity: 0, duration: 0.3, ease: "power3.in" }, 0);
    });
  }, [isClosing, isMaximizing, router, reset]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop > 0
    ) {
      touchStartY.current = -1;
      return;
    }

    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;

    if (drawerRef.current && ctxRef.current) {
      // Rubber-band: resist upward drag, follow downward drag
      const translateY = diff > 0 ? diff : diff * 0.15;
      const drawerHeight = drawerRef.current.offsetHeight;
      const progress = Math.min(Math.max(diff / drawerHeight, 0), 1);

      ctxRef.current.add(() => {
        gsap.set(drawerRef.current, { y: translateY });
      });

      // Fade backdrop as sheet is dragged down
      if (backdropRef.current && diff > 0) {
        ctxRef.current.add(() => {
          gsap.set(backdropRef.current, { opacity: 1 - progress * 0.6 });
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    const diff = touchCurrentY.current - touchStartY.current;
    const elapsed = Date.now() - touchStartTime.current;
    const velocity = diff / Math.max(elapsed, 1); // px/ms

    // Close if: dragged far enough OR fast flick downward
    const shouldClose = diff > 100 || (velocity > 0.5 && diff > 30);

    if (shouldClose && drawerRef.current && ctxRef.current) {
      // Slide down to close (not fade)
      setIsClosing(true);
      ctxRef.current.add(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            // Hide container before navigation to prevent GSAP revert flash
            if (containerRef.current) {
              containerRef.current.style.visibility = "hidden";
            }
            gsap.delayedCall(0.05, () => {
              reset();
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            });
          },
        });
        tl.to(
          drawerRef.current,
          { y: "100%", duration: 0.25, ease: "power2.in" },
          0
        );
        tl.to(
          backdropRef.current,
          { opacity: 0, duration: 0.25, ease: "power2.in" },
          0
        );
      });
    } else if (drawerRef.current && ctxRef.current) {
      // Snap back with spring
      ctxRef.current.add(() => {
        gsap.to(drawerRef.current, {
          y: 0,
          duration: 0.35,
          ease: "back.out(1.2)",
        });
        if (backdropRef.current) {
          gsap.to(backdropRef.current, {
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          });
        }
      });
    }

    touchStartY.current = 0;
    touchCurrentY.current = 0;
    touchStartTime.current = 0;
  };

  const handleMaximize = useCallback(() => {
    if (isClosing || isMaximizing || !ctxRef.current) return;
    setIsMaximizing(true);

    // Instant transition — hide modal elements and navigate immediately.
    // The full page has its own fade-in animation for a smooth entry.
    if (drawerRef.current) drawerRef.current.style.opacity = "0";
    if (leftImageContainerRef.current)
      leftImageContainerRef.current.style.opacity = "0";
    reset();
    window.location.href = `/posts/${imageId}`;
  }, [isClosing, isMaximizing, imageId, reset]);

  return {
    handleClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMaximize,
    isClosing,
    isMaximizing,
  };
}
