"use client";

import { useState, useRef, useEffect } from "react";
import {
  useAdoptSolution,
  useUnadoptSolution,
  type AdoptSolutionVariables,
} from "@/lib/hooks/useSolutions";

export interface UseAdoptDropdownReturn {
  adoptTargetId: string | null;
  setAdoptTargetId: React.Dispatch<React.SetStateAction<string | null>>;
  adoptDropdownRef: React.RefObject<HTMLDivElement | null>;
  handleAdopt: (variables: AdoptSolutionVariables, onSuccess?: () => void) => void;
  handleUnadopt: (solutionId: string, spotId: string) => void;
  adoptMutation: ReturnType<typeof useAdoptSolution>;
  unadoptMutation: ReturnType<typeof useUnadoptSolution>;
}

/**
 * Manages adopt dropdown state, click-outside detection, and adopt/unadopt mutations.
 */
export function useAdoptDropdown(
  spotId: string | null | undefined
): UseAdoptDropdownReturn {
  const [adoptTargetId, setAdoptTargetId] = useState<string | null>(null);
  const adoptDropdownRef = useRef<HTMLDivElement>(null);
  const adoptMutation = useAdoptSolution();
  const unadoptMutation = useUnadoptSolution();

  // Close dropdown when clicking outside of it
  useEffect(() => {
    if (!adoptTargetId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        adoptDropdownRef.current &&
        !adoptDropdownRef.current.contains(e.target as Node)
      ) {
        setAdoptTargetId(null);
      }
    };

    // click fires after mousedown so no delay is needed — register directly.
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [adoptTargetId]);

  const handleAdopt = (
    variables: AdoptSolutionVariables,
    onSuccess?: () => void
  ) => {
    adoptMutation.mutate(variables, { onSuccess });
  };

  const handleUnadopt = (solutionId: string, targetSpotId: string) => {
    unadoptMutation.mutate({ solutionId, spotId: targetSpotId });
  };

  return {
    adoptTargetId,
    setAdoptTargetId,
    adoptDropdownRef,
    handleAdopt,
    handleUnadopt,
    adoptMutation,
    unadoptMutation,
  };
}
