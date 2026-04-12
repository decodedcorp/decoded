//! 매거진 프리뷰 아이템 DTO + 파서
//!
//! 홈 매거진 카드의 썸네일 스트립 전용. `posts/dto.rs` 에서 분리.

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// 매거진 레이아웃 아이템의 프리뷰 슬라이스 (홈 매거진 카드용).
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostMagazinePreviewItem {
    pub title: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand: Option<String>,

    pub image_url: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_url: Option<String>,
}

/// `post_magazines.layout_json` 에서 프리뷰 아이템을 추출한다.
pub fn parse_magazine_preview_items(
    layout_json: &serde_json::Value,
    limit: usize,
) -> Vec<PostMagazinePreviewItem> {
    let Some(items) = layout_json.get("items").and_then(|v| v.as_array()) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let image_url = item.get("image_url").and_then(|v| v.as_str())?;
            if image_url.is_empty() {
                return None;
            }
            Some(PostMagazinePreviewItem {
                title: item
                    .get("title")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                brand: item
                    .get("brand")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                image_url: image_url.to_string(),
                original_url: item
                    .get("original_url")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            })
        })
        .take(limit)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn extracts_top_n_with_image_url() {
        let layout = json!({
            "items": [
                { "title": "T1", "brand": "B1", "image_url": "https://a", "original_url": "https://o1" },
                { "title": "T2", "brand": null, "image_url": "", "original_url": null },
                { "title": "T3", "image_url": "https://b" },
                { "title": "T4", "brand": "B4", "image_url": "https://c" },
                { "title": "T5", "brand": "B5", "image_url": "https://d" },
            ]
        });
        let out = parse_magazine_preview_items(&layout, 4);
        assert_eq!(out.len(), 4);
        assert_eq!(out[0].title, "T1");
        assert_eq!(out[0].brand.as_deref(), Some("B1"));
        assert_eq!(out[1].title, "T3");
        assert_eq!(out[1].brand, None);
    }

    #[test]
    fn missing_or_invalid_returns_empty() {
        assert!(parse_magazine_preview_items(&json!({}), 4).is_empty());
        assert!(parse_magazine_preview_items(&json!({ "items": "nope" }), 4).is_empty());
        assert!(parse_magazine_preview_items(&json!({ "items": [] }), 4).is_empty());
    }
}
