"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepare, layout } from "@chenglou/pretext";

// ============================================================
// Types
// ============================================================

type PreparedHandle = ReturnType<typeof prepare>;

interface TextLayout {
  height: number;
  lineCount: number;
}

interface UseTextLayoutOptions {
  text: string;
  font: string;
  lineHeight: number;
}

interface UseTextLayoutResult extends TextLayout {
  /** Ref to attach to the container element for width tracking */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Current container width */
  containerWidth: number;
  /** The prepared handle for advanced usage */
  handle: PreparedHandle | null;
}

// ============================================================
// useContainerWidth — tracks element width via ResizeObserver
// ============================================================

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    // Set initial width
    setWidth(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

// ============================================================
// useTextLayout — measure text height without DOM reflow
// ============================================================

/**
 * Measures multiline text layout using Pretext.js.
 * Uses Canvas-based arithmetic for ~500x faster measurement than DOM.
 *
 * @example
 * ```tsx
 * const { containerRef, height, lineCount } = useTextLayout({
 *   text: "뉴진스 해린의 스트리트 무드",
 *   font: '24px "Playfair Display"',
 *   lineHeight: 32,
 * });
 *
 * return <div ref={containerRef} style={{ height }}>{text}</div>;
 * ```
 */
export function useTextLayout({
  text,
  font,
  lineHeight,
}: UseTextLayoutOptions): UseTextLayoutResult {
  const { ref, width } = useContainerWidth();

  // Cache the prepared handle — only recompute when text or font changes
  const handle = useMemo(() => {
    if (!text) return null;
    return prepare(text, font);
  }, [text, font]);

  // Calculate layout whenever handle or container width changes
  const result = useMemo<TextLayout>(() => {
    if (!handle || width <= 0) {
      return { height: 0, lineCount: 0 };
    }
    return layout(handle, width, lineHeight);
  }, [handle, width, lineHeight]);

  return {
    ...result,
    containerRef: ref,
    containerWidth: width,
    handle,
  };
}

// ============================================================
// useBatchTextLayout — measure multiple texts at once
// ============================================================

interface BatchTextItem {
  key: string;
  text: string;
}

interface BatchLayoutResult {
  [key: string]: TextLayout;
}

/**
 * Measure multiple texts sharing the same font and container width.
 * Useful for item lists, tag groups, etc.
 */
export function useBatchTextLayout({
  items,
  font,
  lineHeight,
  containerWidth,
}: {
  items: BatchTextItem[];
  font: string;
  lineHeight: number;
  containerWidth: number;
}): BatchLayoutResult {
  return useMemo(() => {
    if (containerWidth <= 0) return {};

    const results: BatchLayoutResult = {};
    for (const item of items) {
      if (!item.text) {
        results[item.key] = { height: 0, lineCount: 0 };
        continue;
      }
      const handle = prepare(item.text, font);
      results[item.key] = layout(handle, containerWidth, lineHeight);
    }
    return results;
  }, [items, font, lineHeight, containerWidth]);
}

// ============================================================
// useTextTruncation — smart truncation based on measured lines
// ============================================================

/**
 * Calculate if text needs truncation and at how many lines.
 */
export function useTextTruncation({
  text,
  font,
  lineHeight,
  containerWidth,
  maxLines,
}: {
  text: string;
  font: string;
  lineHeight: number;
  containerWidth: number;
  maxLines: number;
}): {
  isTruncated: boolean;
  totalLines: number;
  clampedHeight: number;
} {
  return useMemo(() => {
    if (!text || containerWidth <= 0) {
      return { isTruncated: false, totalLines: 0, clampedHeight: 0 };
    }

    const handle = prepare(text, font);
    const { lineCount } = layout(handle, containerWidth, lineHeight);

    return {
      isTruncated: lineCount > maxLines,
      totalLines: lineCount,
      clampedHeight: Math.min(lineCount, maxLines) * lineHeight,
    };
  }, [text, font, lineHeight, containerWidth, maxLines]);
}

// Re-export pretext primitives for advanced usage
export { prepare, layout } from "@chenglou/pretext";
