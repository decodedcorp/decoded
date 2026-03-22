//! Meilisearch Client Implementation

use async_trait::async_trait;
use meilisearch_sdk::client::Client;

use crate::config::SearchConfig;
use crate::error::AppError;

use super::client::SearchClient;

/// Meilisearch Client
pub struct MeilisearchClient {
    client: Client,
}

impl MeilisearchClient {
    pub fn new(config: &SearchConfig) -> Result<Self, AppError> {
        if config.url.is_empty() {
            return Err(AppError::Configuration(
                "Meilisearch URL is not configured".to_string(),
            ));
        }

        let api_key = if config.api_key.is_empty() {
            None
        } else {
            Some(&*config.api_key)
        };

        let client = Client::new(&config.url, api_key).map_err(|e| {
            AppError::Configuration(format!("Failed to create Meilisearch client: {}", e))
        })?;

        Ok(Self { client })
    }

    /// 내부 Client 반환 (SynonymManager 등에서 사용)
    pub fn get_client(&self) -> &Client {
        &self.client
    }
}

#[async_trait]
impl SearchClient for MeilisearchClient {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    async fn index(
        &self,
        index_name: &str,
        id: &str,
        document: serde_json::Value,
    ) -> Result<(), AppError> {
        let index = self.client.index(index_name);

        // document에 id 필드 추가
        let mut doc = document;
        if let Some(obj) = doc.as_object_mut() {
            obj.insert("id".to_string(), serde_json::Value::String(id.to_string()));
        }

        index
            .add_documents(&[doc], Some("id"))
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to index document: {}", e)))?;

        Ok(())
    }

    async fn index_documents(
        &self,
        index_name: &str,
        documents: Vec<serde_json::Value>,
    ) -> Result<(), AppError> {
        if documents.is_empty() {
            return Ok(());
        }

        let index = self.client.index(index_name);

        index
            .add_documents(&documents, Some("id"))
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to index documents: {}", e)))?;

        Ok(())
    }

    async fn update_document(
        &self,
        index_name: &str,
        id: &str,
        document: serde_json::Value,
    ) -> Result<(), AppError> {
        let index = self.client.index(index_name);

        // document에 id 필드 추가
        let mut doc = document;
        if let Some(obj) = doc.as_object_mut() {
            obj.insert("id".to_string(), serde_json::Value::String(id.to_string()));
        }

        index
            .add_or_update(&[doc], Some("id"))
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to update document: {}", e)))?;

        Ok(())
    }

    async fn search(
        &self,
        index_name: &str,
        query: &str,
        _filters: Option<serde_json::Value>,
    ) -> Result<Vec<serde_json::Value>, AppError> {
        let index = self.client.index(index_name);

        let results = index
            .search()
            .with_query(query)
            .execute::<serde_json::Value>()
            .await
            .map_err(|e| AppError::ExternalService(format!("Search failed: {}", e)))?;

        Ok(results.hits.into_iter().map(|hit| hit.result).collect())
    }

    async fn delete(&self, index_name: &str, id: &str) -> Result<(), AppError> {
        let index = self.client.index(index_name);

        index
            .delete_document(id)
            .await
            .map_err(|e| AppError::ExternalService(format!("Failed to delete document: {}", e)))?;

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    async fn advanced_search(
        &self,
        index_name: &str,
        query: &str,
        filters: Vec<String>,
        sort: Vec<String>,
        offset: usize,
        limit: usize,
        attributes_to_highlight: Vec<String>,
    ) -> Result<serde_json::Value, AppError> {
        let index = self.client.index(index_name);

        // 필터 문자열 준비
        let filter_str = if !filters.is_empty() {
            Some(filters.join(" AND "))
        } else {
            None
        };

        // 정렬 참조 준비
        let sort_refs: Vec<&str> = sort.iter().map(|s| s.as_str()).collect();

        // 하이라이트 참조 준비
        let highlight_refs: Vec<&str> =
            attributes_to_highlight.iter().map(|s| s.as_str()).collect();

        // 검색 쿼리 빌드
        let mut search = index.search();
        search.with_query(query);

        // 필터 적용
        if let Some(ref filter) = filter_str {
            search.with_filter(filter);
        }

        // 정렬 적용
        if !sort_refs.is_empty() {
            search.with_sort(&sort_refs);
        }

        // 페이지네이션
        search.with_offset(offset).with_limit(limit);

        // 하이라이트
        if !highlight_refs.is_empty() {
            search.with_attributes_to_highlight(meilisearch_sdk::search::Selectors::Some(
                &highlight_refs,
            ));
        }

        let results = search
            .execute::<serde_json::Value>()
            .await
            .map_err(|e| AppError::ExternalService(format!("Advanced search failed: {}", e)))?;

        // SearchResults를 JSON으로 직렬화
        let json = serde_json::to_value(results).map_err(|e| {
            AppError::ExternalService(format!("Failed to serialize results: {}", e))
        })?;

        Ok(json)
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_meilisearch_client_configuration() {
        let config = SearchConfig {
            url: String::new(),
            api_key: String::new(),
        };

        let result = MeilisearchClient::new(&config);
        assert!(result.is_err());

        let config = SearchConfig {
            url: "http://localhost:7700".to_string(),
            api_key: String::new(),
        };

        let result = MeilisearchClient::new(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_meilisearch_empty_url_error_message() {
        let config = SearchConfig {
            url: String::new(),
            api_key: "masterKey".to_string(),
        };

        let err = MeilisearchClient::new(&config)
            .err()
            .expect("expected configuration error");
        let msg = err.to_string();
        assert!(
            msg.contains("Meilisearch URL") && msg.contains("not configured"),
            "unexpected message: {msg}"
        );
    }

    #[test]
    fn test_meilisearch_constructs_with_api_key() {
        let config = SearchConfig {
            url: "http://127.0.0.1:7700".to_string(),
            api_key: "masterKey".to_string(),
        };

        let client = MeilisearchClient::new(&config).unwrap();
        let c1 = std::ptr::from_ref(client.get_client());
        let c2 = std::ptr::from_ref(client.get_client());
        assert_eq!(c1, c2);
    }

    #[test]
    fn test_meilisearch_constructs_https_host_without_network() {
        // SDK only builds an HTTP client; host is not contacted during construction.
        let config = SearchConfig {
            url: "https://search.example.com".to_string(),
            api_key: String::new(),
        };

        assert!(MeilisearchClient::new(&config).is_ok());
    }
}
