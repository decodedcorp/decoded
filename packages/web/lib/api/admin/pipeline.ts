/**
 * Admin pipeline data fetching layer (server-side only).
 *
 * All data is mock — no real pipeline tracking tables exist in the database.
 * Provides paginated list and detail retrieval with status filtering.
 */

import {
  generatePipelines,
  getPipelineById,
  type PipelineExecution,
  type PipelineListItem,
  type PipelineStatus,
  type PipelineStep,
  type StepStatus,
} from "./pipeline-mock-data";

// Re-export types so consumers only need to import from this module
export type {
  PipelineExecution,
  PipelineListItem,
  PipelineStatus,
  PipelineStep,
  StepStatus,
};

// ─── Request/response types ───────────────────────────────────────────────────

export interface PipelineListParams {
  /** 1-based page number (default 1) */
  page?: number;
  /** Items per page (default 15) */
  pageSize?: number;
  /** Filter by status (optional, undefined = all) */
  status?: PipelineStatus;
}

export interface PipelineListResponse {
  /** List view omits step details for performance */
  data: PipelineListItem[];
  /** Total matching records (for pagination) */
  total: number;
  page: number;
  pageSize: number;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of pipeline executions.
 *
 * Supports optional status filtering and pagination via page/pageSize params.
 * Results are sorted by startedAt descending (most recent first).
 */
export async function fetchPipelines(
  params: PipelineListParams
): Promise<PipelineListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 15));

  // Get all 30 mock pipelines
  let pipelines = generatePipelines();

  // Apply status filter if provided
  if (params.status !== undefined) {
    pipelines = pipelines.filter((p) => p.status === params.status);
  }

  // Sort by startedAt descending (most recent first)
  pipelines = [...pipelines].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const total = pipelines.length;

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const pageSlice = pipelines.slice(startIndex, startIndex + pageSize);

  // Strip steps array — not needed in list view
  const data: PipelineListItem[] = pageSlice.map(
    ({ steps: _steps, ...rest }) => rest
  );

  return {
    data,
    total,
    page,
    pageSize,
  };
}

/**
 * Fetches a single pipeline execution with full step details.
 *
 * @param id - Pipeline ID (e.g., "pipe-2001")
 * @returns Full PipelineExecution with steps, or null if not found
 */
export async function fetchPipelineDetail(
  id: string
): Promise<PipelineExecution | null> {
  const pipeline = getPipelineById(id);
  return pipeline ?? null;
}
