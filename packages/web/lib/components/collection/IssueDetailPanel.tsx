"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStudioStore } from "@/lib/stores/studioStore";
import { useMagazineStore } from "@/lib/stores/magazineStore";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { CollectionShareSheet } from "./CollectionShareSheet";

/**
 * IssueDetailPanel — 2D HTML overlay for the focused magazine issue.
 *
 * Mobile (<768px): bottom sheet, slides up from bottom.
 * Desktop (>=768px): right sidebar, slides in from right.
 *
 * Self-manages visibility via studioStore.cameraState === "focused".
 */
export function IssueDetailPanel() {
  const router = useRouter();
  const { cameraState, focusedIssueId, unfocus } = useStudioStore();
  const { collectionIssues, removeFromCollection } = useMagazineStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const visible = cameraState === "focused" && focusedIssueId !== null;
  const issue = focusedIssueId
    ? (collectionIssues.find((i) => i.id === focusedIssueId) ?? null)
    : null;

  if (!visible || !issue) return null;

  const volumeLabel = `Vol.${String(issue.issue_number).padStart(2, "0")}`;
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(issue.generated_at));

  function handleOpen() {
    router.push(`/magazine/issue/${issue!.id}`);
  }

  function handleRemoveConfirmed() {
    // Mock API call — real endpoint not yet implemented
    console.log("DELETE /api/v1/magazine/collection/" + issue!.id);
    removeFromCollection(issue!.id);
    unfocus();
    toast.success("Issue removed from collection");
    setShowConfirm(false);
  }

  // Slide-in animation classes
  const panelTransform = isDesktop ? "translate-x-0" : "translate-y-0";

  const baseClasses = isDesktop
    ? "fixed top-0 right-0 bottom-0 w-80 z-40 flex flex-col"
    : "fixed bottom-0 left-0 right-0 z-40 flex flex-col";

  const animationClasses = "transition-transform duration-300 ease-out";

  return (
    <>
      <div
        className={`${baseClasses} ${animationClasses} ${panelTransform}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`
            bg-[#0d0d0d]/90 backdrop-blur-xl border-white/10 h-full
            ${isDesktop ? "border-l rounded-none" : "border-t rounded-t-2xl"}
            border p-5 flex flex-col gap-4 overflow-y-auto
          `}
        >
          {/* Close handle — mobile only */}
          {!isDesktop && (
            <div className="flex justify-center pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
          )}

          {/* Volume + title + date */}
          <div className="space-y-1">
            <p className="text-[#eafd67] text-xs font-bold tracking-[0.15em] uppercase">
              {volumeLabel}
            </p>
            <h2 className="text-white text-lg font-bold leading-snug">
              {issue.title}
            </h2>
            <p className="text-white/40 text-xs">{dateLabel}</p>
          </div>

          {/* Theme keywords */}
          {issue.theme_keywords && issue.theme_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {issue.theme_keywords.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/50 border border-white/10"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!showConfirm ? (
            <div className="flex flex-col gap-2 mt-auto">
              {/* Open Magazine — primary */}
              <button
                onClick={handleOpen}
                className="w-full py-3 text-sm font-semibold rounded-xl bg-[#eafd67] text-[#050505] hover:bg-[#eafd67]/90 transition-colors"
              >
                Open Magazine
              </button>

              <div className="flex gap-2">
                {/* Share — secondary */}
                <button
                  onClick={() => setShowShareSheet(true)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
                >
                  Share
                </button>

                {/* Remove — destructive */}
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-red-500/30 text-red-400/80 hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            /* Inline remove confirmation */
            <div className="mt-auto p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
              <p className="text-white/80 text-sm font-medium">
                Remove &ldquo;{issue.title}&rdquo;?
              </p>
              <p className="text-white/40 text-xs">
                This will be removed from your collection.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-white/20 text-white/60 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveConfirmed}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share sheet */}
      {showShareSheet && (
        <CollectionShareSheet
          issueId={issue.id}
          issueTitle={issue.title}
          open={showShareSheet}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </>
  );
}
