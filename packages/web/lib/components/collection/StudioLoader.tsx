"use client";

import { useState, useEffect } from "react";

interface StudioLoaderProps {
  /** When false, fades out and unmounts after 300ms transition */
  visible?: boolean;
}

/**
 * Full-screen loading screen for the Spline studio scene.
 * Shows a neon #eafd67 shimmer progress bar on a dark #050505 background.
 */
export function StudioLoader({ visible = true }: StudioLoaderProps) {
  // Tracks whether the DOM node should still be rendered (delayed unmount)
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!visible) {
      // Wait for the CSS opacity transition to finish before unmounting
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Neon shimmer progress bar */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#eafd67] rounded-full"
          style={{
            animation: "studio-loader-slide 1.5s ease-in-out infinite",
          }}
        />
      </div>

      <p className="text-white/40 text-xs tracking-wider">
        Loading your studio...
      </p>

      {/* Shimmer keyframes: bar sweeps left → right */}
      <style jsx>{`
        @keyframes studio-loader-slide {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
