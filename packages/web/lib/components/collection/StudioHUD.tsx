"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/stores/studioStore";
import { useMagazineStore } from "@/lib/stores/magazineStore";

/**
 * Fixed header overlay for The Decoded Studio.
 * Shows back button, title, and issue count badge.
 * Fades in after the Spline scene finishes loading.
 */
export function StudioHUD() {
  const router = useRouter();
  const { splineLoaded, cameraState, setCameraState } = useStudioStore();
  const issueCount = useMagazineStore((s) => s.collectionIssues.length);

  // Local visibility state for delayed unmount
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (splineLoaded) setVisible(true);
  }, [splineLoaded]);

  function handleBack() {
    // Trigger exit animation inside Spline, then navigate back after 800ms
    if (cameraState !== "exit") {
      setCameraState("exit");
    }
    setTimeout(() => router.back(), 800);
  }

  return (
    <div
      aria-label="Studio navigation"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#050505]/80 backdrop-blur-sm transition-opacity duration-500"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        <span className="text-xs tracking-wider">Back</span>
      </button>

      {/* Title */}
      <span className="text-xs font-bold uppercase tracking-wider text-white/90">
        The Decoded Studio
      </span>

      {/* Issue count badge */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full bg-[#eafd67] text-[#050505] text-xs font-bold"
        aria-label={`${issueCount} issues`}
      >
        {issueCount}
      </div>
    </div>
  );
}
