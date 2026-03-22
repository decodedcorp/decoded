/**
 * React Query hooks for admin server log data fetching.
 *
 * Two exports:
 * - useServerLogs  → /api/v1/admin/server-logs?level=X&search=Y&from=ISO&to=ISO&page=N&pageSize=M
 * - useLogStream   → Custom polling hook for real-time log streaming
 *
 * useLogStream is NOT a React Query wrapper — it manages its own interval-based
 * polling state for a terminal-style tail -f experience.
 */

import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useRef, useState, useEffect, useCallback } from "react";
import type {
  ServerLogEntry,
  ServerLogListResponse,
} from "@/lib/api/admin/server-logs";

// Re-export types for convenience
export type { ServerLogEntry };

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Paginated list hook ──────────────────────────────────────────────────────

interface UseServerLogsParams {
  level?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches a paginated, filtered list of server log entries.
 * Uses keepPreviousData to avoid table flicker during pagination.
 *
 * @param params - level, search, from, to date range, page, pageSize
 */
export function useServerLogs(
  params: UseServerLogsParams
): UseQueryResult<ServerLogListResponse> {
  const { level, search, from, to, page = 1, pageSize = 50 } = params;

  return useQuery<ServerLogListResponse>({
    queryKey: ["admin", "server-logs", "list", level, search, from, page],
    queryFn: () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (level) searchParams.set("level", level);
      if (search) searchParams.set("search", search);
      if (from) searchParams.set("from", from);
      if (to) searchParams.set("to", to);
      return adminFetch<ServerLogListResponse>(
        `/api/v1/admin/server-logs?${searchParams.toString()}`
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// ─── Streaming hook ───────────────────────────────────────────────────────────

/** Maximum number of accumulated streaming entries (trim oldest when exceeded) */
const MAX_STREAM_ENTRIES = 500;

/** Polling interval in milliseconds */
const POLL_INTERVAL_MS = 2500;

interface StreamResponse {
  entries: ServerLogEntry[];
  latestId: string;
}

interface UseLogStreamReturn {
  /** Accumulated log entries (newest appended at end) */
  entries: ServerLogEntry[];
  /** Whether the stream is active and polling */
  isStreaming: boolean;
  /** Whether polling is paused (stream started but currently stopped) */
  isPaused: boolean;
  /** Toggle between pause and resume */
  toggle: () => void;
  /** Clear all accumulated entries and reset latestId */
  clear: () => void;
  /** Explicitly start the stream (called automatically on mount) */
  start: () => void;
  /** Ref to attach to the scroll container for auto-scroll */
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom streaming hook for real-time log polling.
 *
 * Manages its own interval-based polling — NOT a React Query wrapper.
 * Auto-starts on mount. Caps accumulated entries at 500 max.
 *
 * State transitions:
 *   mount → start() → isStreaming=true, isPaused=false
 *   toggle() → isPaused=true, polling stops (entries preserved)
 *   toggle() → isPaused=false, polling resumes from latestId
 *   clear() → entries=[], latestId=null
 */
export function useLogStream(): UseLogStreamReturn {
  const [entries, setEntries] = useState<ServerLogEntry[]>([]);
  const [latestId, setLatestId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Keep latestIdRef in sync with state so polling closure always has current value
  useEffect(() => {
    latestIdRef.current = latestId;
  }, [latestId]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (latestIdRef.current) {
        params.set("since_id", latestIdRef.current);
      }
      const data = await adminFetch<StreamResponse>(
        `/api/v1/admin/server-logs/stream?${params.toString()}`
      );

      if (data.entries.length > 0) {
        setEntries((prev) => {
          const combined = [...prev, ...data.entries];
          // Cap at MAX_STREAM_ENTRIES — trim oldest (from the start)
          return combined.length > MAX_STREAM_ENTRIES
            ? combined.slice(combined.length - MAX_STREAM_ENTRIES)
            : combined;
        });
        if (data.latestId) {
          setLatestId(data.latestId);
        }
      }
    } catch {
      // Silently ignore fetch errors during streaming (network blip, etc.)
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    // Immediately poll once, then set up interval
    void poll();
    intervalRef.current = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    setIsStreaming(true);
    setIsPaused(false);
  }, [poll, stopInterval]);

  const start = useCallback(() => {
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    stopInterval();
    setIsPaused(true);
    setIsStreaming(false);
  }, [stopInterval]);

  const resume = useCallback(() => {
    startInterval();
  }, [startInterval]);

  const toggle = useCallback(() => {
    if (isPaused || !isStreaming) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, isStreaming, pause, resume]);

  const clear = useCallback(() => {
    setEntries([]);
    setLatestId(null);
    latestIdRef.current = null;
  }, []);

  // Auto-start on mount, cleanup on unmount
  useEffect(() => {
    start();
    return () => {
      stopInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { entries, isStreaming, isPaused, toggle, clear, start, scrollRef };
}
