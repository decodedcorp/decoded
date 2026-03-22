/**
 * Rankings API
 * Returns empty data until backend is available
 */

import type { RankingListResponse, ApiMyRankingDetail } from "./types";

// ============================================================
// 전체 랭킹 — 백엔드 없이 빈 데이터 반환
// ============================================================

export interface RankingsParams {
  period?: "weekly" | "monthly" | "all_time";
  page?: number;
  per_page?: number;
}

export async function fetchRankings(
  _params?: RankingsParams
): Promise<RankingListResponse> {
  return {
    data: [],
    my_ranking: null,
    pagination: {
      current_page: 1,
      per_page: 20,
      total_items: 0,
      total_pages: 0,
    },
  };
}

// ============================================================
// 내 랭킹 상세 — 백엔드 없이 기본값 반환
// ============================================================

export async function fetchMyRanking(): Promise<ApiMyRankingDetail> {
  return {
    overall_rank: 0,
    total_points: 0,
    weekly_points: 0,
    monthly_points: 0,
    solution_stats: {
      total_count: 0,
      adopted_count: 0,
      verified_count: 0,
      accurate_votes: 0,
    },
    category_rankings: [],
  };
}
