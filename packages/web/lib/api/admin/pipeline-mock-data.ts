/**
 * Mock data generators for AI pipeline execution logs.
 *
 * No real pipeline tracking tables exist in the database — all pipeline data is
 * generated deterministically so that the same execution index always produces
 * the same values across server restarts and requests.
 *
 * Uses the same djb2-style hashing as other admin mock-data files.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStatus = "completed" | "running" | "failed";

export type StepStatus = "completed" | "running" | "failed" | "pending";

export interface PipelineStep {
  /** Step name: upload | analyze | detect */
  name: "upload" | "analyze" | "detect";
  status: StepStatus;
  startedAt: string;
  completedAt?: string;
  /** Duration in milliseconds (only when completed or failed) */
  durationMs?: number;
  /** Error message (only when failed) */
  error?: string;
  /** Step result metadata */
  result?: Record<string, unknown>;
}

export interface PipelineExecution {
  /** Unique pipeline execution ID */
  id: string;
  /** Associated post ID */
  postId: string;
  /** Placeholder image URL */
  imageUrl: string;
  status: PipelineStatus;
  startedAt: string;
  completedAt?: string;
  /** Total duration in milliseconds (only when completed or failed) */
  totalDurationMs?: number;
  /** Ordered steps: upload → analyze → detect */
  steps: PipelineStep[];
  /** User who triggered the pipeline */
  triggerUser: string;
}

/** List view omits step details for performance (same pattern as audit list) */
export type PipelineListItem = Omit<PipelineExecution, "steps">;

// ─── Deterministic hash ───────────────────────────────────────────────────────

/**
 * Simple deterministic hash of a string → integer in [0, modulo).
 * Uses djb2-style hashing so the same input always returns the same output.
 * Reimplemented locally — not a shared import (matches ai-cost-mock-data.ts pattern).
 */
function deterministicInt(seed: string, modulo: number): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % modulo;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

const TRIGGER_USERS = [
  "Kim Minjun",
  "Lee Soyeon",
  "Park Jiwoo",
  "Choi Yuna",
  "Jung Haeun",
  "Kang Doha",
  "Yoon Siwoo",
  "Han Minji",
];

const STEP_ERROR_MESSAGES = [
  "Vision API timeout after 30s",
  "Image format not supported: .webp",
  "Rate limit exceeded (429)",
  "Model inference OOM",
  "Failed to parse model response",
  "Image resolution too low (min 512px)",
  "Network error: upstream connection reset",
];

// ─── Status distribution ──────────────────────────────────────────────────────

/**
 * Maps a pipeline index (0-29) to its deterministic PipelineStatus.
 * Distribution: ~22 completed | ~3 running | ~5 failed
 */
function statusForIndex(index: number): PipelineStatus {
  if (index <= 21) return "completed";
  if (index <= 24) return "failed";
  return "running";
}

// ─── Step generators ──────────────────────────────────────────────────────────

/**
 * Generates the 3 ordered pipeline steps (upload → analyze → detect)
 * for a given pipeline index and overall status.
 */
