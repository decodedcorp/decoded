//! Search Service 설정 및 타입
//!
//! IndexName, SearchOptions, SearchError 등 검색 관련 타입 정의

use serde::{Deserialize, Serialize};
use std::fmt;

/// 인덱스 이름
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IndexName {
    /// 포스트 인덱스
    Posts,
    /// 솔루션 인덱스
    Solutions,
}

impl IndexName {
    /// 인덱스 이름을 문자열로 반환
    pub fn as_str(&self) -> &'static str {
        match self {
            IndexName::Posts => "posts",
            IndexName::Solutions => "solutions",
        }
    }
}

impl fmt::Display for IndexName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// 검색 옵션
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    /// 최대 결과 수 (기본값: 20)
    #[serde(default = "default_limit")]
    pub limit: u32,

    /// 오프셋 (기본값: 0)
    #[serde(default)]
    pub offset: u32,

    /// 필터 (Meilisearch 필터 문법)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filters: Option<String>,

    /// 정렬 (예: "created_at:desc")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort: Option<Vec<String>>,
}

fn default_limit() -> u32 {
    20
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            limit: default_limit(),
            offset: 0,
            filters: None,
            sort: None,
        }
    }
}

/// 검색 에러
#[derive(Debug, thiserror::Error)]
pub enum SearchError {
    /// 인덱스 에러
    #[error("Index error: {0}")]
    IndexError(String),

    /// 쿼리 에러
    #[error("Query error: {0}")]
    QueryError(String),

    /// 동의어 에러
    #[error("Synonym error: {0}")]
    SynonymError(String),

    /// 설정 에러
    #[error("Config error: {0}")]
    ConfigError(String),

    /// 연결 에러
    #[error("Connection error: {0}")]
    ConnectionError(String),
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

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
        assert!(options.filters.is_some());
        assert!(options.sort.is_some());
    }

    #[test]
    fn test_search_error_display() {
        let err = SearchError::IndexError("Index not found".to_string());
        assert_eq!(err.to_string(), "Index error: Index not found");

        let err = SearchError::QueryError("Invalid query".to_string());
        assert_eq!(err.to_string(), "Query error: Invalid query");

        let err = SearchError::SynonymError("Synonym not found".to_string());
        assert_eq!(err.to_string(), "Synonym error: Synonym not found");

        let err = SearchError::ConfigError("Invalid config".to_string());
        assert_eq!(err.to_string(), "Config error: Invalid config");

        let err = SearchError::ConnectionError("Connection timeout".to_string());
        assert_eq!(err.to_string(), "Connection error: Connection timeout");
    }
}
