//! Solutions DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use crate::entities::solutions::ActiveModel;
use sea_orm::Set;

use crate::domains::users::dto::UserResponse;

/// 가격 정보
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PriceDto {
    /// 가격 금액 (정밀도 유지를 위해 String으로 반환: "12345.67" 형식)
    pub amount: String,

    /// 통화 (KRW, USD 등)
    pub currency: String,
}

/// QA 쌍 (Gemini 생성)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct QAPair {
    /// 질문
    pub question: String,

    /// 답변
    pub answer: String,
}

/// 투표 통계
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct VoteStatsDto {
    /// 정확함 투표 수
    pub accurate: i32,

    /// 다름 투표 수
    pub different: i32,
}

/// Solution 생성 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct CreateSolutionDto {
    /// 원본 상품 URL
    #[validate(length(min = 1))]
    pub original_url: String,

    /// 제휴 링크 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub affiliate_url: Option<String>,

    /// og metadata title
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    /// 메타데이터 (가격, 브랜드 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,

    /// og metadata description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// solver comment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,

    /// og metadata image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// `public.brands.id` (옵션). 없으면 NULL — 스케줄러/대시보드에서 후속 백필 가능
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_id: Option<Uuid>,
}

impl CreateSolutionDto {
    pub fn into_active_model(self, spot_id: Uuid, user_id: Uuid) -> ActiveModel {
        ActiveModel {
            id: Set(Uuid::new_v4()),
            spot_id: Set(spot_id),
            user_id: Set(user_id),
            title: Set(self.title.unwrap_or_else(|| "Unknown Title".to_string())),
            metadata: Set(self.metadata),
            original_url: Set(Some(self.original_url)),
            affiliate_url: Set(self.affiliate_url),
            thumbnail_url: Set(self.thumbnail_url),
            description: Set(self.description),
            comment: Set(self.comment),
            brand_id: Set(self.brand_id),
            accurate_count: Set(0),
            different_count: Set(0),
            is_verified: Set(false),
            is_adopted: Set(false),
            adopted_at: Set(None),
            click_count: Set(0),
            purchase_count: Set(0),
            status: Set("active".to_string()),
            match_type: Set(None),
            ..Default::default()
        }
    }
}

/// Solution 수정 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct UpdateSolutionDto {
    /// 제목 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub title: Option<String>,

    /// 메타데이터 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,

    /// 상품 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 10_000))]
    pub description: Option<String>,
}

/// Solution 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SolutionResponse {
    /// Solution ID
    pub id: Uuid,

    /// Spot ID
    pub spot_id: Uuid,

    /// 브랜드 ID (warehouse FK, nullable)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand_id: Option<Uuid>,

    /// 사용자 정보
    pub user: UserResponse,

    /// 매치 타입 (perfect | close | null)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_type: Option<String>,

    /// 링크 타입 (product | article | video | other)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub link_type: Option<String>,

    /// 제목
    pub title: String,

    /// 원본 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_url: Option<String>,

    /// 제휴 링크 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub affiliate_url: Option<String>,

    /// 썸네일 이미지 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// 상품 설명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Solver 코멘트
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,

    /// 투표 통계
    pub vote_stats: VoteStatsDto,

    /// 검증 여부
    pub is_verified: bool,

    /// 채택 여부
    pub is_adopted: bool,

    /// 채택 일시
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adopted_at: Option<DateTime<Utc>>,

    /// 클릭 수
    pub click_count: i32,

    /// 구매 수
    pub purchase_count: i32,

    /// 생성일시
    pub created_at: DateTime<Utc>,

    /// 메타데이터 (가격, 브랜드, AI 생성 데이터 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Solution 목록 응답 (간소화)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SolutionListItem {
    /// Solution ID
    pub id: Uuid,

    /// 브랜드 ID (warehouse FK, nullable)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand_id: Option<Uuid>,

    /// 사용자 정보
    pub user: UserResponse,

    /// 매치 타입 (perfect | close | null)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_type: Option<String>,

    /// 링크 타입 (product | article | video | other)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub link_type: Option<String>,

    /// 제목
    pub title: String,

    /// 메타데이터 (가격, 브랜드 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,

    /// 썸네일 이미지 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// 원본 상품 URL (Shop the Look 링크용)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_url: Option<String>,

    /// 제휴 링크 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub affiliate_url: Option<String>,

    /// 투표 통계
    pub vote_stats: VoteStatsDto,

    /// 검증 여부
    pub is_verified: bool,

    /// 채택 여부
    pub is_adopted: bool,

    /// 생성일시
    pub created_at: DateTime<Utc>,
}

