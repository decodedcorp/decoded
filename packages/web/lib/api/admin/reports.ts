/**
 * Admin Reports types — matches Rust API response shapes.
 */

export const REPORT_STATUSES = [
  "pending",
  "reviewed",
  "dismissed",
  "actioned",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isValidReportStatus(s: string): s is ReportStatus {
  return (REPORT_STATUSES as readonly string[]).includes(s);
}

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
