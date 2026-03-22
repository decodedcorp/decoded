use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct GeneratePostMagazineRequest {
    pub post_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct GeneratePostMagazineResponse {
    pub post_magazine_id: Uuid,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct RelatedEditorialItem {
    pub post_id: Uuid,
    pub title: String,
    pub image_url: Option<String>,
    pub bg_color: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PostMagazineResponse {
    pub id: Uuid,
    pub title: String,
    pub subtitle: Option<String>,
    pub keyword: Option<String>,
    pub layout_json: Option<serde_json::Value>,
    pub status: String,
    pub review_summary: Option<String>,
    pub error_log: Option<serde_json::Value>,
    pub created_at: String,
    pub updated_at: String,
    pub published_at: Option<String>,
    pub related_editorials: Vec<RelatedEditorialItem>,
}

#[derive(Debug, Serialize)]
pub struct SolutionData {
    pub id: String,
    pub spot_id: String,
    pub title: String,
    pub link_type: Option<String>,
    pub original_url: Option<String>,
    pub affiliate_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub description: Option<String>,
    pub comment: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub keywords: Option<serde_json::Value>,
    pub qna: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SpotData {
    pub id: String,
    pub post_id: String,
    pub position_left: String,
    pub position_top: String,
    pub subcategory_id: Option<String>,
    pub solutions: Vec<SolutionData>,
}

#[derive(Debug, Serialize)]
pub struct PostData {
    pub id: String,
    pub user_id: String,
    pub image_url: String,
    pub media_type: String,
    pub title: Option<String>,
    pub artist_name: Option<String>,
    pub group_name: Option<String>,
    pub context: Option<String>,
    pub view_count: i32,
    pub trending_score: Option<f64>,
    pub spots: Vec<SpotData>,
}

#[derive(Debug, Serialize)]
pub struct TriggerPostEditorialPayload {
    pub post_magazine_id: String,
    pub post_data: PostData,
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn sample_uuid() -> Uuid {
        Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
    }

    #[test]
    fn generate_post_magazine_request_deserializes_post_id() {
        let id = sample_uuid();
        let json = format!(r#"{{"post_id":"{}"}}"#, id);
        let req: GeneratePostMagazineRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(req.post_id, id);
    }

    #[test]
    fn generate_post_magazine_response_serializes_field_names() {
        let r = GeneratePostMagazineResponse {
            post_magazine_id: sample_uuid(),
            status: "pending".to_string(),
        };
        let v: serde_json::Value = serde_json::to_value(&r).unwrap();
        assert_eq!(v["post_magazine_id"], sample_uuid().to_string());
        assert_eq!(v["status"], "pending");
        let obj = v.as_object().unwrap();
        assert_eq!(obj.len(), 2);
    }

    #[test]
    fn post_magazine_response_serializes_options_null_and_empty_related_editorials() {
        let r = PostMagazineResponse {
            id: sample_uuid(),
            title: "T".to_string(),
            subtitle: None,
            keyword: None,
            layout_json: None,
            status: "draft".to_string(),
            review_summary: None,
            error_log: None,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-02T00:00:00Z".to_string(),
            published_at: None,
            related_editorials: vec![],
        };
        let v: serde_json::Value = serde_json::to_value(&r).unwrap();
        assert_eq!(v["title"], "T");
        assert_eq!(v["subtitle"], serde_json::Value::Null);
        assert_eq!(v["keyword"], serde_json::Value::Null);
        assert_eq!(v["layout_json"], serde_json::Value::Null);
        assert_eq!(v["review_summary"], serde_json::Value::Null);
        assert_eq!(v["error_log"], serde_json::Value::Null);
        assert_eq!(v["published_at"], serde_json::Value::Null);
        assert_eq!(v["related_editorials"], serde_json::json!([]));
        assert_eq!(v["status"], "draft");
    }

    #[test]
    fn post_magazine_response_serializes_some_options_and_related_items() {
        let r = PostMagazineResponse {
            id: sample_uuid(),
            title: "Title".to_string(),
            subtitle: Some("Sub".to_string()),
            keyword: Some("kw".to_string()),
            layout_json: Some(serde_json::json!({ "a": 1 })),
            status: "published".to_string(),
            review_summary: Some("ok".to_string()),
            error_log: Some(serde_json::json!({ "e": "x" })),
            created_at: "c".to_string(),
            updated_at: "u".to_string(),
            published_at: Some("p".to_string()),
            related_editorials: vec![RelatedEditorialItem {
                post_id: sample_uuid(),
                title: "Related".to_string(),
                image_url: Some("https://i.example/x.png".to_string()),
                bg_color: None,
            }],
        };
        let v: serde_json::Value = serde_json::to_value(&r).unwrap();
        assert_eq!(v["subtitle"], "Sub");
        assert_eq!(v["layout_json"], serde_json::json!({ "a": 1 }));
        assert_eq!(v["published_at"], "p");
        let rel = &v["related_editorials"][0];
        assert_eq!(rel["post_id"], sample_uuid().to_string());
        assert_eq!(rel["title"], "Related");
        assert_eq!(rel["image_url"], "https://i.example/x.png");
        assert_eq!(rel["bg_color"], serde_json::Value::Null);
    }

    #[test]
    fn related_editorial_item_field_names_are_snake_case() {
        let item = RelatedEditorialItem {
            post_id: sample_uuid(),
            title: "x".to_string(),
            image_url: None,
            bg_color: Some("#fff".to_string()),
        };
        let v: serde_json::Value = serde_json::to_value(&item).unwrap();
        let obj = v.as_object().unwrap();
        assert!(obj.contains_key("post_id"));
        assert!(obj.contains_key("image_url"));
        assert!(obj.contains_key("bg_color"));
        assert_eq!(obj.len(), 4);
    }

    fn sample_solution() -> SolutionData {
        SolutionData {
            id: "sol-1".to_string(),
            spot_id: "spot-1".to_string(),
            title: "Solution".to_string(),
            link_type: Some("external".to_string()),
            original_url: Some("https://o.example".to_string()),
            affiliate_url: None,
            thumbnail_url: None,
            description: Some("d".to_string()),
            comment: None,
            metadata: Some(serde_json::json!({ "m": 1 })),
            keywords: None,
            qna: Some(serde_json::json!([])),
        }
    }

    #[test]
    fn post_spot_solution_nested_serializes_field_names_and_empty_vectors() {
        let post = PostData {
            id: "post-1".to_string(),
            user_id: "user-1".to_string(),
            image_url: "https://img".to_string(),
            media_type: "image".to_string(),
            title: Some("Post".to_string()),
            artist_name: None,
            group_name: None,
            context: None,
            view_count: 42,
            trending_score: Some(1.5),
            spots: vec![SpotData {
                id: "spot-1".to_string(),
                post_id: "post-1".to_string(),
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: Some("sub-1".to_string()),
                solutions: vec![],
            }],
        };
        let v: serde_json::Value = serde_json::to_value(&post).unwrap();
        assert_eq!(v["view_count"], 42);
        assert_eq!(v["trending_score"], 1.5);
        assert_eq!(v["artist_name"], serde_json::Value::Null);
        let spot = &v["spots"][0];
        assert_eq!(spot["position_left"], "10");
        assert_eq!(spot["position_top"], "20");
        assert_eq!(spot["subcategory_id"], "sub-1");
        assert_eq!(spot["solutions"], serde_json::json!([]));

        let with_solution = PostData {
            id: "post-1".to_string(),
            user_id: "user-1".to_string(),
            image_url: "https://img".to_string(),
            media_type: "image".to_string(),
            title: None,
            artist_name: None,
            group_name: None,
            context: None,
            view_count: 0,
            trending_score: None,
            spots: vec![SpotData {
                id: "spot-1".to_string(),
                post_id: "post-1".to_string(),
                position_left: "0".to_string(),
                position_top: "0".to_string(),
                subcategory_id: None,
                solutions: vec![sample_solution()],
            }],
        };
        let v2: serde_json::Value = serde_json::to_value(&with_solution).unwrap();
        let sol = &v2["spots"][0]["solutions"][0];
        assert_eq!(sol["id"], "sol-1");
        assert_eq!(sol["spot_id"], "spot-1");
        assert_eq!(sol["link_type"], "external");
        assert_eq!(sol["affiliate_url"], serde_json::Value::Null);
        assert_eq!(sol["keywords"], serde_json::Value::Null);
        assert_eq!(sol["metadata"], serde_json::json!({ "m": 1 }));
    }

    #[test]
    fn trigger_post_editorial_payload_serializes_nested_post_data() {
        let payload = TriggerPostEditorialPayload {
            post_magazine_id: "pm-1".to_string(),
            post_data: PostData {
                id: "post-1".to_string(),
                user_id: "user-1".to_string(),
                image_url: "https://img".to_string(),
                media_type: "image".to_string(),
                title: None,
                artist_name: None,
                group_name: None,
                context: None,
                view_count: 0,
                trending_score: None,
                spots: vec![],
            },
        };
        let v: serde_json::Value = serde_json::to_value(&payload).unwrap();
        assert_eq!(v["post_magazine_id"], "pm-1");
        assert_eq!(v["post_data"]["spots"], serde_json::json!([]));
        assert_eq!(v["post_data"]["id"], "post-1");
    }
}
