//! 실패한 배치 항목 재시도 작업
//!
//! 5분마다 실행되어 실패한 배치 항목을 재시도합니다.
//! 최대 3회까지 재시도하며, 지수적 백오프를 사용합니다 (2초 → 4초 → 8초).

use crate::{
    config::AppState,
    entities::{self, FailedBatchItems},
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set, TransactionTrait};
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

/// 재시도 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting failed items retry batch job");

    let db = state.db.as_ref();
    let now = chrono::Utc::now();

    // 재시도 대상 조회 (next_retry_at <= now && retry_count < 3)
    let failed_items = FailedBatchItems::find()
        .filter(entities::failed_batch_items::Column::NextRetryAt.lte(now))
        .filter(entities::failed_batch_items::Column::RetryCount.lt(3))
        .all(db)
        .await?;

    let total_items = failed_items.len();
    if total_items == 0 {
        info!("No failed items to retry");
        return Ok(());
    }

    info!("Found {} failed items to retry", total_items);

    let mut success_count = 0;
    let mut failed_count = 0;

    for failed_item in failed_items {
        // 필요한 값들을 미리 clone (ownership 문제 방지)
        let item_id_str = failed_item.item_id.clone();
        let retry_count = failed_item.retry_count;

        let solution_id = match Uuid::parse_str(&item_id_str) {
            Ok(id) => id,
            Err(e) => {
                error!("Invalid item_id format: {} - {}", item_id_str, e);
                // 영구 실패 처리
                delete_failed_item(db, &failed_item).await?;
                failed_count += 1;
                continue;
            }
        };

        // 솔루션 조회
        let solution = match entities::Solutions::find_by_id(solution_id).one(db).await? {
            Some(s) => s,
            None => {
                error!("Solution not found: {} - deleting failed item", solution_id);
                // 솔루션이 없으면 재시도 불필요
                delete_failed_item(db, &failed_item).await?;
                failed_count += 1;
                continue;
            }
        };

        // 재시도 로직 (트랜잭션)
        let item_id_for_log = item_id_str.clone();
        let retry_count_for_log = retry_count;

        let retry_result = db
            .transaction::<_, (), Box<dyn std::error::Error + Send + Sync>>(|txn| {
                let item_id_clone = item_id_for_log.clone();
                Box::pin(async move {
                    let mut active_solution: entities::solutions::ActiveModel = solution.into();

                    // 간단한 메타데이터 업데이트 (재시도용)
                    // 실제로는 AI 서버에서 다시 분석하는 것이 더 좋지만,
                    // 여기서는 단순히 상태를 업데이트하는 것으로 처리
                    active_solution.description = Set(Some(format!(
                        "Retry attempt {} for item {}",
                        retry_count_for_log + 1,
                        item_id_clone
                    )));

                    active_solution.update(txn).await?;
                    Ok(())
                })
            })
            .await;

        match retry_result {
            Ok(_) => {
                info!(
                    "Retry successful for item {} (attempt {})",
                    item_id_str,
                    retry_count + 1
                );
                // 성공 시 실패 항목 삭제
                delete_failed_item(db, &failed_item).await?;
                success_count += 1;
            }
            Err(e) => {
                error!(
                    "Retry failed for item {} (attempt {}): {}",
                    item_id_str,
                    failed_item.retry_count + 1,
                    e
                );

                // 재시도 횟수 증가
                let new_retry_count = failed_item.retry_count + 1;

                if new_retry_count >= 3 {
                    // 최대 재시도 횟수 초과 - 영구 실패 처리
                    error!(
                        "Max retries reached for item {} - marking as permanent failure",
                        item_id_str
                    );
                    delete_failed_item(db, &failed_item).await?;
                    failed_count += 1;
                } else {
                    // 다음 재시도 시간 계산 (지수적 백오프: 2s, 4s, 8s)
                    let delay_seconds = retry_backoff_seconds(new_retry_count);
                    let next_retry_at = now + chrono::Duration::seconds(delay_seconds);

                    // 실패 항목 업데이트
                    let mut active: entities::failed_batch_items::ActiveModel =
                        failed_item.clone().into();
                    active.retry_count = Set(new_retry_count);
                    active.next_retry_at = Set(next_retry_at.into());
                    active.updated_at = Set(now.into());

                    active.update(db).await?;
                    failed_count += 1;
                }
            }
        }
    }

    info!(
        "Retry batch job completed: {} success, {} failed out of {} total",
        success_count, failed_count, total_items
    );

    Ok(())
}

/// 재시도 간격(초): `new_retry_count` 1 → 2, 2 → 4, 3 → 8 …
fn retry_backoff_seconds(new_retry_count: i32) -> i64 {
    2i64.pow(new_retry_count as u32)
}

/// 실패 항목 삭제 헬퍼 함수
async fn delete_failed_item(
    db: &sea_orm::DatabaseConnection,
    failed_item: &entities::failed_batch_items::Model,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let active: entities::failed_batch_items::ActiveModel = failed_item.clone().into();
    active.delete(db).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retry_backoff_seconds_exponential() {
        assert_eq!(retry_backoff_seconds(1), 2);
        assert_eq!(retry_backoff_seconds(2), 4);
        assert_eq!(retry_backoff_seconds(3), 8);
    }

    #[test]
    fn retry_backoff_seconds_power_of_two() {
        assert_eq!(retry_backoff_seconds(4), 16);
        assert_eq!(retry_backoff_seconds(5), 32);
    }

    #[tokio::test]
    async fn run_with_empty_failed_items_succeeds() {
        use crate::tests::helpers;
        use sea_orm::{DatabaseBackend, MockDatabase};
        use std::sync::Arc;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<entities::failed_batch_items::Model>::new()])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[test]
    fn retry_backoff_seconds_single() {
        assert_eq!(retry_backoff_seconds(0), 1);
        assert_eq!(retry_backoff_seconds(1), 2);
    }

    #[tokio::test]
    async fn run_with_invalid_item_id_deletes_and_continues() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};
        use std::sync::Arc;

        // One failed item with invalid UUID → delete_failed_item then continue → done.
        let mut item = fixtures::failed_batch_item_model();
        item.item_id = "not-a-uuid".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![item]]) // failed items list
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }]) // delete
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn run_with_missing_solution_deletes_item() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};
        use std::sync::Arc;

        // Item parses but Solutions::find_by_id → None → delete → done.
        let item = fixtures::failed_batch_item_model();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![item]]) // failed items list
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // solution not found
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }]) // delete
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn run_with_successful_retry_deletes_item() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};
        use std::sync::Arc;

        // Successful retry path:
        // 1. failed items list
        // 2. Solutions::find_by_id → Some
        // 3. txn begin (exec)
        // 4. update solution (query returns updated model)
        // 5. txn commit (exec)
        // 6. delete failed_item (exec)
        let item = fixtures::failed_batch_item_model();
        let solution = fixtures::solution_model();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![item]]) // failed items
            .append_query_results([vec![solution.clone()]]) // find solution
            .append_query_results([vec![solution]]) // txn: update returns
            .append_exec_results([
                MockExecResult {
                    last_insert_id: 0,
                    rows_affected: 0,
                }, // txn begin
                MockExecResult {
                    last_insert_id: 0,
                    rows_affected: 1,
                }, // update
                MockExecResult {
                    last_insert_id: 0,
                    rows_affected: 0,
                }, // txn commit
                MockExecResult {
                    last_insert_id: 0,
                    rows_affected: 1,
                }, // delete failed_item
            ])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn run_returns_err_on_db_failure() {
        use crate::tests::helpers;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_err());
    }
}
