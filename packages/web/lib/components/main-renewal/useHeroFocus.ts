"use client";

import { useState, useCallback } from "react";

export function useHeroFocus() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const toggleFocus = useCallback((id: string) => {
    setFocusedId((prev) => (prev === id ? null : id));
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedId(null);
  }, []);

  const isFocused = useCallback(
    (id: string) => focusedId === id,
    [focusedId],
  );

  const isDimmed = useCallback(
    (id: string) => focusedId !== null && focusedId !== id,
    [focusedId],
  );

  return { focusedId, toggleFocus, clearFocus, isFocused, isDimmed };
}
