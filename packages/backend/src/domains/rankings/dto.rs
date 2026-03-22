//! Rankings 도메인 DTO
//!
//! 랭킹 요청/응답 데이터 전송 객체

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::utils::pagination::PaginationMeta;

/// 랭킹 기간 필터
#[derive(Debug, Deserialize, ToSchema)]
pub struct RankingPeriodQuery {
    /// 기간 (weekly, monthly, all_time)
    #[serde(default = "default_period")]
    pub period: String,

    /// 페이지 번호
    #[serde(default = "default_page")]
    pub page: u64,

    /// 페이지당 항목 수
    #[serde(default = "default_per_page")]
    pub per_page: u64,
}

fn default_period() -> String {
    "weekly".to_string()
}

fn default_page() -> u64 {
    1
}

fn default_per_page() -> u64 {
    50
}

/// 랭킹 사용자 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct RankingUser {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub rank: String,
}

/// 랭킹 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct RankingItem {
    /// 순위
    pub rank: i32,

    /// 사용자 정보
    pub user: RankingUser,

    /// 총 포인트
    pub total_points: i32,

    /// 주간 포인트
    pub weekly_points: i32,

    /// Solution 등록 수
    pub solution_count: i32,

    /// 채택된 Solution 수
    pub adopted_count: i32,

    /// Verified Solution 수
    pub verified_count: i32,
}

/// 내 랭킹 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct MyRanking {
    pub rank: i32,
    pub total_points: i32,
    pub weekly_points: i32,
}

/// 랭킹 목록 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct RankingListResponse {
    pub data: Vec<RankingItem>,

    /// 내 랭킹 정보 (인증된 사용자만)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub my_ranking: Option<MyRanking>,

    pub pagination: PaginationMeta,
}

/// 카테고리별 랭킹 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct CategoryRankingItem {
    pub rank: i32,
    pub user: RankingUser,
    pub category_points: i32,
    pub solution_count: i32,
    pub adopted_count: i32,
}

/// 카테고리별 랭킹 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct CategoryRankingResponse {
    pub category_code: String,
    pub data: Vec<CategoryRankingItem>,
    pub pagination: PaginationMeta,
}

/// 내 랭킹 상세 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct MyRankingDetailResponse {
    /// 전체 순위
    pub overall_rank: i32,

    /// 총 포인트
    pub total_points: i32,

    /// 주간 포인트
    pub weekly_points: i32,

    /// 월간 포인트
    pub monthly_points: i32,

    /// Solution 통계
    pub solution_stats: SolutionStats,

    /// 카테고리별 순위
    pub category_rankings: Vec<CategoryRank>,
}

/// Solution 통계
#[derive(Debug, Serialize, ToSchema)]
pub struct SolutionStats {
    pub total_count: i32,
    pub adopted_count: i32,
    pub verified_count: i32,
    pub accurate_votes: i32,
}

/// 카테고리별 순위
#[derive(Debug, Serialize, ToSchema)]
pub struct CategoryRank {
    pub category_code: String,
    pub category_name: String,
    pub rank: i32,
    pub points: i32,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_default_query_params() {
        let query = RankingPeriodQuery {
            period: default_period(),
            page: default_page(),
            per_page: default_per_page(),
        };

        assert_eq!(query.period, "weekly");
        assert_eq!(query.page, 1);
        assert_eq!(query.per_page, 50);
    }

    #[test]
    fn test_ranking_user_serialization() {
        let user = RankingUser {
            id: Uuid::new_v4(),
            username: "testuser".to_string(),
            avatar_url: Some("https://example.com/avatar.jpg".to_string()),
            rank: "Expert".to_string(),
        };

        let json = serde_json::to_string(&user).unwrap();
        assert!(json.contains("testuser"));
        assert!(json.contains("Expert"));
    }

    #[test]
    fn test_ranking_item_structure() {
        let item = RankingItem {
            rank: 1,
            user: RankingUser {
                id: Uuid::new_v4(),
                username: "topuser".to_string(),
                avatar_url: None,
                rank: "Expert".to_string(),
            },
            total_points: 2850,
            weekly_points: 320,
            solution_count: 145,
            adopted_count: 89,
            verified_count: 67,
        };

        assert_eq!(item.rank, 1);
        assert_eq!(item.total_points, 2850);
        assert_eq!(item.user.username, "topuser");
    }

    #[test]
    fn ranking_period_query_deserializes_empty_json_to_defaults() {
        let q: RankingPeriodQuery = serde_json::from_str("{}").unwrap();
        assert_eq!(q.period, "weekly");
        assert_eq!(q.page, 1);
        assert_eq!(q.per_page, 50);
    }

    #[test]
    fn ranking_list_response_skips_my_ranking_when_none() {
        let response = RankingListResponse {
            data: vec![],
            my_ranking: None,
            pagination: PaginationMeta {
                current_page: 1,
                per_page: 50,
                total_items: 0,
                total_pages: 0,
            },
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(!json.contains("my_ranking"));
    }

    #[test]
    fn category_ranking_response_serializes_category_code() {
        let res = CategoryRankingResponse {
            category_code: "fashion".to_string(),
            data: vec![],
            pagination: PaginationMeta {
                current_page: 1,
                per_page: 20,
                total_items: 0,
                total_pages: 0,
            },
        };

        let json = serde_json::to_string(&res).unwrap();
        assert!(json.contains("\"category_code\":\"fashion\""));
    }
}
