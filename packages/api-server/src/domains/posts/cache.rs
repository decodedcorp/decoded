//! Post list cache service
//!
//! 피드 목록 응답을 단기 캐싱하여 반복 요청의 DB 부하를 제거한다.

use moka::future::Cache;
use std::sync::Arc;
use std::time::Duration;

use crate::domains::posts::dto::PostListItem;
use crate::utils::pagination::PaginatedResponse;

/// 캐시 TTL (30초 — 피드는 자주 변경되므로 짧게)
const CACHE_TTL_SECS: u64 = 30;

/// 최대 캐시 엔트리 수 (쿼리 조합별)
const CACHE_MAX_CAPACITY: u64 = 200;

/// Post 목록 캐시
pub struct PostListCache {
    cache: Cache<String, Arc<PaginatedResponse<PostListItem>>>,
}

impl PostListCache {
    pub fn new() -> Self {
        let cache = Cache::builder()
            .time_to_live(Duration::from_secs(CACHE_TTL_SECS))
            .max_capacity(CACHE_MAX_CAPACITY)
            .build();

        Self { cache }
    }

    /// 캐시 키 생성: query params를 정렬된 문자열로 직렬화
    fn cache_key(query: &super::dto::PostListQuery) -> String {
        // serde_json은 struct 필드 순서가 고정이므로 deterministic
        serde_json::to_string(query).unwrap_or_default()
    }

    /// 캐시에서 조회
    pub async fn get(
        &self,
        query: &super::dto::PostListQuery,
    ) -> Option<Arc<PaginatedResponse<PostListItem>>> {
        self.cache.get(&Self::cache_key(query)).await
    }

    /// 캐시에 저장
    pub async fn insert(
        &self,
        query: &super::dto::PostListQuery,
        response: PaginatedResponse<PostListItem>,
    ) {
        self.cache
            .insert(Self::cache_key(query), Arc::new(response))
            .await;
    }

    /// 캐시 전체 무효화 (post 생성/수정/삭제 시)
    pub async fn invalidate_all(&self) {
        self.cache.invalidate_all();
    }
}

impl Default for PostListCache {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_post_list_cache_default() {
        let cache = PostListCache::default();
        assert_eq!(cache.cache.entry_count(), 0);
    }
}
