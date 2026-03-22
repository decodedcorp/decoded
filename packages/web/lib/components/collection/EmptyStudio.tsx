"use client";

import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/stores/studioStore";
import { useMagazineStore } from "@/lib/stores/magazineStore";

/**
 * EmptyStudio — centered HTML overlay on the Spline canvas for empty collection.
 * Only renders when collectionIssues.length === 0 AND splineLoaded.
 * Spline shows the empty room scene beneath this overlay.
 */
export function EmptyStudio() {
  const router = useRouter();
  const splineLoaded = useStudioStore((s) => s.splineLoaded);
  const collectionIssues = useMagazineStore((s) => s.collectionIssues);

  if (!splineLoaded || collectionIssues.length !== 0) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex flex-col items-center gap-5 text-center px-6"
        style={{ pointerEvents: "auto" }}
      >
        <p className="text-white/60 text-lg font-medium">
          Your studio is waiting
        </p>

        <button
          onClick={() => router.push("/magazine/personal")}
          className="px-6 py-3 rounded-full bg-[#eafd67] text-[#050505] text-sm font-bold hover:bg-[#eafd67]/90 transition-colors"
        >
          Generate First Issue
        </button>
      </div>
    </div>
  );
}
