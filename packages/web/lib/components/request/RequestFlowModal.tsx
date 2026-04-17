"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { gsap } from "gsap";
import { getRequestActions } from "@/lib/stores/requestStore";

export type MaxWidth = "4xl" | "5xl" | "6xl" | "7xl";

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

interface RequestFlowModalProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
}

/**
 * Modal wrapper for request flow (upload/detect) on desktop
 * Uses intercepting routes to show request pages as modal overlay
 */
export function RequestFlowModal({
  children,
  maxWidth = "4xl",
}: RequestFlowModalProps) {
  const router = useRouter();

  // Refs for animation
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // GSAP Context for cleanup
  const ctxRef = useRef<gsap.Context>(null);

  const handleClose = useCallback(() => {
    if (!ctxRef.current) return;

    ctxRef.current.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          getRequestActions().resetRequestFlow();
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        },
      });

      // Fade out backdrop and scale down modal
      tl.to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        },
        0
      );

      tl.to(
        modalRef.current,
        {
          opacity: 0,
          scale: 0.95,
          duration: 0.2,
          ease: "power2.in",
        },
        0
      );
    });
  }, [router]);

  // Mount/Enter Animation
  useEffect(() => {
    // Lock body scroll
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Initialize GSAP context — start visible to avoid flash
    ctxRef.current = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out", immediateRender: true }
      );

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.97, y: 8 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.25,
          ease: "power2.out",
          delay: 0.05,
          immediateRender: true,
        }
      );
    }, containerRef);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      ctxRef.current?.revert();
    };
  }, []);

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        data-testid="request-flow-modal-dialog"
        className={`relative z-10 flex flex-col w-full ${MAX_WIDTH_CLASS[maxWidth]} max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-transform hover:scale-105 hover:bg-accent active:scale-95"
          aria-label="Close"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
