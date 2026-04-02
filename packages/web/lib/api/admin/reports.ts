/**
 * Admin Reports types — matches Rust API response shapes.
 */

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface ReporterInfo {
  id: string;
  username: string;
}

export interface ReportListItem {
  id: string;
  target_type: string;
  target_id: string;
  reporter: ReporterInfo;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface AdminReportListResponse {
  data: ReportListItem[];
  pagination: PaginationMeta;
}
