/**
 * URL ↔ Store Synchronization Hook for Search
 *
 * Handles bidirectional sync between URL query parameters and search store.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSearchStore } from "@decoded/shared";

/**
 * Hook to synchronize search state with URL parameters
 *
 * @param options.skipInitialSync - Skip syncing URL to store on mount (useful for SSR)
 * @param options.replaceState - Use replaceState instead of pushState for URL updates
 */
export function useSearchURLSync(options?: {
  skipInitialSync?: boolean;
  replaceState?: boolean;
}) {
  const { skipInitialSync = false, replaceState = true } = options || {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFromURLParams = useSearchStore((s) => s.setFromURLParams);
  const getURLParams = useSearchStore((s) => s.getURLParams);
  const debouncedQuery = useSearchStore((s) => s.debouncedQuery);
  const activeTab = useSearchStore((s) => s.activeTab);
  const filters = useSearchStore((s) => s.filters);
  const page = useSearchStore((s) => s.page);

  // Track if initial sync has been done
  const initialSyncDone = useRef(false);
  // Track if we're currently updating URL (to prevent loops)
  const isUpdatingURL = useRef(false);

  // Sync URL → Store on mount and when URL changes
  useEffect(() => {
    if (skipInitialSync && !initialSyncDone.current) {
      initialSyncDone.current = true;
      return;
    }

    // Prevent sync loop
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    // Only sync on /search page
    if (!pathname?.startsWith("/search")) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() || "");
    setFromURLParams(params);
    initialSyncDone.current = true;
  }, [searchParams, pathname, setFromURLParams, skipInitialSync]);

  // Sync Store → URL when store changes
  useEffect(() => {
    // Only sync on /search page
    if (!pathname?.startsWith("/search")) {
      return;
    }

    // Wait for initial sync
    if (!initialSyncDone.current) {
      return;
    }

    const newParams = getURLParams();
    const currentParams = new URLSearchParams(searchParams?.toString() || "");

    // Compare params to avoid unnecessary updates
    if (newParams.toString() === currentParams.toString()) {
      return;
    }

    // Mark that we're updating URL
    isUpdatingURL.current = true;

    const newURL = newParams.toString()
      ? `${pathname}?${newParams.toString()}`
      : pathname;

    if (replaceState) {
      router.replace(newURL, { scroll: false });
    } else {
      router.push(newURL, { scroll: false });
    }
  }, [
    debouncedQuery,
    activeTab,
    filters,
    page,
    pathname,
    searchParams,
    router,
    getURLParams,
    replaceState,
  ]);
}

/**
 * Hook to get search params for navigation
 * Returns a function that builds the search URL with current query
 */
export function useSearchNavigation() {
  const getURLParams = useSearchStore((s) => s.getURLParams);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
  const router = useRouter();

  const navigateToSearch = useCallback(
    (query: string) => {
      // Update store immediately
      setQuery(query);
      setDebouncedQuery(query);

      // Navigate to search page with query
      const params = new URLSearchParams();
      if (query) params.set("q", query);

      const url = params.toString()
        ? `/search?${params.toString()}`
        : "/search";
      router.push(url);
    },
    [router, setQuery, setDebouncedQuery]
  );

  const getSearchURL = useCallback(
    (query?: string) => {
      if (query !== undefined) {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        return params.toString() ? `/search?${params.toString()}` : "/search";
      }

      const params = getURLParams();
      return params.toString() ? `/search?${params.toString()}` : "/search";
    },
    [getURLParams]
  );

  return {
    navigateToSearch,
    getSearchURL,
  };
}

/**
 * Hook to initialize search store from URL on server-side
 * Call this in page.tsx to hydrate the store with URL params
 */
export function useSearchStoreHydration(searchParams: URLSearchParams) {
  const setFromURLParams = useSearchStore((s) => s.setFromURLParams);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!hasHydrated.current) {
      setFromURLParams(searchParams);
      hasHydrated.current = true;
    }
  }, [searchParams, setFromURLParams]);
}
