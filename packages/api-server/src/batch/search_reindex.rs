//! 검색 인덱스 재구축 배치 작업
//!
//! 모든 active 포스트를 Meilisearch에 재색인합니다.
//! 새 필드(category_codes, has_adopted_solution, solution_count) 추가 후
//! 기존 문서를 업데이트하기 위한 백필 용도입니다.

use crate::{
    config::AppState,
    domains::posts::{
        compute_search_fields, index_post_to_meilisearch, load_post_related_data, PostResponse,
        PostSearchFields,
    },
    entities,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use std::sync::Arc;
use tracing::{error, info, warn};

/// 검색 인덱스 재구축 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting search reindex batch job");

    let db = state.db.as_ref();

    // active 포스트 전체 조회
    let posts = entities::Posts::find()
        .filter(entities::posts::Column::Status.eq(crate::constants::post_status::ACTIVE))
        .all(db)
        .await?;

    let total = posts.len();
    let mut indexed = 0;
    let mut failed = 0;

    for post in posts {
        let post_id = post.id;
        let image_url = post.image_url.clone();
        let post_response: PostResponse = post.into();

        let search_fields = match load_post_related_data(db, post_id).await {
            Ok(data) => compute_search_fields(&data),
            Err(e) => {
                warn!(post_id = ?post_id, error = %e, "Failed to load related data, using defaults");
                PostSearchFields {
                    category_codes: vec![],
                    has_adopted_solution: false,
                    solution_count: 0,
                    spot_count: 0,
                }
            }
        };

        if let Err(e) = index_post_to_meilisearch(
            &state.search_client,
            &post_response,
            &image_url,
            &search_fields,
        )
        .await
        {
            error!(post_id = ?post_id, error = %e, "Failed to reindex post");
            failed += 1;
        } else {
            indexed += 1;
        }

        if (indexed + failed) % 100 == 0 {
            info!(
                progress = indexed + failed,
                total = total,
                indexed = indexed,
                failed = failed,
                "Reindexing progress..."
            );
        }
    }

    info!(
        total = total,
        indexed = indexed,
        failed = failed,
        "Search reindex batch job completed"
    );

    Ok(())
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::tests::helpers;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use std::sync::Arc;

    #[tokio::test]
    async fn run_with_empty_posts_succeeds() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn run_returns_err_on_db_failure() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_err());
    }
}
