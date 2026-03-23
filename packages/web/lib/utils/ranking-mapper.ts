/**
 * API Ranking 응답 → Profile Store Ranking 매핑
 */

import type {
  MyRankingDetailResponse as ApiMyRankingDetail,
  CategoryRank as ApiCategoryRank,
} from "@/lib/api/generated/models";
import type { Ranking } from "@/lib/stores/profileStore";

export function apiMyRankingDetailToStoreRankings(
  detail: ApiMyRankingDetail
): Ranking[] {
  const rankings: Ranking[] = [];

  // 전체 랭킹 (overall)
  rankings.push({
    scope: "global",
    rank: detail.overall_rank,
    change: 0, // 백엔드에서 변동값 미제공
    period: "all",
  });

  // 카테고리별 랭킹
  for (const cr of detail.category_rankings) {
    rankings.push({
      scope: cr.category_name || cr.category_code,
      rank: cr.rank,
      change: 0,
      period: "all",
    });
  }

  return rankings;
}
