//! Users DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use crate::{entities::users::Model as UserModel, utils::pagination::Pagination};

/// 사용자 프로필 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserResponse {
    /// 사용자 ID
    pub id: Uuid,

    /// 이메일
    pub email: String,

    /// 사용자명
    pub username: String,

    /// 표시 이름
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,

    /// 아바타 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,

    /// 자기소개
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,

    /// 사용자 등급
    pub rank: String,

    /// 총 포인트
    pub total_points: i32,

    /// 관리자 여부
    pub is_admin: bool,

    /// 잉크 크레딧
    pub ink_credits: i32,

    /// 스타일 DNA
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_dna: Option<serde_json::Value>,

    /// 팔로워 수
    pub followers_count: i64,

    /// 팔로잉 수
    pub following_count: i64,
}

impl From<UserModel> for UserResponse {
    fn from(user: UserModel) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            rank: user.rank,
            total_points: user.total_points,
            is_admin: user.is_admin,
            ink_credits: user.ink_credits,
            style_dna: user.style_dna,
            followers_count: 0,
            following_count: 0,
        }
    }
}

/// 사용자 프로필 수정 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct UpdateUserDto {
    /// 표시 이름
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 200))]
    pub display_name: Option<String>,

    /// 아바타 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub avatar_url: Option<String>,

    /// 자기소개
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2000))]
    pub bio: Option<String>,
}

/// 사용자 통계 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserStatsResponse {
    /// 사용자 ID
    pub user_id: Uuid,

    /// 총 게시물 수
    pub total_posts: i64,

    /// 총 댓글 수
    pub total_comments: i64,

    /// 총 좋아요 받은 수
    pub total_likes_received: i64,

    /// 총 포인트
    pub total_points: i32,

    /// 사용자 등급
    pub rank: String,
}

/// 소셜 계정 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SocialAccountResponse {
    /// 소셜 프로바이더 (google, kakao 등)
    pub provider: String,

    /// 프로바이더 사용자 ID
    pub provider_user_id: String,

    /// 마지막 동기화 시간
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_synced_at: Option<DateTime<Utc>>,
}

/// VTON 히스토리 아이템
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TryItem {
    pub id: Uuid,
    pub image_url: String,
    pub created_at: DateTime<Utc>,
}

/// 저장된 포스트 아이템
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SavedItem {
    pub id: Uuid,
    pub post_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_thumbnail_url: Option<String>,
    pub saved_at: DateTime<Utc>,
}

/// 사용자 활동 타입
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UserActivityType {
    Post,
    Spot,
    Solution,
}

/// 활동 조회 파라미터
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct UserActivitiesQuery {
    /// 활동 타입 필터 (기본값: 전체)
    #[serde(default, rename = "type")]
    pub activity_type: Option<UserActivityType>,

    /// 페이지네이션 설정
    #[serde(flatten)]
    pub pagination: Pagination,
}

/// 활동에 연결된 Post 정보
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserActivityPostMeta {
    pub id: Uuid,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_name: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,
}

/// 활동에 연결된 Spot 정보
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserActivitySpotMeta {
    pub id: Uuid,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub post: Option<UserActivityPostMeta>,
}

