//! Search Service 통합 테스트
//!
//! MeilisearchClient, SearchClient, IndexName, SearchOptions 통합 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod integration_tests {
    use crate::config::SearchConfig;
    use crate::services::search::{
        DummySearchClient, IndexName, MeilisearchClient, SearchClient, SearchOptions,
    };
    use serde_json::json;

    #[tokio::test]
    async fn test_dummy_search_client_workflow() {
        let client = DummySearchClient;

        // 단일 문서 인덱싱
        let result = client
            .index("posts", "1", json!({"title": "Test Post"}))
            .await;
        assert!(result.is_ok());

        // 배치 문서 인덱싱
        let documents = vec![
            json!({"id": "2", "title": "Post 2"}),
            json!({"id": "3", "title": "Post 3"}),
        ];
        let result = client.index_documents("posts", documents).await;
        assert!(result.is_ok());

        // 검색
        let results = client.search("posts", "test", None).await;
        assert!(results.is_ok());

        // 문서 업데이트
        let result = client
            .update_document("posts", "1", json!({"title": "Updated Post"}))
            .await;
        assert!(result.is_ok());

        // 문서 삭제
        let result = client.delete("posts", "1").await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_meilisearch_client_invalid_config() {
        let config = SearchConfig {
            url: String::new(),
            api_key: String::new(),
        };

        let result = MeilisearchClient::new(&config);
        assert!(result.is_err());
    }

    #[test]
    fn test_meilisearch_client_valid_config() {
        let config = SearchConfig {
            url: "http://localhost:7700".to_string(),
            api_key: "test-key".to_string(),
        };

        let result = MeilisearchClient::new(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_meilisearch_client_empty_api_key() {
        let config = SearchConfig {
            url: "http://localhost:7700".to_string(),
            api_key: String::new(),
        };

        let result = MeilisearchClient::new(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_index_name_as_str() {
        assert_eq!(IndexName::Posts.as_str(), "posts");
        assert_eq!(IndexName::Solutions.as_str(), "solutions");
    }

    #[test]
    fn test_index_name_display() {
        assert_eq!(format!("{}", IndexName::Posts), "posts");
        assert_eq!(format!("{}", IndexName::Solutions), "solutions");
    }

    #[test]
    fn test_search_options_default() {
        let options = SearchOptions::default();
        assert_eq!(options.limit, 20);
        assert_eq!(options.offset, 0);
        assert!(options.filters.is_none());
        assert!(options.sort.is_none());
    }

    #[test]
    fn test_search_options_custom() {
        let options = SearchOptions {
            limit: 50,
            offset: 10,
            filters: Some("status = 'published'".to_string()),
            sort: Some(vec!["created_at:desc".to_string()]),
        };

        assert_eq!(options.limit, 50);
        assert_eq!(options.offset, 10);
        assert_eq!(options.filters.unwrap(), "status = 'published'");
        assert_eq!(options.sort.unwrap()[0], "created_at:desc");
    }

    #[test]
    fn test_search_options_serialization() {
        let options = SearchOptions {
            limit: 30,
            offset: 5,
            filters: Some("category_id = 1".to_string()),
            sort: None,
        };

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"limit\":30"));
        assert!(json.contains("\"offset\":5"));
        assert!(json.contains("\"filters\""));
    }

    #[test]
    fn test_search_options_deserialization() {
        let json = r#"{"limit":15,"offset":0}"#;
        let options: SearchOptions = serde_json::from_str(json).unwrap();

        assert_eq!(options.limit, 15);
        assert_eq!(options.offset, 0);
        assert!(options.filters.is_none());
        assert!(options.sort.is_none());
    }

    #[tokio::test]
    async fn test_search_client_empty_batch_indexing() {
        let client = DummySearchClient;
        let documents = vec![];
        let result = client.index_documents("posts", documents).await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_index_name_equality() {
        assert_eq!(IndexName::Posts, IndexName::Posts);
        assert_eq!(IndexName::Solutions, IndexName::Solutions);
        assert_ne!(IndexName::Posts, IndexName::Solutions);
    }
}
