"use client";

import { CheckCircle, XCircle, Circle, Loader } from "lucide-react";
import { usePipelineDetail } from "@/lib/hooks/admin/usePipeline";
import type { PipelineStep, StepStatus } from "@/lib/api/admin/pipeline";

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Formats duration in milliseconds to "X.Xs" string. */
function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Formats an ISO timestamp to a short readable string. */
function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ─── Step icon ────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0"
          aria-label="Completed"
        />
      );
    case "running":
      return (
        <Loader
          className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 animate-spin"
          aria-label="Running"
        />
      );
    case "failed":
      return (
        <XCircle
          className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0"
          aria-label="Failed"
        />
      );
    case "pending":
    default:
      return (
        <Circle
          className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0"
          aria-label="Pending"
        />
      );
  }
}

// ─── Step display names ───────────────────────────────────────────────────────

const STEP_DISPLAY_NAMES: Record<string, string> = {
  upload: "Upload",
  analyze: "Analyze",
  detect: "Detect",
};

// ─── Step row ─────────────────────────────────────────────────────────────────

function StepRow({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const isPending = step.status === "pending";
  const isFailed = step.status === "failed";

  return (
    <div className="relative flex gap-3">
      {/* Vertical timeline connector line */}
      {!isLast && (
        <div
          className="absolute left-[9px] top-6 w-px bg-gray-200 dark:bg-gray-700"
          style={{ bottom: "-12px" }}
          aria-hidden="true"
        />
      )}

      {/* Step icon */}
      <div className="mt-0.5">
        <StepIcon status={step.status} />
      </div>

      {/* Step details */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-center justify-between gap-2">
          <span
            className={[
              "text-sm font-medium",
              isPending
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-900 dark:text-gray-100",
            ].join(" ")}
          >
            {STEP_DISPLAY_NAMES[step.name] ?? step.name}
          </span>
          <span
            className={[
              "text-xs tabular-nums shrink-0",
              isPending
                ? "text-gray-300 dark:text-gray-700"
                : "text-gray-500 dark:text-gray-400",
            ].join(" ")}
          >
            {formatDuration(step.durationMs)}
          </span>
        </div>

        {/* Timestamps (skip for pending/running without completedAt) */}
        {!isPending && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {step.startedAt ? `Started: ${formatTime(step.startedAt)}` : ""}
            {step.completedAt ? ` · Done: ${formatTime(step.completedAt)}` : ""}
          </p>
        )}

        {/* Error box for failed steps */}
        {isFailed && step.error && (
          <div className="mt-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-400 font-mono break-words">
              {step.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PipelineDetailProps {
  /** Pipeline ID whose steps should be fetched and displayed */
  pipelineId: string;
}

/**
 * Inline accordion content showing step-by-step pipeline execution timeline.
 * Fetches detail data via usePipelineDetail hook.
 * Shows upload → analyze → detect steps with status icons, durations, and errors.
 */
export function PipelineDetail({ pipelineId }: PipelineDetailProps) {
  const { data, isLoading } = usePipelineDetail(pipelineId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
        Pipeline details not available.
      </div>
    );
  }

  return (
    <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Execution Steps
      </p>

      <div>
        {data.steps.map((step, index) => (
          <StepRow
            key={step.name}
            step={step}
            isLast={index === data.steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
