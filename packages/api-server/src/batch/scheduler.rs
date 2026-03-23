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

    info!("Batch scheduler started successfully (including retry job)");

    // 스케줄러 시작
    sched.start().await?;

    Ok(())
}
