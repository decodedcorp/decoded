/**
 * Admin pipeline data fetching layer (server-side only).
 *
 * No pipeline tracking tables exist in the database yet.
 * Returns empty data — UI shows an empty state placeholder.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PipelineStatus = "completed" | "running" | "failed";
export type StepStatus = "completed" | "running" | "failed" | "pending";

export interface PipelineStep {
  name: "upload" | "analyze" | "detect";
  status: StepStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  result?: Record<string, unknown>;
}

export interface PipelineExecution {
  id: string;
  postId: string;
  imageUrl: string;
  status: PipelineStatus;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  steps: PipelineStep[];
  triggerUser: string;
}

export type PipelineListItem = Omit<PipelineExecution, "steps">;

export interface PipelineListParams {
  page?: number;
  pageSize?: number;
  status?: PipelineStatus;
}

export interface PipelineListResponse {
  data: PipelineListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Data fetchers (empty — no tables yet) ───────────────────────────────────

export async function fetchPipelines(
  params: PipelineListParams
): Promise<PipelineListResponse> {
  return {
    data: [],
    total: 0,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 15,
  };
}

export async function fetchPipelineDetail(
  _id: string
): Promise<PipelineExecution | null> {
  return null;
}
