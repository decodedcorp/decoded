//! Meilisearch 동의어 관리
//!
//! DB의 synonyms 테이블과 Meilisearch 동의어 동기화

use meilisearch_sdk::client::Client;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::collections::HashMap;
use std::sync::Arc;

use crate::entities;

use super::config::{IndexName, SearchError};

/// Meilisearch 형식의 동의어 맵 생성 (DB 모델 → 동의어 그룹)
pub(crate) fn build_synonym_map_from_models(
    synonyms: Vec<entities::SynonymsModel>,
) -> HashMap<String, Vec<String>> {
    let mut map = HashMap::new();

    for synonym in synonyms {
        let mut all_terms = vec![synonym.canonical.clone()];
        all_terms.extend(synonym.synonyms.clone());

        map.insert(synonym.canonical, all_terms);
    }

    map
}

/// 동의어 관리자
pub struct SynonymManager {
    client: Client,
    db: Arc<DatabaseConnection>,
}

impl SynonymManager {
    /// 새 SynonymManager 인스턴스 생성
    pub fn new(client: Client, db: Arc<DatabaseConnection>) -> Self {
        Self { client, db }
    }

    /// 모든 인덱스의 동의어 동기화
    pub async fn sync_all_synonyms(&self) -> Result<(), SearchError> {
        self.sync_posts_synonyms().await?;
        self.sync_solutions_synonyms().await?;
        Ok(())
    }

    /// Posts 인덱스 동의어 동기화
    async fn sync_posts_synonyms(&self) -> Result<(), SearchError> {
        let synonyms = self.fetch_active_synonyms().await?;
        let synonym_map = build_synonym_map_from_models(synonyms);

        let index = self.client.index(IndexName::Posts.as_str());

        index
            .set_synonyms(&synonym_map)
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to set synonyms: {}", e)))?;

        Ok(())
    }

    /// Solutions 인덱스 동의어 동기화 (브랜드명 중심)
    async fn sync_solutions_synonyms(&self) -> Result<(), SearchError> {
        let synonyms = self.fetch_synonyms_by_type(&["brand".to_string()]).await?;
        let synonym_map = build_synonym_map_from_models(synonyms);

        let index = self.client.index(IndexName::Solutions.as_str());

        index
            .set_synonyms(&synonym_map)
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to set synonyms: {}", e)))?;

        Ok(())
    }

    /// DB에서 활성화된 모든 동의어 조회
    async fn fetch_active_synonyms(&self) -> Result<Vec<entities::SynonymsModel>, SearchError> {
        entities::Synonyms::find()
            .filter(entities::synonyms::Column::IsActive.eq(true))
            .all(self.db.as_ref())
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to fetch synonyms: {}", e)))
    }

    /// 특정 타입의 동의어 조회
    async fn fetch_synonyms_by_type(
        &self,
        types: &[String],
    ) -> Result<Vec<entities::SynonymsModel>, SearchError> {
        entities::Synonyms::find()
            .filter(entities::synonyms::Column::IsActive.eq(true))
            .filter(entities::synonyms::Column::Type.is_in(types))
            .all(self.db.as_ref())
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to fetch synonyms: {}", e)))
    }

    /// 특정 동의어 업데이트 (Admin API용)
    pub async fn update_synonym(&self, synonym_id: uuid::Uuid) -> Result<(), SearchError> {
        // DB에서 동의어 조회
        let synonym = entities::Synonyms::find_by_id(synonym_id)
            .one(self.db.as_ref())
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to find synonym: {}", e)))?
            .ok_or_else(|| SearchError::SynonymError("Synonym not found".to_string()))?;

        // 타입에 따라 적절한 인덱스에 동기화
        match synonym.type_.as_str() {
            "brand" => self.sync_solutions_synonyms().await?,
            _ => self.sync_posts_synonyms().await?,
        }

        Ok(())
    }

