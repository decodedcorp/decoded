/**
 * Badges API
 * Returns empty data until backend is available
 */

import type { MyBadgesResponse } from "./types";

// ============================================================
// 내 뱃지 조회 — 백엔드 없이 빈 데이터 반환
// ============================================================

export async function fetchMyBadges(): Promise<MyBadgesResponse> {
  return {
    data: [],
    available_badges: [],
  };
}
