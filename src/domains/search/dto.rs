//! Search 도메인 DTO
//!
//! 검색 요청/응답 데이터 전송 객체

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::utils::pagination::PaginationMeta;

/// 검색 쿼리 파라미터
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct SearchQuery {
    /// 검색어
    pub q: String,

    /// 카테고리 필터 (fashion, living, tech, beauty)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,

    /// 미디어 타입 필터 (drama, movie, mv, youtube, variety)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_type: Option<String>,

    /// 컨텍스트 필터 (airport, stage, mv, red_carpet 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// 채택된 Solution이 있는 Spot만 필터링
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_adopted: Option<bool>,

    /// 정렬 방식 (recent, popular, solution_count, default: relevant)
    #[serde(default = "default_sort")]
    pub sort: String,

    /// 페이지 번호 (default: 1)
    #[serde(default = "default_page")]
    pub page: u32,

    /// 페이지당 개수 (default: 20, max: 50)
    #[serde(default = "default_limit")]
    pub limit: u32,
}

fn default_sort() -> String {
    "relevant".to_string()
}

fn default_page() -> u32 {
    1
}

fn default_limit() -> u32 {
    20
}

impl Default for SearchQuery {
    fn default() -> Self {
        Self {
            q: String::new(),
            category: None,
            media_type: None,
            context: None,
            has_adopted: None,
            sort: default_sort(),
            page: default_page(),
            limit: default_limit(),
        }
    }
}

/// 검색 결과 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct SearchResultItem {
    /// Post ID
    pub id: Uuid,

    /// 결과 타입 (post)
    #[serde(rename = "type")]
    pub type_: String,

    /// 이미지 URL
    pub image_url: String,

    /// 아티스트명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 그룹명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 컨텍스트
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// 미디어 소스
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_source: Option<MediaSource>,

    /// Spot 개수
    pub spot_count: i32,

    /// 조회수
    pub view_count: i32,

    /// 하이라이트 (검색어 강조)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub highlight: Option<HashMap<String, String>>,
}

/// 미디어 소스 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct MediaSource {
    /// 미디어 타입
    #[serde(rename = "type")]
    pub type_: String,

    /// 미디어 제목
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
}

/// Facets (필터링 집계)
#[derive(Debug, Serialize, ToSchema)]
pub struct Facets {
    /// 카테고리별 개수
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<HashMap<String, u32>>,

    /// 컨텍스트별 개수
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<HashMap<String, u32>>,

    /// 미디어 타입별 개수
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_type: Option<HashMap<String, u32>>,
}

/// 검색 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct SearchResponse {
    /// 검색 결과 목록
    pub data: Vec<SearchResultItem>,

    /// Facets (필터링 집계)
    pub facets: Facets,

    /// 페이지네이션 정보
    pub pagination: PaginationMeta,

    /// 검색어
    pub query: String,

    /// 검색 소요 시간 (ms)
    pub took_ms: u64,
}

/// 인기 검색어 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct PopularSearchItem {
    /// 순위
    pub rank: u32,

    /// 검색어
    pub query: String,

    /// 검색 횟수
    pub search_count: u32,
}

/// 인기 검색어 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct PopularSearchResponse {
    /// 인기 검색어 목록
    pub data: Vec<PopularSearchItem>,
}

/// 최근 검색어 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct RecentSearchItem {
    /// 검색 로그 ID
    pub id: Uuid,

    /// 검색어
    pub query: String,

    /// 검색 시각
    pub searched_at: chrono::DateTime<chrono::Utc>,
}

/// 최근 검색어 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct RecentSearchResponse {
    /// 최근 검색어 목록
    pub data: Vec<RecentSearchItem>,
}

/// 시멘틱 유사도 검색 쿼리 파라미터
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct SimilarSearchQuery {
    /// 검색어
    pub q: String,

    /// 엔티티 타입 필터 (post | spot | solution, 미지정 시 전체)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_type: Option<String>,

    /// 결과 개수 (default: 10, max: 50)
    #[serde(default = "similar_default_limit")]
    pub limit: u32,
}

