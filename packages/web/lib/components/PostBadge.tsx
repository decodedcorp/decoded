"use client";

import type { PostSource } from "./ThiingsGrid";

type PostBadgeProps = {
  account: string;
  source: PostSource;
  onClick?: () => void;
};

/**
 * PostBadge Component
 *
 * Displays post source badge with glassmorphism design
 * - Post-based images: Colored badge with account name (clickable)
 * - Legacy images: Grayscale badge with "Legacy" label (non-clickable)
 */
export function PostBadge({ account, source, onClick }: PostBadgeProps) {
  const isLegacy = source === "legacy";

  // Base glassmorphism style for readability over any background
  const baseStyle = "backdrop-blur-md border border-white/20";

  // Color variants based on account
  const colorStyle = isLegacy
    ? "bg-gray-500/60 text-gray-100 grayscale opacity-70" // Visual de-emphasis
    : account === "newjeanscloset"
      ? "bg-blue-500/60 text-blue-100"
      : account === "blackpinkk.style"
        ? "bg-pink-500/60 text-pink-100"
        : "bg-purple-500/60 text-purple-100"; // Default for other accounts

  return (
    <button
      onClick={onClick}
      disabled={isLegacy} // Legacy badges not clickable (no post to navigate to)
      className={`
        ${baseStyle}
        ${colorStyle}
        rounded-full px-2 py-0.5 text-[10px] font-medium
        transition-transform
        ${isLegacy ? "cursor-default" : "hover:scale-105 active:scale-95"}
      `}
      title={
        isLegacy ? "Imported content (no post)" : `View posts from ${account}`
      }
      type="button"
    >
      {isLegacy ? "Legacy" : account}
    </button>
  );
}