/// 사용자 활동 아이템
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserActivityItem {
    pub id: Uuid,

    #[serde(rename = "type")]
    pub activity_type: UserActivityType,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub spot: Option<UserActivitySpotMeta>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_name: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_adopted: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_verified: Option<bool>,

    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use chrono::{DateTime, Utc};
    use uuid::Uuid;
    use validator::Validate;

    fn sample_uuid() -> Uuid {
        Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
    }

    #[test]
    fn user_response_from_model_maps_all_scalar_fields() {
        let now = Utc::now().into();
        let id = sample_uuid();

        let user_model = UserModel {
            id,
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            bio: Some("Hello!".to_string()),
            rank: "Member".to_string(),
            total_points: 100,
            is_admin: false,
            created_at: now,
            updated_at: now,
        };

        let response: UserResponse = user_model.into();
        assert_eq!(response.id, id);
        assert_eq!(response.email, "test@example.com");
        assert_eq!(response.username, "testuser");
        assert_eq!(response.display_name.as_deref(), Some("Test User"));
        assert_eq!(response.avatar_url, None);
        assert_eq!(response.bio.as_deref(), Some("Hello!"));
        assert_eq!(response.rank, "Member");
        assert_eq!(response.total_points, 100);
        assert!(!response.is_admin);
    }

    #[test]
    fn user_response_json_roundtrip_and_omits_none_optionals() {
        let original = UserResponse {
            id: sample_uuid(),
            email: "a@b.co".to_string(),
            username: "u".to_string(),
            display_name: None,
            avatar_url: None,
            bio: None,
            rank: "Gold".to_string(),
            total_points: 42,
            is_admin: true,
            followers_count: 0,
            following_count: 0,
        };

        let v: serde_json::Value = serde_json::to_value(&original).unwrap();
        assert!(v.get("display_name").is_none());
        assert!(v.get("avatar_url").is_none());
        assert!(v.get("bio").is_none());

        let parsed: UserResponse = serde_json::from_value(v).unwrap();
        assert_eq!(parsed.id, original.id);
        assert_eq!(parsed.email, original.email);
        assert_eq!(parsed.username, original.username);
        assert_eq!(parsed.display_name, None);
        assert_eq!(parsed.rank, "Gold");
        assert_eq!(parsed.total_points, 42);
        assert!(parsed.is_admin);
    }

    #[test]
    fn user_response_includes_follow_counts_in_json() {
        let resp = UserResponse {
            id: sample_uuid(),
            email: "a@b.co".to_string(),
            username: "u".to_string(),
            display_name: None,
            avatar_url: None,
            bio: None,
            rank: "Gold".to_string(),
            total_points: 0,
            is_admin: false,
            followers_count: 42,
            following_count: 7,
        };
        let v: serde_json::Value = serde_json::to_value(&resp).unwrap();
        assert_eq!(v["followers_count"], 42);
        assert_eq!(v["following_count"], 7);

        let parsed: UserResponse = serde_json::from_value(v).unwrap();
        assert_eq!(parsed.followers_count, 42);
        assert_eq!(parsed.following_count, 7);
    }

    #[test]
    fn user_response_from_model_defaults_follow_counts_to_zero() {
        let now = Utc::now().into();
        let model = UserModel {
            id: sample_uuid(),
            email: "t@e.co".to_string(),
            username: "t".to_string(),
            display_name: None,
            avatar_url: None,
            bio: None,
            rank: "Member".to_string(),
            total_points: 0,
            is_admin: false,
            created_at: now,
            updated_at: now,
        };
        let resp: UserResponse = model.into();
        assert_eq!(resp.followers_count, 0);
        assert_eq!(resp.following_count, 0);
    }

    #[test]
    fn update_user_dto_validate_accepts_none_and_max_length_boundaries() {
        let empty = UpdateUserDto {
            display_name: None,
            avatar_url: None,
            bio: None,
        };
        assert!(empty.validate().is_ok());

        let at_limits = UpdateUserDto {
            display_name: Some("x".repeat(200)),
            avatar_url: Some("y".repeat(2048)),
            bio: Some("z".repeat(2000)),
        };
        assert!(at_limits.validate().is_ok());

        let json = serde_json::to_string(&at_limits).unwrap();
        let back: UpdateUserDto = serde_json::from_str(&json).unwrap();
        assert_eq!(back.display_name.as_ref().map(|s| s.len()), Some(200));
        assert_eq!(back.avatar_url.as_ref().map(|s| s.len()), Some(2048));
        assert_eq!(back.bio.as_ref().map(|s| s.len()), Some(2000));
        assert!(back.validate().is_ok());
    }

    #[test]
    fn update_user_dto_validate_rejects_overlong_fields() {
        let cases = [
            (
                "display_name",
                UpdateUserDto {
                    display_name: Some("x".repeat(201)),
                    avatar_url: None,
                    bio: None,
                },
            ),
            (
                "avatar_url",
                UpdateUserDto {
                    display_name: None,
                    avatar_url: Some("y".repeat(2049)),
                    bio: None,
                },
            ),
            (
                "bio",
                UpdateUserDto {
                    display_name: None,
                    avatar_url: None,
                    bio: Some("z".repeat(2001)),
                },
            ),
        ];

        for (field, dto) in cases {
            let err = dto.validate().unwrap_err();
            assert!(
                err.field_errors().contains_key(field),
                "expected validation error on {field}, got {err:?}"
            );
        }
    }

    #[test]
    fn user_stats_response_json_roundtrip() {
        let original = UserStatsResponse {
            user_id: sample_uuid(),
            total_posts: 10,
            total_comments: 3,
            total_likes_received: 7,
            total_points: 99,
            rank: "Silver".to_string(),
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: UserStatsResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.user_id, original.user_id);
        assert_eq!(parsed.total_posts, 10);
        assert_eq!(parsed.total_comments, 3);
        assert_eq!(parsed.total_likes_received, 7);
        assert_eq!(parsed.total_points, 99);
        assert_eq!(parsed.rank, "Silver");
    }

    #[test]
    fn user_activity_type_serializes_snake_case() {
        for (variant, expected) in [
            (UserActivityType::Post, "post"),
            (UserActivityType::Spot, "spot"),
            (UserActivityType::Solution, "solution"),
        ] {
            let v = serde_json::to_value(&variant).unwrap();
            assert_eq!(v, serde_json::Value::String(expected.to_string()));
            let back: UserActivityType = serde_json::from_value(v).unwrap();
            match (expected, &back) {
                ("post", UserActivityType::Post) => {}
                ("spot", UserActivityType::Spot) => {}
                ("solution", UserActivityType::Solution) => {}
                _ => panic!("roundtrip mismatch for {expected}: {back:?}"),
            }
        }
    }

    #[test]
    fn user_activities_query_deserializes_type_alias_and_pagination_defaults() {
        let q: UserActivitiesQuery = serde_json::from_str(r#"{"type":"spot"}"#).unwrap();
        assert!(matches!(q.activity_type, Some(UserActivityType::Spot)));
        assert_eq!(q.pagination.page, 1);
        assert_eq!(q.pagination.per_page, 20);
    }

    #[test]
    fn user_activities_query_deserializes_flattened_page_and_per_page() {
        let q: UserActivitiesQuery =
            serde_json::from_str(r#"{"type":"post","page":2,"per_page":15}"#).unwrap();
        assert!(matches!(q.activity_type, Some(UserActivityType::Post)));
        assert_eq!(q.pagination.page, 2);
        assert_eq!(q.pagination.per_page, 15);
    }

    #[test]
    fn user_activity_item_roundtrip_nested_spot_and_type_key() {
        let post_id = sample_uuid();
        let spot_id = sample_uuid();
        let activity_id = sample_uuid();
        let created_at: DateTime<Utc> = "2024-11-15T12:00:00Z".parse().unwrap();

        let original = UserActivityItem {
            id: activity_id,
            activity_type: UserActivityType::Solution,
            spot: Some(UserActivitySpotMeta {
                id: spot_id,
                post: Some(UserActivityPostMeta {
                    id: post_id,
                    image_url: Some("https://cdn.example/i.png".to_string()),
                    artist_name: Some("A".to_string()),
                    group_name: None,
                }),
            }),
            product_name: Some("p".to_string()),
            title: Some("t".to_string()),
            is_adopted: Some(true),
            is_verified: None,
            created_at,
        };

        let v: serde_json::Value = serde_json::to_value(&original).unwrap();
        assert_eq!(v.get("type").and_then(|x| x.as_str()), Some("solution"));
        assert!(v.get("spot").is_some());

        let parsed: UserActivityItem = serde_json::from_value(v).unwrap();
        assert_eq!(parsed.id, activity_id);
        assert!(matches!(parsed.activity_type, UserActivityType::Solution));
        assert_eq!(parsed.spot.as_ref().unwrap().id, spot_id);
        assert_eq!(
            parsed.spot.as_ref().unwrap().post.as_ref().unwrap().id,
            post_id
        );
        assert_eq!(parsed.created_at, created_at);
    }
}
