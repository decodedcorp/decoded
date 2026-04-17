export const MAGAZINE_STATUSES = [
  "draft",
  "pending",
  "published",
  "rejected",
] as const;

export type MagazineStatus = (typeof MAGAZINE_STATUSES)[number];

export function isValidMagazineStatus(s: string): s is MagazineStatus {
  return (MAGAZINE_STATUSES as readonly string[]).includes(s);
}

export interface AdminMagazineListItem {
  id: string;
  title: string;
  status: MagazineStatus;
  keyword: string | null;
  subtitle: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminMagazineListResponse {
  data: AdminMagazineListItem[];
  total: number;
  page: number;
  limit: number;
}
