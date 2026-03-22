"use client";

import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: React.ReactNode;
};

/**
 * LenisProvider - Smooth scrolling with GSAP Ticker integration
 *
 * Uses GSAP's ticker to update Lenis, ensuring perfect synchronization
 * between scroll and animation frames. This eliminates jitter/jump issues.
 *
 * Only use this provider in ImageDetailPage (not in modal).
 */
export function LenisProvider({ children }: Props) {
  useGSAP(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth deceleration
      smoothWheel: true,
    });

    // Critical: Update ScrollTrigger when Lenis scrolls
    lenis.on("scroll", ScrollTrigger.update);

    // Core: Integrate Lenis into GSAP's ticker (frame loop)
    // This ensures scroll and animations are perfectly synchronized
    const raf = (time: number) => {
      lenis.raf(time * 1000); // Convert seconds to milliseconds
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0); // Prevent scroll jumping

    // Cleanup
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