fn similar_default_limit() -> u32 {
    10
}

/// 시멘틱 검색 결과 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct SimilarSearchResultItem {
    /// 엔티티 타입 (post, spot, solution)
    pub entity_type: String,

    /// 엔티티 ID
    pub entity_id: Uuid,

    /// 유사도 점수 (0~1, 높을수록 유사)
    pub similarity: f64,

    /// 검색에 사용된 원본 텍스트
    pub content_text: String,
}

/// 시멘틱 검색 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct SimilarSearchResponse {
    /// 검색 결과 목록
    pub data: Vec<SimilarSearchResultItem>,

    /// 검색어
    pub query: String,

    /// 검색 소요 시간 (ms)
    pub took_ms: u64,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_search_query_default() {
        let query = SearchQuery::default();
        assert_eq!(query.q, "");
        assert_eq!(query.sort, "relevant");
        assert_eq!(query.page, 1);
        assert_eq!(query.limit, 20);
        assert!(query.category.is_none());
    }

    #[test]
    fn test_search_query_custom() {
        let query = SearchQuery {
            q: "jennie".to_string(),
            category: Some("fashion".to_string()),
            media_type: None,
            context: Some("airport".to_string()),
            has_adopted: Some(true),
            sort: "popular".to_string(),
            page: 2,
            limit: 30,
        };

        assert_eq!(query.q, "jennie");
        assert_eq!(query.category, Some("fashion".to_string()));
        assert_eq!(query.context, Some("airport".to_string()));
        assert_eq!(query.has_adopted, Some(true));
        assert_eq!(query.sort, "popular");
        assert_eq!(query.page, 2);
        assert_eq!(query.limit, 30);
    }

    #[test]
    fn test_search_result_item_serialization() {
        let item = SearchResultItem {
            id: Uuid::new_v4(),
            type_: "post".to_string(),
            image_url: "https://example.com/image.jpg".to_string(),
            artist_name: Some("Jennie".to_string()),
            group_name: Some("BLACKPINK".to_string()),
            context: Some("airport".to_string()),
            media_source: Some(MediaSource {
                type_: "variety".to_string(),
                title: Some("공항 직캠".to_string()),
            }),
            spot_count: 5,
            view_count: 3200,
            highlight: None,
        };

        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("\"type\":\"post\""));
        assert!(json.contains("\"artist_name\":\"Jennie\""));
    }

    #[test]
    fn test_facets_serialization() {
        let mut category_map = HashMap::new();
        category_map.insert("fashion".to_string(), 45);
        category_map.insert("living".to_string(), 12);

        let facets = Facets {
            category: Some(category_map),
            context: None,
            media_type: None,
        };

        let json = serde_json::to_string(&facets).unwrap();
        assert!(json.contains("\"category\""));
        assert!(json.contains("\"fashion\":45"));
    }

    #[test]
    fn similar_search_query_deserializes_limit_default() {
        let q: SimilarSearchQuery = serde_json::from_str(r#"{"q":"coat"}"#).unwrap();
        assert_eq!(q.q, "coat");
        assert_eq!(q.limit, 10);
        assert!(q.entity_type.is_none());
    }

    #[test]
    fn similar_search_result_item_serializes() {
        let item = SimilarSearchResultItem {
            entity_type: "spot".to_string(),
            entity_id: Uuid::nil(),
            similarity: 0.92,
            content_text: "leather jacket".to_string(),
        };

        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("\"entity_type\":\"spot\""));
        assert!(json.contains("\"similarity\":0.92"));
    }

    #[test]
    fn search_result_item_skips_highlight_when_none() {
        let item = SearchResultItem {
            id: Uuid::new_v4(),
            type_: "post".to_string(),
            image_url: "https://example.com/i.jpg".to_string(),
            artist_name: None,
            group_name: None,
            context: None,
            media_source: None,
            spot_count: 0,
            view_count: 0,
            highlight: None,
        };

        let json = serde_json::to_string(&item).unwrap();
        assert!(!json.contains("highlight"));
    }
}
