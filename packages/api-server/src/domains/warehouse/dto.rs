//! Warehouse DTOs
//!
//! `warehouse.artists`, `warehouse.groups` 를 홈 페이지용으로 노출하는 응답
//! 구조. 네임/프로필 URL 이 주된 관심사라 metadata 는 일부러 제외한다.

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// 단일 아티스트/그룹 프로필
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WarehouseProfile {
    pub id: Uuid,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_ko: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_en: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile_image_url: Option<String>,
}

/// 단일 브랜드 프로필 (브랜드는 logo_image_url 사용)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WarehouseBrandProfile {
    pub id: Uuid,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_ko: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_en: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub logo_image_url: Option<String>,
}

/// `GET /api/v1/warehouse/profiles` 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WarehouseProfilesResponse {
    pub artists: Vec<WarehouseProfile>,
    pub groups: Vec<WarehouseProfile>,
    pub brands: Vec<WarehouseBrandProfile>,
}
