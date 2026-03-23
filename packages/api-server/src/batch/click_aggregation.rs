//! 클릭 집계 배치 작업
//!
//! 매일 02:00에 실행되어 `click_logs` 테이블에서 클릭 데이터를 집계하고
//! Solution별 클릭 카운트(`solutions.click_count`)를 업데이트합니다.
//!
//! 단위 테스트: DB 조회·갱신만 있으며 순수 로직 없음 — 별도 통합 테스트 없이 스킵.

use crate::{config::AppState, entities};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};
use std::sync::Arc;
use tracing::{error, info};

/// 클릭 집계 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting click aggregation batch job");

    let db = &state.db;

    // 모든 Solution 조회
    let solutions = entities::Solutions::find()
        .filter(entities::solutions::Column::Status.eq("active"))
        .all(db)
        .await?;

    let total_solutions = solutions.len();
    let mut updated = 0;

    for solution in solutions {
        // 해당 Solution의 클릭 수 집계
        let click_count = entities::ClickLogs::find()
            .filter(entities::click_logs::Column::SolutionId.eq(solution.id))
            .count(db)
            .await? as i32;

        // click_count가 변경된 경우에만 업데이트
        if click_count != solution.click_count {
            let solution_id = solution.id;
            let mut solution_active: entities::solutions::ActiveModel = solution.into();
            solution_active.click_count = Set(click_count);

            match solution_active.update(db).await {
                Ok(_) => {
                    updated += 1;
                    if updated % 100 == 0 {
                        info!(
                            updated = updated,
                            total = total_solutions,
                            "Updating click counts..."
                        );
                    }
                }
                Err(e) => {
                    error!(
                        solution_id = %solution_id,
                        error = %e,
                        "Failed to update click count"
                    );
                }
            }
        }
    }

    info!(
        total_solutions = total_solutions,
        updated = updated,
        "Click aggregation batch job completed"
    );

    Ok(())
}
