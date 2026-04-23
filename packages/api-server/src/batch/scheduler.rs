//! 크론 등록·시작만 담당합니다. 단위 테스트할 순수 로직 없음.

use crate::{batch, AppState};
use std::sync::Arc;
use tokio_cron_scheduler::{Job, JobScheduler};
use tracing::{error, info};

/// 배치 스케줄러 시작
///
/// AppState를 받아서 모든 배치 작업을 등록하고 스케줄러를 시작합니다.
/// 각 배치 작업은 cron 표현식으로 스케줄링됩니다.
pub async fn start_scheduler(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error>> {
    let sched = JobScheduler::new().await?;

    // Phase 17.2 - 등급 갱신 배치 등록
    // 매주 월요일 00:00 (KST) - cron: "0 0 0 * * 1" (초 분 시 일 월 요일)
    let rank_state = state.clone();
    sched
        .add(Job::new_async("0 0 0 * * 1", move |_uuid, _l| {
            let state = rank_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_rank_update(state).await {
                    error!("Rank update batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // Phase 17.3 - 뱃지 체크 배치 등록
    // 매일 03:00 - cron: "0 0 3 * * *" (초 분 시 일 월 요일)
    let badge_state = state.clone();
    sched
        .add(Job::new_async("0 0 3 * * *", move |_uuid, _l| {
            let state = badge_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_badge_check(state).await {
                    error!("Badge check batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // Phase 17.4 - 트렌딩 계산 배치 등록
    // 매시간 (매 정시) - cron: "0 0 * * * *" (초 분 시 일 월 요일)
    let trending_state = state.clone();
    sched
        .add(Job::new_async("0 0 * * * *", move |_uuid, _l| {
            let state = trending_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_trending_calc(state).await {
                    error!("Trending calculation batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // Phase 17.5 - 클릭 집계 배치 등록
    // 매일 02:00 - cron: "0 0 2 * * *" (초 분 시 일 월 요일)
    let click_state = state.clone();
    sched
        .add(Job::new_async("0 0 2 * * *", move |_uuid, _l| {
            let state = click_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_click_aggregation(state).await {
                    error!("Click aggregation batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // 실패 항목 재시도 배치 등록
    // 5분마다 - cron: "0 */5 * * * *" (초 분 시 일 월 요일)
    let retry_state = state.clone();
    sched
        .add(Job::new_async("0 */5 * * * *", move |_uuid, _l| {
            let state = retry_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_retry_failed_items(state).await {
                    error!("Retry failed items batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // #214 raw_posts dispatcher — scheduler now lives in ai-server (was #258).

    // 검색 인덱스 재색인 — 매일 04:00
    let reindex_state = state.clone();
    sched
        .add(Job::new_async("0 0 4 * * *", move |_uuid, _l| {
            let state = reindex_state.clone();
            Box::pin(async move {
                if let Err(e) = batch::run_search_reindex(state).await {
                    error!("Search reindex batch job failed: {}", e);
                }
            })
        })?)
        .await?;

    // 검색 인덱스 재색인 — 서버 시작 직후 1회 실행 (10초 후)
    let reindex_once_state = state.clone();
    sched
        .add(Job::new_one_shot_async(
            std::time::Duration::from_secs(10),
            move |_uuid, _l| {
                let state = reindex_once_state.clone();
                Box::pin(async move {
                    if let Err(e) = batch::run_search_reindex(state).await {
                        error!("Initial search reindex failed: {}", e);
                    }
                })
            },
        )?)
        .await?;

    info!("Batch scheduler started successfully (including retry job)");

    // 스케줄러 시작
    sched.start().await?;

    Ok(())
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use tokio_cron_scheduler::Job;

    /// Verify the cron expressions used in `start_scheduler` are valid.
    /// This isolates the parsing logic without actually starting the scheduler
    /// (which spawns async tasks that aren't safe to run in unit tests).
    #[test]
    fn cron_expressions_are_valid() {
        let expressions = [
            "0 0 0 * * 1",   // rank update (weekly)
            "0 0 3 * * *",   // badge check (daily 03:00)
            "0 0 * * * *",   // trending (hourly)
            "0 0 2 * * *",   // click aggregation (daily 02:00)
            "0 */5 * * * *", // retry (every 5 min)
            "0 0 4 * * *",   // search reindex (daily 04:00)
        ];
        for expr in expressions {
            let job = Job::new_async(expr, move |_uuid, _l| Box::pin(async move {}));
            assert!(job.is_ok(), "cron expr `{}` failed to parse", expr);
        }
    }

    #[test]
    fn one_shot_job_construction_succeeds() {
        let job = Job::new_one_shot_async(std::time::Duration::from_secs(10), move |_uuid, _l| {
            Box::pin(async move {})
        });
        assert!(job.is_ok());
    }

    #[test]
    fn invalid_cron_expression_fails() {
        let result = Job::new_async("not a cron", move |_uuid, _l| Box::pin(async move {}));
        assert!(result.is_err());
    }
}
