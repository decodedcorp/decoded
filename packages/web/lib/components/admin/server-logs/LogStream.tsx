"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Trash2 } from "lucide-react";
import { useLogStream } from "@/lib/hooks/admin/useServerLogs";
import type { ServerLogEntry } from "@/lib/api/admin/server-logs";
import type { LogLevel } from "@/lib/api/admin/server-logs";

// ─── Style maps ───────────────────────────────────────────────────────────────

const LEVEL_TERMINAL_COLORS: Record<LogLevel, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-purple-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a timestamp as HH:MM:SS for terminal display */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** Pads a string to a fixed length for monospace alignment */
function pad(str: string, length: number): string {
  return str.padEnd(length).slice(0, length);
}

// ─── Log line ─────────────────────────────────────────────────────────────────

function LogLine({ entry }: { entry: ServerLogEntry }) {
  const levelColor = LEVEL_TERMINAL_COLORS[entry.level];

  return (
    <div className="leading-5 hover:bg-white/5 px-4 py-0.5 group">
      {/* [HH:MM:SS] LEVEL  METHOD ENDPOINT STATUS RESPONSEms — MESSAGE */}
      <span className="text-gray-500">
        [{formatTime(entry.timestamp)}]
      </span>{" "}
      <span className={`${levelColor} font-semibold`}>
        {pad(entry.level.toUpperCase(), 5)}
      </span>{" "}
      <span className="text-gray-300 font-semibold">
        {pad(entry.method, 6)}
      </span>
      <span className="text-gray-400">{entry.endpoint}</span>{" "}
      <span className="text-gray-300 tabular-nums">{entry.statusCode}</span>{" "}
      <span className="text-gray-500 tabular-nums">
        {entry.responseTimeMs}ms
      </span>
      {" — "}
      <span className={levelColor}>{entry.message}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Terminal-style real-time log streaming console.
 *
 * Visual design: dark background, monospace font — mimics `tail -f` experience.
 * Self-contained: uses useLogStream hook internally, no props needed.
 *
 * Features:
 * - Pulsing green dot when streaming, gray when paused
 * - Pause/Resume toggle (Play/Pause icons)
 * - Clear button (Trash2)
 * - Entry count badge
 * - Auto-scroll to bottom on new entries (stops when user scrolls up)
 * - "Jump to bottom" pill when user has scrolled up
 */
export function LogStream() {
  const { entries, isStreaming, isPaused, toggle, clear } = useLogStream();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isAutoScrollActiveRef = useRef(true);

  // Detect manual scroll up
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;

    if (isAtBottom) {
      isAutoScrollActiveRef.current = true;
      setIsUserScrolledUp(false);
    } else {
      isAutoScrollActiveRef.current = false;
      setIsUserScrolledUp(true);
    }
  }, []);

  // Auto-scroll to bottom on new entries, unless user scrolled up
  useEffect(() => {
    if (!isAutoScrollActiveRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [entries]);

  // Jump to bottom handler
  const jumpToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    isAutoScrollActiveRef.current = true;
    setIsUserScrolledUp(false);
  }, []);

  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden font-mono">
      {/* Header bar */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isStreaming && !isPaused
                ? "bg-emerald-400 animate-pulse"
                : "bg-gray-500"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-gray-200 tracking-wide">
            Live Logs
          </span>
          {isPaused && (
            <span className="text-xs text-gray-500 ml-1">(paused)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Entry count badge */}
          <span className="text-xs text-gray-500 tabular-nums">
            {entries.length.toLocaleString()} entries
          </span>

          {/* Pause/Resume toggle */}
          <button
            type="button"
            onClick={toggle}
            title={
              isPaused || !isStreaming ? "Resume streaming" : "Pause streaming"
            }
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            aria-label={isPaused || !isStreaming ? "Resume" : "Pause"}
          >
            {isPaused || !isStreaming ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={clear}
            title="Clear log output"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            aria-label="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log area */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-[400px] overflow-y-auto text-xs py-2"
        >
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-xs">
              {isStreaming && !isPaused
                ? "Waiting for log entries..."
                : "Stream paused. Press play to resume."}
            </div>
          ) : (
            entries.map((entry) => <LogLine key={entry.id} entry={entry} />)
          )}
        </div>

        {/* Jump to bottom pill */}
        {isUserScrolledUp && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={jumpToBottom}
              className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-700 transition-colors shadow-lg"
            >
              Jump to bottom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
