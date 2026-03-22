//! Spots DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use crate::domains::categories::dto::CategoryResponse;

/// Spot 생성 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateSpotDto {
    /// 위치 좌표 (왼쪽, 퍼센트)
    #[validate(length(min = 1))]
    pub position_left: String,

    /// 위치 좌표 (위, 퍼센트)
    #[validate(length(min = 1))]
    pub position_top: String,

    /// 카테고리 ID
    pub category_id: Uuid,
}

/// Spot 수정 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct UpdateSpotDto {
    /// 위치 좌표 (왼쪽, 퍼센트) - 옵션
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 64))]
    pub position_left: Option<String>,

    /// 위치 좌표 (위, 퍼센트) - 옵션
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 64))]
    pub position_top: Option<String>,

    /// 카테고리 ID - 옵션
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<Uuid>,

    /// 상태 - 옵션
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 32))]
    pub status: Option<String>, // 'open' | 'resolved'
}

/// Spot 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SpotResponse {
    /// Spot ID
    pub id: Uuid,

    /// Post ID
    pub post_id: Uuid,

    /// 사용자 ID
    pub user_id: Uuid,

    /// 위치 좌표 (왼쪽, 퍼센트)
    pub position_left: String,

    /// 위치 좌표 (위, 퍼센트)
    pub position_top: String,

    /// 카테고리 정보 (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<CategoryResponse>,

    /// 상태
    pub status: String,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// Admin spot 목록 (재태깅)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AdminSpotListItem {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub position_left: String,
    pub position_top: String,
    pub subcategory_id: Option<Uuid>,
    pub post_image_url: String,
    pub created_at: DateTime<Utc>,
}

/// Admin spot 서브카테고리 변경
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AdminSpotSubcategoryUpdate {
    pub subcategory_id: Uuid,
}

/// Spot 목록 응답 (간소화)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SpotListItem {
    /// Spot ID
    pub id: Uuid,

    /// 위치 좌표 (왼쪽, 퍼센트)
    pub position_left: String,

    /// 위치 좌표 (위, 퍼센트)
    pub position_top: String,

    /// 카테고리 정보 (선택사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<CategoryResponse>,

    /// 상태
    pub status: String,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use validator::Validate;

    #[test]
    fn test_create_spot_dto() {
        let dto = CreateSpotDto {
            position_left: "45.5".to_string(),
            position_top: "30.2".to_string(),
            category_id: Uuid::new_v4(),
        };

        assert_eq!(dto.position_left, "45.5");
        assert_eq!(dto.position_top, "30.2");
    }

    #[test]
    fn create_spot_dto_validation_rejects_empty_position() {
        let dto = CreateSpotDto {
            position_left: String::new(),
            position_top: "10".to_string(),
            category_id: Uuid::new_v4(),
        };

        assert!(dto.validate().is_err());
    }

    #[test]
    fn update_spot_dto_validation_rejects_long_position() {
        let dto = UpdateSpotDto {
            position_left: Some("x".repeat(65)),
            position_top: None,
            category_id: None,
            status: None,
        };

        assert!(dto.validate().is_err());
    }

    #[test]
    fn spot_response_skips_category_when_none() {
        let response = SpotResponse {
            id: Uuid::new_v4(),
            post_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            position_left: "10".to_string(),
            position_top: "20".to_string(),
            category: None,
            status: "open".to_string(),
            created_at: chrono::DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
                .unwrap()
                .with_timezone(&chrono::Utc),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(!json.contains("category"));
    }
}
