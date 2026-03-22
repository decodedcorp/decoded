"use client";

import { toast } from "sonner";

interface CollectionShareSheetProps {
  issueId: string;
  issueTitle: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Share bottom sheet for collection issues.
 * Provides Copy Link (clipboard + toast) and Web Share (if supported).
 * Self-contained with Tailwind — no DS BottomSheet dependency.
 */
export function CollectionShareSheet({
  issueId,
  issueTitle,
  open,
  onClose,
}: CollectionShareSheetProps) {
  if (!open) return null;

  const shareUrl = `https://decoded.kr/magazine/issue/${issueId}`;
  const supportsShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleWebShare() {
    try {
      await navigator.share({ title: issueTitle, url: shareUrl });
    } catch {
      // User dismissed or share failed — no toast needed
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Share issue"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[#1a1a1a] p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag indicator */}
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <h3 className="text-white text-sm font-semibold text-center pb-1">
          Share this issue
        </h3>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/80 text-sm font-medium"
        >
          <span className="text-base">🔗</span>
          Copy Link
        </button>

        {/* Web Share — only if supported */}
        {supportsShare && (
          <button
            onClick={handleWebShare}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/80 text-sm font-medium"
          >
            <span className="text-base">↗</span>
            Share via…
          </button>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  );
}
