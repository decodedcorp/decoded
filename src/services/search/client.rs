//! Search Client Trait
//!
//! 문서 인덱싱, 검색, 삭제를 지원하는 추상화 계층

use async_trait::async_trait;

use crate::error::AppError;

/// Search Client Trait
///
/// 문서 인덱싱, 검색, 삭제 등을 지원합니다.
#[async_trait]
pub trait SearchClient: Send + Sync {
    /// 타입 캐스팅을 위한 Any 트레이트 (MeilisearchClient 접근용)
    fn as_any(&self) -> &dyn std::any::Any;
    /// 단일 문서 인덱싱
    async fn index(
        &self,
        index_name: &str,
        id: &str,
        document: serde_json::Value,
    ) -> Result<(), AppError>;

    /// 배치 문서 인덱싱
    async fn index_documents(
        &self,
        index_name: &str,
        documents: Vec<serde_json::Value>,
    ) -> Result<(), AppError>;

    /// 문서 업데이트
    async fn update_document(
        &self,
        index_name: &str,
        id: &str,
        document: serde_json::Value,
    ) -> Result<(), AppError>;

    /// 검색
    async fn search(
        &self,
        index_name: &str,
        query: &str,
        filters: Option<serde_json::Value>,
    ) -> Result<Vec<serde_json::Value>, AppError>;

    /// 문서 삭제
    async fn delete(&self, index_name: &str, id: &str) -> Result<(), AppError>;

    /// 고급 검색 (필터, 정렬, 페이지네이션, 하이라이트 지원)
    ///
    /// Meilisearch 전용 고급 검색 기능. Dummy client는 빈 결과 반환.
    #[allow(clippy::too_many_arguments)]
    async fn advanced_search(
        &self,
        _index_name: &str,
        _query: &str,
        _filters: Vec<String>,
        _sort: Vec<String>,
        _offset: usize,
        _limit: usize,
        _attributes_to_highlight: Vec<String>,
    ) -> Result<serde_json::Value, AppError> {
        // 기본 구현: 빈 결과 (`json!` 매크로 전개에 unwrap 포함)
        #[allow(clippy::disallowed_methods)]
        Ok(serde_json::json!({
            "hits": [],
            "estimatedTotalHits": 0,
            "processingTimeMs": 0
        }))
    }
}

/// Dummy Search Client (테스트 및 개발용)
pub struct DummySearchClient;

impl Default for DummySearchClient {
    fn default() -> Self {
        Self
    }
}

#[async_trait]
impl SearchClient for DummySearchClient {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    async fn index(
        &self,
        _index_name: &str,
        _id: &str,
        _document: serde_json::Value,
    ) -> Result<(), AppError> {
        Ok(())
    }

    async fn index_documents(
        &self,
        _index_name: &str,
        _documents: Vec<serde_json::Value>,
    ) -> Result<(), AppError> {
        Ok(())
    }

    async fn update_document(
        &self,
        _index_name: &str,
        _id: &str,
        _document: serde_json::Value,
    ) -> Result<(), AppError> {
        Ok(())
    }

    async fn search(
        &self,
        _index_name: &str,
        _query: &str,
        _filters: Option<serde_json::Value>,
    ) -> Result<Vec<serde_json::Value>, AppError> {
        Ok(vec![])
    }

    async fn delete(&self, _index_name: &str, _id: &str) -> Result<(), AppError> {
        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_dummy_search_client_index() {
        let client = DummySearchClient;
        let result = client
            .index("posts", "123", json!({"title": "Test Post"}))
            .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_dummy_search_client_search() {
        let client = DummySearchClient;
        let results = client.search("posts", "test", None).await.unwrap();
        assert!(results.is_empty());
    }

    #[tokio::test]
    async fn test_dummy_search_client_delete() {
        let client = DummySearchClient;
        let result = client.delete("posts", "123").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_dummy_search_client_index_documents() {
        let client = DummySearchClient;
        let documents = vec![
            json!({"id": "1", "title": "Post 1"}),
            json!({"id": "2", "title": "Post 2"}),
        ];
        let result = client.index_documents("posts", documents).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_dummy_search_client_update_document() {
        let client = DummySearchClient;
        let result = client
            .update_document("posts", "123", json!({"title": "Updated Post"}))
            .await;
        assert!(result.is_ok());
    }
}
