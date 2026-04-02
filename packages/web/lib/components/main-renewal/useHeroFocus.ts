"use client";

import { useState, useCallback, useRef } from "react";

/** Global z-index counter — increments on every card interaction */
let globalZCounter = 100;

export function useHeroFocus() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const toggleFocus = useCallback((id: string) => {
    setFocusedId((prev) => (prev === id ? null : id));
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedId(null);
  }, []);

  const isFocused = useCallback((id: string) => focusedId === id, [focusedId]);

  const isDimmed = useCallback(
    (id: string) => focusedId !== null && focusedId !== id,
    [focusedId]
  );

  /** Get next z-index for any interaction (grab, click, etc.) */
  const bumpZ = useCallback(() => {
    globalZCounter += 1;
    return globalZCounter;
  }, []);

  return { focusedId, toggleFocus, clearFocus, isFocused, isDimmed, bumpZ };
}
