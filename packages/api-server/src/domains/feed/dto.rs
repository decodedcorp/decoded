//! Feed 도메인 DTO
//!
//! 피드 요청/응답 데이터 전송 객체

use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::utils::pagination::PaginationMeta;

/// 피드 아이템 (Post 기반)
#[derive(Debug, Serialize, ToSchema)]
pub struct FeedItem {
    /// Post ID
    pub id: Uuid,

    /// 작성자 정보
    pub user: FeedUser,

    /// 이미지 URL
    pub image_url: String,

    /// 미디어 소스
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_source: Option<MediaSource>,

    /// 아티스트명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    /// 그룹명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,

    /// 컨텍스트
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,

    /// Spot 개수
    pub spot_count: i32,

    /// 조회수
    pub view_count: i32,

    /// 댓글 개수
    pub comment_count: i32,

    /// 생성 시각
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// 피드 사용자 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct FeedUser {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
}

/// 미디어 소스 정보
#[derive(Debug, Serialize, ToSchema)]
pub struct MediaSource {
    #[serde(rename = "type")]
    pub type_: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
}

/// 피드 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct FeedResponse {
    pub data: Vec<FeedItem>,
    pub pagination: PaginationMeta,
}

/// 트렌딩 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct TrendingResponse {
    pub data: Vec<FeedItem>,
    pub pagination: PaginationMeta,
}

/// 큐레이션 목록 항목
#[derive(Debug, Serialize, ToSchema)]
pub struct CurationListItem {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub cover_image_url: Option<String>,
    pub post_count: i32,
}

/// 큐레이션 목록 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct CurationListResponse {
    pub data: Vec<CurationListItem>,
}

/// 큐레이션 상세 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct CurationDetailResponse {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub cover_image_url: Option<String>,
    pub posts: Vec<FeedItem>,
}

/// 에디터 픽 응답 — 모든 활성 curation 의 curation_posts 를 display_order 로
/// 정렬해 상위 N개를 반환한다. 홈 페이지의 "Editor Picks" 섹션 전용.
#[derive(Debug, Serialize, ToSchema)]
pub struct EditorPicksResponse {
    pub data: Vec<FeedItem>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::utils::pagination::PaginationMeta;

    fn sample_feed_user() -> FeedUser {
        FeedUser {
            id: Uuid::nil(),
            username: "testuser".to_string(),
            avatar_url: Some("https://example.com/avatar.jpg".to_string()),
        }
    }

    fn sample_feed_item() -> FeedItem {
        FeedItem {
            id: Uuid::nil(),
            user: sample_feed_user(),
            image_url: "https://example.com/image.jpg".to_string(),
            media_source: Some(MediaSource {
                type_: "variety".to_string(),
                title: Some("런닝맨".to_string()),
            }),
            artist_name: Some("Jennie".to_string()),
            group_name: Some("BLACKPINK".to_string()),
            context: Some("airport".to_string()),
            spot_count: 3,
            view_count: 1520,
            comment_count: 12,
            created_at: chrono::DateTime::parse_from_rfc3339("2024-01-15T12:00:00Z")
                .unwrap()
                .with_timezone(&chrono::Utc),
        }
    }

    #[test]
    fn feed_item_serializes_nested_user_and_renames_media_type_field() {
        let item = sample_feed_item();
        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("\"username\":\"testuser\""));
        assert!(json.contains("\"type\":\"variety\""));
        assert!(!json.contains("\"type_\""));
    }

    #[test]
    fn feed_item_omits_skip_serializing_if_fields_when_none() {
        let item = FeedItem {
            media_source: None,
            artist_name: None,
            group_name: None,
            context: None,
            ..sample_feed_item()
        };
        let json = serde_json::to_string(&item).unwrap();
        assert!(!json.contains("media_source"));
        assert!(!json.contains("artist_name"));
        assert!(!json.contains("group_name"));
        assert!(!json.contains("context"));
    }

    #[test]
    fn media_source_omits_title_when_none() {
        let ms = MediaSource {
            type_: "album".to_string(),
            title: None,
        };
        let json = serde_json::to_string(&ms).unwrap();
        assert!(json.contains("\"type\":\"album\""));
        assert!(!json.contains("title"));
    }

    #[test]
    fn feed_user_serializes_avatar_url_as_null_when_none() {
        let user = FeedUser {
            avatar_url: None,
            ..sample_feed_user()
        };
        let json = serde_json::to_string(&user).unwrap();
        assert!(json.contains("\"avatar_url\":null"));
    }

    #[test]
    fn feed_response_wraps_data_and_pagination() {
        let res = FeedResponse {
            data: vec![sample_feed_item()],
            pagination: PaginationMeta {
                current_page: 2,
                per_page: 10,
                total_items: 42,
                total_pages: 5,
            },
        };
        let v: serde_json::Value = serde_json::to_value(&res).unwrap();
        assert_eq!(v["pagination"]["current_page"], 2);
        assert_eq!(v["data"].as_array().map(|a| a.len()), Some(1));
    }

    #[test]
    fn curation_list_item_serializes_none_options_as_null() {
        let item = CurationListItem {
            id: Uuid::nil(),
            title: "t".to_string(),
            description: None,
            cover_image_url: None,
            post_count: 0,
        };
        let v: serde_json::Value = serde_json::to_value(&item).unwrap();
        assert!(v["description"].is_null());
        assert!(v["cover_image_url"].is_null());
    }

    #[test]
    fn curation_detail_response_serializes_posts_array_including_empty() {
        let detail = CurationDetailResponse {
            id: Uuid::nil(),
            title: "cur".to_string(),
            description: None,
            cover_image_url: None,
            posts: vec![],
        };
        let json = serde_json::to_string(&detail).unwrap();
        assert!(json.contains("\"posts\":[]"));
    }
}
