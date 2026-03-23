//! Categories cache service
//!
//! Gemini 프롬프트에 동적으로 카테고리 규칙을 주입하기 위한 캐시

use moka::future::Cache;
use sea_orm::DatabaseConnection;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use crate::{domains::subcategories::service as subcategory_service, error::AppResult};

/// 카테고리 캐시 키
const CACHE_KEY: &str = "categories_with_subcategories";

/// 카테고리 캐시 TTL (5분)
const CACHE_TTL_SECS: u64 = 300;

/// 카테고리 캐시
pub struct CategoryCache {
    cache: Cache<String, Arc<HashMap<String, Vec<String>>>>,
}

impl CategoryCache {
    /// 새로운 카테고리 캐시 생성
    pub fn new() -> Self {
        let cache = Cache::builder()
            .time_to_live(Duration::from_secs(CACHE_TTL_SECS))
            .max_capacity(10) // 소량의 데이터만 저장
            .build();

        Self { cache }
    }

    /// 카테고리와 서브카테고리 조회 (캐시 사용)
    ///
    /// 반환 형식: HashMap<카테고리코드, Vec<서브카테고리코드>>
    /// 예: { "wearables": ["headwear", "tops", ...], ... }
    pub async fn get_categories(
        &self,
        db: &DatabaseConnection,
    ) -> AppResult<Arc<HashMap<String, Vec<String>>>> {
        // 캐시에서 조회
        if let Some(cached) = self.cache.get(&CACHE_KEY.to_string()).await {
            return Ok(cached);
        }

        // 캐시 미스: DB에서 조회
        let categories_with_subs = subcategory_service::list_all_with_categories(db).await?;

        let mut result = HashMap::new();
        for category_with_sub in categories_with_subs {
            let category_code = category_with_sub.category.code;
            let subcategory_codes: Vec<String> = category_with_sub
                .subcategories
                .into_iter()
                .map(|sc| sc.code)
                .collect();

            result.insert(category_code, subcategory_codes);
        }

        let result_arc = Arc::new(result);

        // 캐시에 저장
        self.cache
            .insert(CACHE_KEY.to_string(), result_arc.clone())
            .await;

        Ok(result_arc)
    }

    /// 캐시 무효화
    pub async fn invalidate(&self) {
        self.cache.invalidate(&CACHE_KEY.to_string()).await;
    }

    /// Gemini 프롬프트용 카테고리 규칙 문자열 생성
    pub async fn build_category_rules(&self, db: &DatabaseConnection) -> AppResult<String> {
        let categories = self.get_categories(db).await?;
        Ok(build_category_rules(&categories))
    }
}

impl Default for CategoryCache {
    fn default() -> Self {
        Self::new()
    }
}

/// Gemini 프롬프트용 카테고리 규칙 문자열 생성
pub fn build_category_rules(categories: &HashMap<String, Vec<String>>) -> String {
    let mut rules = Vec::new();

    // 각 카테고리별 규칙 생성
    for (category_code, subcategories) in categories {
        let category_display = match category_code.as_str() {
            "wearables" => "패션 아이템(Wearables)",
            "electronics" => "전자기기(Electronics)",
            "vehicles" => "탈것(Vehicles)",
            "living" => "리빙(Living)",
            "beauty" => "뷰티(Beauty)",
            _ => category_code,
        };

        // 서브카테고리를 대문자로 변환 (예: headwear -> Headwear)
        let formatted_subs: Vec<String> = subcategories
            .iter()
            .map(|s| {
                let mut chars = s.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect();

        rules.push(format!(
            "{}: 오직 [{}] 범주만 사용할 것.",
            category_display,
            formatted_subs.join(", ")
        ));
    }

    rules.join("\n")
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_build_category_rules() {
        let mut categories = HashMap::new();
        categories.insert(
            "wearables".to_string(),
            vec!["headwear".to_string(), "tops".to_string()],
        );
        categories.insert(
            "electronics".to_string(),
            vec!["smartphone".to_string(), "earphones".to_string()],
        );

        let rules = build_category_rules(&categories);

        assert!(rules.contains("패션 아이템(Wearables)"));
        assert!(rules.contains("Headwear, Tops"));
        assert!(rules.contains("전자기기(Electronics)"));
        assert!(rules.contains("Smartphone, Earphones"));
    }

    #[test]
    fn build_category_rules_covers_display_branches_and_fallback() {
        let mut categories = HashMap::new();
        categories.insert("vehicles".to_string(), vec!["car".to_string()]);
        categories.insert("living".to_string(), vec!["sofa".to_string()]);
        categories.insert("beauty".to_string(), vec!["skincare".to_string()]);
        categories.insert("custom_unknown".to_string(), vec!["sub_a".to_string()]);
        categories.insert(
            "wearables".to_string(),
            vec!["".to_string(), "hat".to_string()],
        );

        let rules = build_category_rules(&categories);
        assert!(rules.contains("탈것(Vehicles)"));
        assert!(rules.contains("리빙(Living)"));
        assert!(rules.contains("뷰티(Beauty)"));
        assert!(rules.contains("custom_unknown"));
        assert!(rules.contains("Hat"));
    }

    #[tokio::test]
    async fn test_category_cache_default() {
        let cache = CategoryCache::default();
        assert_eq!(cache.cache.entry_count(), 0);
    }
}
