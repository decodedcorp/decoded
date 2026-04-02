"use client";

import { useState, useEffect } from "react";

export interface ImageDimensions {
  width: number | undefined;
  height: number | undefined;
  loading: boolean;
}

// --- Global memory cache ---
const memoryCache = new Map<string, { w: number; h: number }>();
const inflight = new Map<string, Promise<{ w: number; h: number }>>();

const LS_PREFIX = "img-dims:";
const LS_MAX_ENTRIES = 500;
const LS_EVICT_COUNT = 100;

// djb2 hash → short hex string for localStorage keys
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep as unsigned 32-bit
  }
  return hash.toString(16);
}

function lsKey(url: string): string {
  return `${LS_PREFIX}${djb2Hash(url)}`;
}

// Read from localStorage, returns null on any failure
function readFromLS(url: string): { w: number; h: number } | null {
  try {
    const raw = localStorage.getItem(lsKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "w" in parsed &&
      "h" in parsed &&
      typeof (parsed as { w: unknown }).w === "number" &&
      typeof (parsed as { h: unknown }).h === "number"
    ) {
      return parsed as { w: number; h: number };
    }
    return null;
  } catch {
    return null;
  }
}

// Write to localStorage with LRU eviction on overflow
function writeToLS(url: string, dims: { w: number; h: number }): void {
  try {
    // Evict oldest entries if we are at the limit
    const allKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(LS_PREFIX)
    );
    if (allKeys.length >= LS_MAX_ENTRIES) {
      // Remove the first LS_EVICT_COUNT entries (insertion order approximation)
      allKeys.slice(0, LS_EVICT_COUNT).forEach((k) => localStorage.removeItem(k));
    }
    localStorage.setItem(lsKey(url), JSON.stringify(dims));
  } catch {
    // localStorage unavailable (SSR, private mode quota exceeded) — ignore
  }
}

// Detect image dimensions; deduplicates concurrent requests for the same URL
function detectDimensions(url: string): Promise<{ w: number; h: number }> {
  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  }).finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, promise);
  return promise;
}

// Synchronously resolve from caches (memory → localStorage)
function resolveSync(url: string): { w: number; h: number } | null {
  const mem = memoryCache.get(url);
  if (mem) return mem;

  const ls = readFromLS(url);
  if (ls) {
    // Populate memory cache for next render
    memoryCache.set(url, ls);
    return ls;
  }

  return null;
}

export function useImageDimensions(
  url: string | null | undefined
): ImageDimensions {
  const [state, setState] = useState<ImageDimensions>(() => {
    if (!url) return { width: undefined, height: undefined, loading: false };

    const cached = resolveSync(url);
    if (cached) {
      return { width: cached.w, height: cached.h, loading: false };
    }

    return { width: undefined, height: undefined, loading: true };
  });

  useEffect(() => {
    if (!url) {
      setState({ width: undefined, height: undefined, loading: false });
      return;
    }

    // Already resolved (state initializer found it)
    if (state.width !== undefined && !state.loading) return;

    // Check caches again in case another hook instance resolved between render and effect
    const cached = resolveSync(url);
    if (cached) {
      setState({ width: cached.w, height: cached.h, loading: false });
      return;
    }

    let cancelled = false;

    detectDimensions(url)
      .then((dims) => {
        if (cancelled) return;
        memoryCache.set(url, dims);
        writeToLS(url, dims);
        setState({ width: dims.w, height: dims.h, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ width: undefined, height: undefined, loading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
}