function generateStepsForPipeline(
  pipelineIndex: number,
  status: PipelineStatus,
  startedAt: Date
): PipelineStep[] {
  const stepNames: Array<"upload" | "analyze" | "detect"> = [
    "upload",
    "analyze",
    "detect",
  ];

  // Step duration ranges (ms): upload 1-5s, analyze 3-15s, detect 2-8s
  const durationRanges = [
    { min: 1000, max: 5000 },
    { min: 3000, max: 15000 },
    { min: 2000, max: 8000 },
  ];

  const steps: PipelineStep[] = [];
  let currentTime = new Date(startedAt);

  if (status === "completed") {
    // All 3 steps completed
    for (let s = 0; s < 3; s++) {
      const base = `pipe-${pipelineIndex}:step-${s}`;
      const range = durationRanges[s];
      const durationMs =
        range.min + deterministicInt(base + ":dur", range.max - range.min + 1);

      const stepStartedAt = new Date(currentTime);
      const stepCompletedAt = new Date(stepStartedAt.getTime() + durationMs);

      steps.push({
        name: stepNames[s],
        status: "completed",
        startedAt: stepStartedAt.toISOString(),
        completedAt: stepCompletedAt.toISOString(),
        durationMs,
        result:
          s === 0
            ? {
                uploadedBytes:
                  1024 * (100 + deterministicInt(base + ":size", 900)),
              }
            : s === 1
              ? { confidence: 0.7 + deterministicInt(base + ":conf", 28) / 100 }
              : {
                  detectedItems: 1 + deterministicInt(base + ":items", 5),
                },
      });

      currentTime = stepCompletedAt;
    }
  } else if (status === "running") {
    // Determine how many steps are complete (1 or 2), current is running
    const completedStepCount =
      1 + deterministicInt(`pipe-${pipelineIndex}:completed-count`, 2); // [1, 2]

    for (let s = 0; s < 3; s++) {
      const base = `pipe-${pipelineIndex}:step-${s}`;
      const range = durationRanges[s];

      if (s < completedStepCount) {
        // Completed step
        const durationMs =
          range.min +
          deterministicInt(base + ":dur", range.max - range.min + 1);
        const stepStartedAt = new Date(currentTime);
        const stepCompletedAt = new Date(stepStartedAt.getTime() + durationMs);

        steps.push({
          name: stepNames[s],
          status: "completed",
          startedAt: stepStartedAt.toISOString(),
          completedAt: stepCompletedAt.toISOString(),
          durationMs,
        });

        currentTime = stepCompletedAt;
      } else if (s === completedStepCount) {
        // Currently running step
        steps.push({
          name: stepNames[s],
          status: "running",
          startedAt: new Date(currentTime).toISOString(),
        });
      } else {
        // Pending step
        steps.push({
          name: stepNames[s],
          status: "pending",
          startedAt: "",
        });
      }
    }
  } else {
    // Failed: steps complete up to failure point, failed step has error
    const failedStepIndex = deterministicInt(
      `pipe-${pipelineIndex}:fail-step`,
      3
    ); // which step fails [0, 2]

    for (let s = 0; s < 3; s++) {
      const base = `pipe-${pipelineIndex}:step-${s}`;
      const range = durationRanges[s];

      if (s < failedStepIndex) {
        // Completed step before failure
        const durationMs =
          range.min +
          deterministicInt(base + ":dur", range.max - range.min + 1);
        const stepStartedAt = new Date(currentTime);
        const stepCompletedAt = new Date(stepStartedAt.getTime() + durationMs);

        steps.push({
          name: stepNames[s],
          status: "completed",
          startedAt: stepStartedAt.toISOString(),
          completedAt: stepCompletedAt.toISOString(),
          durationMs,
        });

        currentTime = stepCompletedAt;
      } else if (s === failedStepIndex) {
        // Failed step
        const durationMs =
          range.min +
          deterministicInt(base + ":fail-dur", range.max - range.min + 1);
        const stepStartedAt = new Date(currentTime);
        const stepCompletedAt = new Date(stepStartedAt.getTime() + durationMs);
        const errIndex = deterministicInt(
          base + ":err",
          STEP_ERROR_MESSAGES.length
        );

        steps.push({
          name: stepNames[s],
          status: "failed",
          startedAt: stepStartedAt.toISOString(),
          completedAt: stepCompletedAt.toISOString(),
          durationMs,
          error: STEP_ERROR_MESSAGES[errIndex],
        });

        currentTime = stepCompletedAt;
      } else {
        // Pending (never reached due to failure)
        steps.push({
          name: stepNames[s],
          status: "pending",
          startedAt: "",
        });
      }
    }
  }

  return steps;
}

// ─── Timestamp generator ──────────────────────────────────────────────────────

/**
 * Generates a deterministic startedAt timestamp for a given pipeline index.
 * Spreads 30 pipelines over the last 7 days (index 0 = most recent).
 */
function timestampForIndex(index: number): Date {
  // Index 0 = today, index 29 = 7 days ago
  const minutesAgo =
    deterministicInt(`pipe-${index}:minutes`, 10080) + // up to 7 days (7*24*60)
    index * 30; // additional spread per index

  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  d.setSeconds(0, 0);
  return d;
}

// ─── Main generators ──────────────────────────────────────────────────────────

let _cachedPipelines: PipelineExecution[] | null = null;

/**
 * Generates exactly 30 deterministic pipeline executions.
 *
 * Results are cached in-process for performance (module-level singleton).
 * Status distribution: ~22 completed | ~5 failed | ~3 running
 */
export function generatePipelines(): PipelineExecution[] {
  if (_cachedPipelines) return _cachedPipelines;

  const pipelines: PipelineExecution[] = [];

  for (let i = 0; i < 30; i++) {
    const id = `pipe-${2001 + i}`;
    const postId = `post-${5000 + deterministicInt(`pipe-${i}:post`, 500)}`;

    // Deterministic picsum image
    const imgHash = deterministicInt(`pipe-${i}:img`, 9999);
    const imageUrl = `https://picsum.photos/seed/${imgHash}/400/300`;

    const status = statusForIndex(i);
    const startedAt = timestampForIndex(i);
    const steps = generateStepsForPipeline(i, status, startedAt);

    // Pick trigger user
    const userIndex = deterministicInt(`pipe-${i}:user`, TRIGGER_USERS.length);
    const triggerUser = TRIGGER_USERS[userIndex];

    const pipeline: PipelineExecution = {
      id,
      postId,
      imageUrl,
      status,
      startedAt: startedAt.toISOString(),
      triggerUser,
      steps,
    };

    // Compute completedAt and totalDurationMs for completed/failed
    if (status === "completed" || status === "failed") {
      const lastCompletedStep = steps
        .filter((s) => s.completedAt)
        .sort(
          (a, b) =>
            new Date(b.completedAt!).getTime() -
            new Date(a.completedAt!).getTime()
        )[0];

      if (lastCompletedStep?.completedAt) {
        pipeline.completedAt = lastCompletedStep.completedAt;
        pipeline.totalDurationMs =
          new Date(lastCompletedStep.completedAt).getTime() -
          startedAt.getTime();
      }
    }

    pipelines.push(pipeline);
  }

  _cachedPipelines = pipelines;
  return pipelines;
}

/**
 * Looks up a single pipeline execution by ID.
 *
 * @param id - Pipeline ID (e.g., "pipe-2001")
 * @returns The matching PipelineExecution, or undefined if not found
 */
export function getPipelineById(id: string): PipelineExecution | undefined {
  const pipelines = generatePipelines();
  return pipelines.find((p) => p.id === id);
}
