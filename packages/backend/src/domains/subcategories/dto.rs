//! Subcategories DTO (Data Transfer Objects)

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::domains::categories::dto::CategoryResponse;

/// Subcategory 이름 (다국어)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SubcategoryName {
    pub ko: String,
    pub en: String,
}

/// Subcategory 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SubcategoryResponse {
    pub id: Uuid,
    pub code: String,
    pub name: SubcategoryName,
    pub display_order: i32,
    pub is_active: bool,
}

/// Category with Subcategories 응답
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryWithSubcategories {
    pub category: CategoryResponse,
    pub subcategories: Vec<SubcategoryResponse>,
}

impl From<serde_json::Value> for SubcategoryName {
    fn from(value: serde_json::Value) -> Self {
        SubcategoryName {
            ko: value
                .get("ko")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            en: value
                .get("en")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        }
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use crate::domains::categories::dto::{CategoryName, CategoryResponse};

    #[test]
    fn subcategory_name_roundtrips_serde() {
        let name = SubcategoryName {
            ko: "가".to_string(),
            en: "a".to_string(),
        };
        let json = serde_json::to_string(&name).unwrap();
        let back: SubcategoryName = serde_json::from_str(&json).unwrap();
        assert_eq!(back.ko, "가");
        assert_eq!(back.en, "a");
    }

    #[test]
    fn subcategory_response_roundtrips_with_optional_category_fields_absent() {
        let sub = SubcategoryResponse {
            id: Uuid::nil(),
            code: "sub_code".to_string(),
            name: SubcategoryName {
                ko: "서브".to_string(),
                en: "sub".to_string(),
            },
            display_order: 2,
            is_active: true,
        };
        let json = serde_json::to_string(&sub).unwrap();
        let back: SubcategoryResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(back.code, "sub_code");
        assert_eq!(back.display_order, 2);
    }

    #[test]
    fn category_with_subcategories_deserializes_missing_optional_nested_fields() {
        let json = serde_json::json!({
            "category": {
                "id": "00000000-0000-0000-0000-000000000001",
                "code": "cat",
                "name": { "ko": "K", "en": "E" },
                "display_order": 0,
                "is_active": true
            },
            "subcategories": []
        });
        let v: CategoryWithSubcategories = serde_json::from_value(json).unwrap();
        assert_eq!(v.subcategories.len(), 0);
        assert_eq!(v.category.code, "cat");
        assert!(v.category.icon_url.is_none());
    }

    #[test]
    fn category_with_subcategories_roundtrip_preserves_nested_names() {
        let cat = CategoryResponse {
            id: Uuid::nil(),
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
        let sub = SubcategoryResponse {
            id: Uuid::nil(),
            code: "bags".to_string(),
            name: SubcategoryName {
                ko: "가방".to_string(),
                en: "Bags".to_string(),
            },
            display_order: 1,
            is_active: true,
        };
        let bundle = CategoryWithSubcategories {
            category: cat,
            subcategories: vec![sub],
        };
        let json = serde_json::to_string(&bundle).unwrap();
        let back: CategoryWithSubcategories = serde_json::from_str(&json).unwrap();
        assert_eq!(back.subcategories[0].name.en, "Bags");
        assert_eq!(back.category.name.ko, "패션");
    }

    #[test]
    fn subcategory_name_from_value_empty_object_yields_empty_strings() {
        let name = SubcategoryName::from(serde_json::json!({}));
        assert_eq!(name.ko, "");
        assert_eq!(name.en, "");
    }

    #[test]
    fn subcategory_name_from_value_non_string_fields_yield_empty_strings() {
        let name = SubcategoryName::from(serde_json::json!({ "ko": 10, "en": true }));
        assert_eq!(name.ko, "");
        assert_eq!(name.en, "");
    }

    #[test]
    fn subcategory_name_from_value_partial_strings() {
        let name = SubcategoryName::from(serde_json::json!({ "ko": "한" }));
        assert_eq!(name.ko, "한");
        assert_eq!(name.en, "");
    }
}
