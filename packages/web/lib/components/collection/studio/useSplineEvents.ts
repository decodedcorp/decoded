"use client";

import { useEffect, useCallback } from "react";
import type { SplineEvent } from "@splinetool/react-spline";
import { useMagazineStore } from "@/lib/stores/magazineStore";
import { useStudioStore } from "@/lib/stores/studioStore";

/**
 * Maps Spline interaction events to studioStore semantic actions.
 * - mouseDown on Magazine_N -> focusIssue(id)
 * - mouseDown on empty/non-book -> unfocus()
 * - mouseHover -> cursor style
 * - Escape key -> unfocus()
 */
export function useSplineEvents(onBookClick?: (index: number) => void) {
  const { focusedIssueId, focusIssue, unfocus } = useStudioStore();
  const collectionIssues = useMagazineStore((s) => s.collectionIssues);

  const handleMouseDown = useCallback(
    (e: SplineEvent) => {
      const name = e?.target?.name;

      if (!name) {
        // Clicked empty canvas — unfocus if focused
        if (focusedIssueId) unfocus();
        return;
      }

      const match = name.match(/Magazine_(\d+)/i);
      if (match) {
        const index = parseInt(match[1], 10) - 1;
        const issue = collectionIssues[index];
        if (issue) {
          focusIssue(issue.id);
          onBookClick?.(index);
        }
      } else if (focusedIssueId) {
        // Clicked non-book object — unfocus
        unfocus();
      }
    },
    [collectionIssues, focusedIssueId, focusIssue, unfocus, onBookClick]
  );

  const handleMouseHover = useCallback((e: SplineEvent) => {
    const name = e?.target?.name;
    const isMagazine = name && /Magazine_\d+/i.test(name);
    document.body.style.cursor = isMagazine ? "pointer" : "default";
  }, []);

  // Escape key -> unfocus when in focused state
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && focusedIssueId) unfocus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIssueId, unfocus]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return { handleMouseDown, handleMouseHover };
}