/// 링크 메타데이터 추출 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExtractMetadataDto {
    /// URL
    pub url: String,
}

/// 링크 메타데이터 추출 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MetadataResponse {
    /// URL
    pub url: String,

    /// 제목
    pub title: String,

    /// 설명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// 썸네일 이미지 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,

    /// 사이트명 (OG tag)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub site_name: Option<String>,

    /// 이미지 URL (OG tag, raw)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,

    /// 추가 메타데이터 (구조화된 데이터)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra_metadata: Option<LinkMetadata>,

    /// 제휴 링크 지원 여부
    pub is_affiliate_supported: bool,
}

/// 제휴 링크 변환 요청
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ConvertAffiliateDto {
    /// 원본 URL
    pub url: String,
}

/// 제휴 링크 변환 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AffiliateLinkResponse {
    /// 원본 URL
    pub original_url: String,

    /// 제휴 링크 URL
    pub affiliate_url: String,
}

/// 링크 메타데이터 (gRPC 및 Gemini 공통)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LinkMetadata {
    /// 가격
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price: Option<String>,

    /// 통화
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,

    /// 브랜드
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand: Option<String>,

    /// 소재
    pub material: Vec<String>,

    /// 원산지
    #[serde(skip_serializing_if = "Option::is_none")]
    pub origin: Option<String>,

    /// 카테고리
    #[serde(rename = "category", skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,

    /// 서브 카테고리
    #[serde(rename = "sub_category", skip_serializing_if = "Option::is_none")]
    pub sub_category: Option<String>,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use sea_orm::ActiveValue;
    use validator::Validate;

    #[test]
    fn create_solution_dto_validation_rejects_empty_original_url() {
        let dto = CreateSolutionDto {
            original_url: String::new(),
            affiliate_url: None,
            title: None,
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };

        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_solution_dto_into_active_model_sets_ids_and_default_title() {
        let spot_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let dto = CreateSolutionDto {
            original_url: "https://shop.example/p/1".to_string(),
            affiliate_url: Some("https://aff.example/x".to_string()),
            title: None,
            metadata: Some(serde_json::json!({"brand": "Test"})),
            description: Some("desc".to_string()),
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };

        let am = dto.into_active_model(spot_id, user_id);

        assert_eq!(am.spot_id, ActiveValue::Set(spot_id));
        assert_eq!(am.user_id, ActiveValue::Set(user_id));
        assert_eq!(am.title, ActiveValue::Set("Unknown Title".to_string()));
        assert_eq!(
            am.original_url,
            ActiveValue::Set(Some("https://shop.example/p/1".to_string()))
        );
        assert_eq!(am.brand_id, ActiveValue::Set(None));
        assert_eq!(am.is_verified, ActiveValue::Set(false));
        assert_eq!(am.status, ActiveValue::Set("active".to_string()));
    }

    #[test]
    fn create_solution_dto_into_active_model_preserves_explicit_title() {
        let am = CreateSolutionDto {
            original_url: "https://a.com".to_string(),
            affiliate_url: None,
            title: Some("Custom".to_string()),
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        }
        .into_active_model(Uuid::new_v4(), Uuid::new_v4());

        assert_eq!(am.title, ActiveValue::Set("Custom".to_string()));
    }

    #[test]
    fn create_solution_dto_into_active_model_preserves_brand_id() {
        let bid = Uuid::new_v4();
        let am = CreateSolutionDto {
            original_url: "https://a.com".to_string(),
            affiliate_url: None,
            title: None,
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: Some(bid),
        }
        .into_active_model(Uuid::new_v4(), Uuid::new_v4());

        assert_eq!(am.brand_id, ActiveValue::Set(Some(bid)));
    }

    #[test]
    fn update_solution_dto_validation_rejects_oversized_title() {
        let dto = UpdateSolutionDto {
            title: Some("x".repeat(2049)),
            metadata: None,
            description: None,
        };

        assert!(dto.validate().is_err());
    }

    #[test]
    fn link_metadata_serializes_category_keys() {
        let meta = LinkMetadata {
            price: Some("99".to_string()),
            currency: Some("KRW".to_string()),
            brand: None,
            material: vec![],
            origin: None,
            category: Some("outer".to_string()),
            sub_category: Some("jacket".to_string()),
        };

        let json = serde_json::to_string(&meta).unwrap();
        assert!(json.contains("\"category\":\"outer\""));
        assert!(json.contains("\"sub_category\":\"jacket\""));
    }
}
