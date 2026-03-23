//! Categories DTO (Data Transfer Objects)
//!
//! API 요청/응답에 사용되는 데이터 구조

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

/// 다국어 카테고리명
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryName {
    /// 한국어
    pub ko: String,

    /// 영어
    pub en: String,

    /// 일본어
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<String>,
}

/// 다국어 설명
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryDescription {
    /// 한국어
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ko: Option<String>,

    /// 영어
    #[serde(skip_serializing_if = "Option::is_none")]
    pub en: Option<String>,

    /// 일본어
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<String>,
}

/// 카테고리 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryResponse {
    /// 카테고리 ID
    pub id: Uuid,

    /// 카테고리 코드 (예: 'fashion', 'living', 'tech', 'beauty')
    pub code: String,

    /// 다국어 카테고리명
    pub name: CategoryName,

    /// 아이콘 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,

    /// 색상 hex 코드 (예: #FF5733)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_hex: Option<String>,

    /// 다국어 설명
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<CategoryDescription>,

    /// 표시 순서
    pub display_order: i32,

    /// 활성화 여부
    pub is_active: bool,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_category_name_serialization() {
        let name = CategoryName {
            ko: "패션".to_string(),
            en: "Fashion".to_string(),
            ja: Some("ファッション".to_string()),
        };

        let json = serde_json::to_string(&name).unwrap();
        assert!(json.contains("\"ko\":\"패션\""));
        assert!(json.contains("\"en\":\"Fashion\""));
    }

    #[test]
    fn test_category_response_without_optional_fields() {
        let response = CategoryResponse {
            id: Uuid::new_v4(),
            code: "fashion".to_string(),
            name: CategoryName {
                ko: "패션".to_string(),
                en: "Fashion".to_string(),
                ja: None,
            },
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: 1,
            is_active: true,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(!json.contains("icon_url"));
        assert!(!json.contains("color_hex"));
        assert!(!json.contains("description"));
    }
}
