import { useState, useEffect } from "react";

/**
 * Hook for responsive design - detects if a media query matches
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

// Predefined breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const;

/**
 * Hook for detecting mobile viewport
 * @returns boolean - true if viewport is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(breakpoints.md);
}

/**
 * Hook for detecting tablet viewport
 * @returns boolean - true if viewport is tablet (>= 768px and < 1024px)
 */
export function useIsTablet(): boolean {
  const isMdOrLarger = useMediaQuery(breakpoints.md);
  const isLgOrLarger = useMediaQuery(breakpoints.lg);
  return isMdOrLarger && !isLgOrLarger;
}

/**
 * Hook for detecting desktop viewport
 * @returns boolean - true if viewport is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(breakpoints.lg);
}
