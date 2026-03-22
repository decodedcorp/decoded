//! Search 도메인 테스트

use super::dto::*;

#[test]
fn test_search_query_defaults() {
    let query = SearchQuery::default();
    assert_eq!(query.q, "");
    assert_eq!(query.sort, "relevant");
    assert_eq!(query.page, 1);
    assert_eq!(query.limit, 20);
}

#[test]
fn test_search_query_with_filters() {
    let query = SearchQuery {
        q: "jennie airport".to_string(),
        category: Some("fashion".to_string()),
        media_type: Some("variety".to_string()),
        context: Some("airport".to_string()),
        has_adopted: Some(true),
        sort: "popular".to_string(),
        page: 2,
        limit: 30,
    };

    assert_eq!(query.q, "jennie airport");
    assert_eq!(query.category.unwrap(), "fashion");
    assert_eq!(query.media_type.unwrap(), "variety");
    assert_eq!(query.context.unwrap(), "airport");
    assert!(query.has_adopted.unwrap());
    assert_eq!(query.sort, "popular");
    assert_eq!(query.page, 2);
    assert_eq!(query.limit, 30);
}

#[test]
fn test_search_result_item_type_field() {
    let item = SearchResultItem {
        id: uuid::Uuid::new_v4(),
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

    assert_eq!(item.type_, "post");
    assert_eq!(item.spot_count, 5);
    assert_eq!(item.view_count, 3200);
}

#[test]
fn test_media_source_serialization() {
    let media = MediaSource {
        type_: "movie".to_string(),
        title: Some("The Devil Wears Prada".to_string()),
    };

    let json = serde_json::to_value(&media).unwrap();
    assert_eq!(json["type"], "movie");
    assert_eq!(json["title"], "The Devil Wears Prada");
}

#[test]
fn test_facets_empty() {
    let facets = Facets {
        category: None,
        context: None,
        media_type: None,
    };

    let json = serde_json::to_value(&facets).unwrap();
    assert!(json.is_object());
}

#[test]
fn test_popular_search_item() {
    let item = PopularSearchItem {
        rank: 1,
        query: "jennie".to_string(),
        search_count: 1250,
    };

    assert_eq!(item.rank, 1);
    assert_eq!(item.query, "jennie");
    assert_eq!(item.search_count, 1250);
}

#[test]
fn test_recent_search_item() {
    let item = RecentSearchItem {
        id: uuid::Uuid::new_v4(),
        query: "blackpink".to_string(),
        searched_at: chrono::Utc::now(),
    };

    assert_eq!(item.query, "blackpink");
    assert!(!item.id.is_nil());
}

// --- Phase 29: Vector Search (similar search) ---

#[test]
fn test_similar_search_query() {
    let query = SimilarSearchQuery {
        q: "jennie airport".to_string(),
        entity_type: Some("solution".to_string()),
        limit: 20,
    };

    assert_eq!(query.q, "jennie airport");
    assert_eq!(query.entity_type.as_deref(), Some("solution"));
    assert_eq!(query.limit, 20);
}

#[test]
fn test_similar_search_query_limit_capped() {
    // limit 기본 10, 최대 50 (핸들러/서비스에서 적용)
    let query = SimilarSearchQuery {
        q: "test".to_string(),
        entity_type: None,
        limit: 100,
    };
    let effective_limit = query.limit.min(50);
    assert_eq!(effective_limit, 50);
}

#[test]
fn test_similar_search_result_item() {
    let id = uuid::Uuid::new_v4();
    let item = SimilarSearchResultItem {
        entity_type: "solution".to_string(),
        entity_id: id,
        similarity: 0.92,
        content_text: "Jennie airport fashion bag".to_string(),
    };

    assert_eq!(item.entity_type, "solution");
    assert_eq!(item.entity_id, id);
    assert!((item.similarity - 0.92).abs() < 1e-6);
    assert_eq!(item.content_text, "Jennie airport fashion bag");
}

#[test]
fn test_similar_search_response() {
    let resp = SimilarSearchResponse {
        data: vec![SimilarSearchResultItem {
            entity_type: "post".to_string(),
            entity_id: uuid::Uuid::new_v4(),
            similarity: 0.88,
            content_text: "test".to_string(),
        }],
        query: "jennie".to_string(),
        took_ms: 42,
    };

    assert_eq!(resp.data.len(), 1);
    assert_eq!(resp.query, "jennie");
    assert_eq!(resp.took_ms, 42);
}
