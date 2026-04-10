/**
 * Admin audit data fetching layer (server-side only).
 *
 * No AI analysis tables exist in the database yet.
 * Returns empty data — UI shows an empty state placeholder.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuditStatus = "pending" | "completed" | "error" | "modified";

export interface AuditItem {
  id: string;
  name: string;
  category: "tops" | "bottoms" | "shoes" | "bags" | "accessories" | "outerwear";
  brand: string;
  confidence: number;
  position: { x: number; y: number };
}

export interface AuditRequest {
  id: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  status: AuditStatus;
  itemCount: number;
  items: AuditItem[];
  requestedAt: string;
  completedAt: string | null;
  errorMessage?: string;
  requestedBy: string;
}

export interface AuditListParams {
  page?: number;
  perPage?: number;
  status?: AuditStatus;
}

export interface AuditListResponse {
  data: Omit<AuditRequest, "items">[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AuditDetailResponse {
  data: AuditRequest;
}

// ─── Data fetchers (empty — no tables yet) ───────────────────────────────────

export async function fetchAuditList(
  params: AuditListParams
): Promise<AuditListResponse> {
  return {
    data: [],
    total: 0,
    page: params.page ?? 1,
    perPage: params.perPage ?? 10,
    totalPages: 0,
  };
}

export async function fetchAuditDetail(
  _requestId: string
): Promise<AuditDetailResponse | null> {
  return null;
}
