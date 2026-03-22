//! Meilisearch 인덱스 설정
//!
//! 인덱스별 searchable/filterable attributes 설정

use meilisearch_sdk::client::Client;

use super::config::{IndexName, SearchError};

const POSTS_SEARCHABLE: &[&str] = &["artist_name", "group_name", "title"];
const POSTS_FILTERABLE: &[&str] = &["category_id", "context", "media_type", "status"];
const POSTS_SORTABLE: &[&str] = &["created_at", "view_count"];

const SOLUTIONS_SEARCHABLE: &[&str] = &["product_name", "brand"];
const SOLUTIONS_FILTERABLE: &[&str] = &["match_type", "is_verified", "is_adopted", "spot_id"];
const SOLUTIONS_SORTABLE: &[&str] = &["created_at", "accurate_count"];

/// 인덱스 설정 구조체
pub struct IndexConfig {
    client: Client,
}

impl IndexConfig {
    /// 새 IndexConfig 인스턴스 생성
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    /// 모든 인덱스 설정 초기화
    pub async fn setup_all_indexes(&self) -> Result<(), SearchError> {
        self.setup_posts_index().await?;
        self.setup_solutions_index().await?;
        Ok(())
    }

    /// Posts 인덱스 설정
    async fn setup_posts_index(&self) -> Result<(), SearchError> {
        let index = self.client.index(IndexName::Posts.as_str());

        // Searchable attributes 설정
        index
            .set_searchable_attributes(POSTS_SEARCHABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set searchable attributes: {}", e))
            })?;

        // Filterable attributes 설정
        index
            .set_filterable_attributes(POSTS_FILTERABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set filterable attributes: {}", e))
            })?;

        // Sortable attributes 설정
        index
            .set_sortable_attributes(POSTS_SORTABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set sortable attributes: {}", e))
            })?;

        Ok(())
    }

    /// Solutions 인덱스 설정
    async fn setup_solutions_index(&self) -> Result<(), SearchError> {
        let index = self.client.index(IndexName::Solutions.as_str());

        // Searchable attributes 설정
        index
            .set_searchable_attributes(SOLUTIONS_SEARCHABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set searchable attributes: {}", e))
            })?;

        // Filterable attributes 설정
        index
            .set_filterable_attributes(SOLUTIONS_FILTERABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set filterable attributes: {}", e))
            })?;

        // Sortable attributes 설정
        index
            .set_sortable_attributes(SOLUTIONS_SORTABLE)
            .await
            .map_err(|e| {
                SearchError::ConfigError(format!("Failed to set sortable attributes: {}", e))
            })?;

        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    fn attrs_have_no_duplicates(attrs: &[&str]) -> bool {
        let mut v: Vec<&str> = attrs.to_vec();
        let n = v.len();
        v.sort_unstable();
        v.dedup();
        v.len() == n
    }

    #[test]
    fn posts_index_attribute_defaults() {
        assert_eq!(POSTS_SEARCHABLE, &["artist_name", "group_name", "title"]);
        assert_eq!(
            POSTS_FILTERABLE,
            &["category_id", "context", "media_type", "status"]
        );
        assert_eq!(POSTS_SORTABLE, &["created_at", "view_count"]);
        assert!(attrs_have_no_duplicates(POSTS_SEARCHABLE));
        assert!(attrs_have_no_duplicates(POSTS_FILTERABLE));
        assert!(attrs_have_no_duplicates(POSTS_SORTABLE));
    }

    #[test]
    fn solutions_index_attribute_defaults() {
        assert_eq!(SOLUTIONS_SEARCHABLE, &["product_name", "brand"]);
        assert_eq!(
            SOLUTIONS_FILTERABLE,
            &["match_type", "is_verified", "is_adopted", "spot_id"]
        );
        assert_eq!(SOLUTIONS_SORTABLE, &["created_at", "accurate_count"]);
        assert!(attrs_have_no_duplicates(SOLUTIONS_SEARCHABLE));
        assert!(attrs_have_no_duplicates(SOLUTIONS_FILTERABLE));
        assert!(attrs_have_no_duplicates(SOLUTIONS_SORTABLE));
    }
}