    /// 모든 동의어 삭제 (테스트용)
    pub async fn clear_all_synonyms(&self) -> Result<(), SearchError> {
        let empty_map: HashMap<String, Vec<String>> = HashMap::new();

        let posts_index = self.client.index(IndexName::Posts.as_str());
        posts_index
            .set_synonyms(&empty_map)
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to clear synonyms: {}", e)))?;

        let solutions_index = self.client.index(IndexName::Solutions.as_str());
        solutions_index
            .set_synonyms(&empty_map)
            .await
            .map_err(|e| SearchError::SynonymError(format!("Failed to clear synonyms: {}", e)))?;

        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    fn sample_model(canonical: &str, synonyms: Vec<&str>) -> entities::SynonymsModel {
        entities::SynonymsModel {
            id: uuid::Uuid::new_v4(),
            type_: "artist".to_string(),
            canonical: canonical.to_string(),
            synonyms: synonyms.into_iter().map(String::from).collect(),
            is_active: true,
            created_at: chrono::Utc::now().into(),
            updated_at: chrono::Utc::now().into(),
        }
    }

    #[test]
    fn build_synonym_map_includes_canonical_and_synonyms() {
        let synonyms = vec![sample_model("Jennie", vec!["제니", "JENNIE"])];

        let result = build_synonym_map_from_models(synonyms);

        assert!(result.contains_key("Jennie"));
        let jennie_synonyms = result.get("Jennie").unwrap();
        assert_eq!(jennie_synonyms.len(), 3);
        assert!(jennie_synonyms.contains(&"Jennie".to_string()));
        assert!(jennie_synonyms.contains(&"제니".to_string()));
        assert!(jennie_synonyms.contains(&"JENNIE".to_string()));
    }

    #[test]
    fn build_synonym_map_empty_input() {
        let result = build_synonym_map_from_models(vec![]);
        assert!(result.is_empty());
    }

    #[test]
    fn build_synonym_map_empty_synonym_list_still_has_canonical() {
        let synonyms = vec![sample_model("solo", vec![])];
        let result = build_synonym_map_from_models(synonyms);
        assert_eq!(result.get("solo").unwrap(), &vec!["solo".to_string()]);
    }

    #[test]
    fn build_synonym_map_duplicate_canonical_last_row_wins() {
        let synonyms = vec![
            sample_model("dup", vec!["a"]),
            sample_model("dup", vec!["b"]),
        ];
        let result = build_synonym_map_from_models(synonyms);
        assert_eq!(result.len(), 1);
        assert_eq!(
            result.get("dup").unwrap(),
            &vec!["dup".to_string(), "b".to_string()]
        );
    }

    #[test]
    fn build_synonym_map_preserves_synonym_ordering_with_canonical_first() {
        let synonyms = vec![sample_model("Jennie", vec!["제니", "JENNIE"])];
        let result = build_synonym_map_from_models(synonyms);
        let list = result.get("Jennie").unwrap();
        assert_eq!(list[0], "Jennie");
        assert_eq!(list[1], "제니");
        assert_eq!(list[2], "JENNIE");
    }

    #[test]
    fn build_synonym_map_with_unicode_canonical() {
        let synonyms = vec![sample_model("제니", vec!["Jennie"])];
        let result = build_synonym_map_from_models(synonyms);
        assert!(result.contains_key("제니"));
        assert_eq!(result.get("제니").unwrap().len(), 2);
    }

    #[tokio::test]
    async fn synonym_manager_new_constructs() {
        // Ensure `SynonymManager::new` can be called with a dummy client+db.
        let db = Arc::new(crate::tests::helpers::empty_mock_db());
        let client = Client::new("http://localhost:7700", None::<String>).expect("client");
        let _manager = SynonymManager::new(client, db);
    }

    #[test]
    fn build_synonym_map_multiple_keys() {
        let synonyms = vec![
            sample_model("one", vec!["1"]),
            sample_model("two", vec!["2"]),
        ];
        let result = build_synonym_map_from_models(synonyms);
        assert_eq!(result.len(), 2);
        assert!(result.contains_key("one"));
        assert!(result.contains_key("two"));
    }
}
