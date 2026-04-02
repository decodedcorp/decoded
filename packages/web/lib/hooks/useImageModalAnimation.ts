"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { gsap } from "gsap";

interface UseImageModalAnimationOptions {
  imageId: string;
  activeImageSrc: string | null | undefined;
  originRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
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
 * Owns the GSAP context for ImageDetailModal.
 * Manages mount/close animation, touch swipe gesture, and maximize navigation.
 * The ctxRef is created in the mount effect and reverted on cleanup.
 */
export function useImageModalAnimation({
  imageId,
  activeImageSrc,
  originRect,
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

  // Mount/Enter Animation — creates the GSAP context that all other animations add to
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    ctxRef.current = gsap.context(() => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;

      gsap.set(backdropRef.current, { opacity: 0 });

      if (isDesktop) {
        gsap.set(drawerRef.current, { x: "100%", y: 0 });
      } else {
        gsap.set(drawerRef.current, { x: 0, y: "100%" });
      }

      const tl = gsap.timeline();
      tl.to(
        backdropRef.current,
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        0
      ).to(
        drawerRef.current,
        { x: "0%", y: "0%", duration: 0.5, ease: "power3.out" },
        0.1
      );
    }, containerRef);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      ctxRef.current?.revert();
    };
  }, []);

  // Floating Image Entry Animation (runs when image source becomes available, desktop only)
  useEffect(() => {
    if (!activeImageSrc || !leftImageContainerRef.current) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let drawerWidth: number;
    if (viewportWidth >= 1280) {
      drawerWidth = 700;
    } else if (viewportWidth >= 1024) {
      drawerWidth = 600;
    } else {
      drawerWidth = viewportWidth * 0.5;
    }

    const leftSpace = viewportWidth - drawerWidth;
    const targetWidth = Math.min(leftSpace * 0.7, 500);
    const targetHeight = viewportHeight * 0.75;

    const targetProps = {
      top: (viewportHeight - targetHeight) / 2,
      left: (leftSpace - targetWidth) / 2,
      width: targetWidth,
      height: targetHeight,
      borderRadius: "0.5rem",
    };

    if (originRect) {
      gsap.set(leftImageContainerRef.current, {
        position: "fixed",
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        borderRadius: "0.75rem",
        zIndex: 60,
        opacity: 1,
      });

      const tl = gsap.timeline();
      tl.to(leftImageContainerRef.current, {
        ...targetProps,
        duration: 0.6,
        ease: "power3.inOut",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      });
      tl.to(
        leftImageContainerRef.current,
        {
          scale: 1.02,
          duration: 0.3,
          ease: "power1.out",
          yoyo: true,
          repeat: 1,
        },
        0
      );
    } else {
      gsap.set(leftImageContainerRef.current, {
        position: "fixed",
        ...targetProps,
        zIndex: 60,
        opacity: 1,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      });
    }
  }, [activeImageSrc, originRect]);

  const handleClose = useCallback(() => {
    if (isClosing || isMaximizing || !ctxRef.current) return;
    setIsClosing(true);

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    ctxRef.current.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
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
  }, [isClosing, isMaximizing, router, originRect, reset]);

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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;

    if (diff > 0 && drawerRef.current && ctxRef.current) {
      ctxRef.current.add(() => {
        gsap.set(drawerRef.current, { y: diff });
      });
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    const diff = touchCurrentY.current - touchStartY.current;

    if (diff > 100) {
      handleClose();
    } else if (diff > 0 && drawerRef.current && ctxRef.current) {
      ctxRef.current.add(() => {
        gsap.to(drawerRef.current, { y: 0, duration: 0.3, ease: "power2.out" });
      });
    }

    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  const handleMaximize = useCallback(() => {
    if (isClosing || isMaximizing || !ctxRef.current) return;
    setIsMaximizing(true);

    // Instant transition — hide modal elements and navigate immediately.
    // The full page has its own fade-in animation for a smooth entry.
    if (drawerRef.current) drawerRef.current.style.opacity = "0";
    if (leftImageContainerRef.current) leftImageContainerRef.current.style.opacity = "0";
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
