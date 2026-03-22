/**
 * Admin audit data fetching layer (server-side only).
 *
 * All data is mock — no real AI analysis tables exist in the database.
 * Provides paginated list and detail retrieval with status filtering.
 */

import {
  generateAuditRequests,
  getAuditRequestById,
  type AuditRequest,
  type AuditItem,
  type AuditStatus,
} from "./audit-mock-data";

// Re-export types so consumers only need to import from this module
export type { AuditRequest, AuditItem, AuditStatus };

// ─── Request/response types ───────────────────────────────────────────────────

export interface AuditListParams {
  /** 1-based page number (default 1) */
  page?: number;
  /** Items per page (default 10, max 50) */
  perPage?: number;
  /** Filter by status (optional, undefined = all) */
  status?: AuditStatus;
}

export interface AuditListResponse {
  /** List view omits full item details for performance */
  data: Omit<AuditRequest, "items">[];
  /** Total matching records (for pagination) */
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AuditDetailResponse {
  /** Full request including items array */
  data: AuditRequest;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of AI audit requests.
 *
 * Supports optional status filtering and pagination via page/perPage params.
 * Results are sorted by requestedAt descending (most recent first).
 */
export async function fetchAuditList(
  params: AuditListParams
): Promise<AuditListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 10));

  // Get all 25 mock requests
  let requests = generateAuditRequests();

  // Apply status filter if provided
  if (params.status !== undefined) {
    requests = requests.filter((r) => r.status === params.status);
  }

  // Sort by requestedAt descending (most recent first)
  requests = [...requests].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

  const total = requests.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Paginate
  const startIndex = (page - 1) * perPage;
  const pageSlice = requests.slice(startIndex, startIndex + perPage);

  // Strip items array — not needed in list view
  const data = pageSlice.map(({ items: _items, ...rest }) => rest);

  return {
    data,
    total,
    page,
    perPage,
    totalPages,
  };
}

/**
 * Fetches a single audit request with full item details.
 *
 * @param requestId - Request ID (e.g., "audit-1001")
 * @returns Full AuditDetailResponse, or null if not found
 */
export async function fetchAuditDetail(
  requestId: string
): Promise<AuditDetailResponse | null> {
  const request = getAuditRequestById(requestId);

  if (!request) {
    return null;
  }

  return { data: request };
}
