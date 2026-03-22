//! 트렌딩 계산 배치 작업
//!
//! 매시간 (매 정시) 실행되어 최근 24시간 이내 게시물의 트렌딩 점수를 재계산합니다.
//! 점수 공식: (조회수 × 1) + (Solution 수 × 5) + (투표 수 × 3) + 시간 가중치(0~24시간 전 → 100~0점 선형 감소)
//!
//! 계산된 점수는 `posts.trending_score` 컬럼에 저장됩니다.

use crate::{config::AppState, entities};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

/// 트렌딩 계산 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting trending calculation batch job");

    let db = &state.db;
    let twenty_four_hours_ago = chrono::Utc::now() - chrono::Duration::hours(24);

    // 최근 24시간 내 게시된 Post 조회
    let posts = entities::Posts::find()
        .filter(entities::posts::Column::Status.eq("published"))
        .filter(entities::posts::Column::CreatedAt.gte(twenty_four_hours_ago))
        .all(db)
        .await?;

    let total_posts = posts.len();
    let mut processed = 0;

    for post in posts {
        // 해당 Post의 Spot IDs 조회
        let spot_ids: Vec<Uuid> = entities::Spots::find()
            .filter(entities::spots::Column::PostId.eq(post.id))
            .all(db)
            .await?
            .into_iter()
            .map(|s| s.id)
            .collect();

        // 최근 24시간 Solution 수 집계
        let solution_count = if spot_ids.is_empty() {
            0
        } else {
            entities::Solutions::find()
                .filter(entities::solutions::Column::SpotId.is_in(spot_ids.clone()))
                .filter(entities::solutions::Column::CreatedAt.gte(twenty_four_hours_ago))
                .count(db)
                .await? as i32
        };

        // Solution IDs 조회 (투표 수 집계용)
        let solution_ids: Vec<Uuid> = if spot_ids.is_empty() {
            vec![]
        } else {
            entities::Solutions::find()
                .filter(entities::solutions::Column::SpotId.is_in(spot_ids))
                .all(db)
                .await?
                .into_iter()
                .map(|s| s.id)
                .collect()
        };

        // 최근 24시간 Vote 수 집계
        let vote_count = if solution_ids.is_empty() {
            0
        } else {
            entities::Votes::find()
                .filter(entities::votes::Column::SolutionId.is_in(solution_ids))
                .filter(entities::votes::Column::CreatedAt.gte(twenty_four_hours_ago))
                .count(db)
                .await? as i32
        };

        // 트렌딩 점수 계산
        let score = calculate_trending_score(
            post.view_count,
            solution_count,
            vote_count,
            post.created_at.with_timezone(&chrono::Utc),
        );

        // 계산된 점수를 DB에 저장
        let post_id = post.id;
        let mut post_active: entities::posts::ActiveModel = post.into();
        post_active.trending_score = Set(Some(score));
        if let Err(e) = post_active.update(db).await {
            error!(
                post_id = ?post_id,
                score = score,
                error = %e,
                "Failed to update trending score"
            );
            // 에러가 발생해도 다음 Post 처리를 계속 진행
        }

        processed += 1;

        if processed % 100 == 0 {
            info!(
                processed = processed,
                total = total_posts,
                "Processing trending scores..."
            );
        }
    }

    info!(
        total_posts = total_posts,
        processed = processed,
        "Trending calculation batch job completed"
    );

    Ok(())
}

/// 트렌딩 점수 계산
///
/// 점수 = (조회수 × 1) + (Solution 수 × 5) + (투표 수 × 3) + 시간 가중치
/// 시간 가중치: 0~24시간 전 → 100~0점 (선형 감소)
fn calculate_trending_score(
    view_count: i32,
    solution_count: i32,
    vote_count: i32,
    created_at: chrono::DateTime<chrono::Utc>,
) -> f64 {
    let base_score = base_trending_score(view_count, solution_count, vote_count);

    // 시간 가중치: 최신일수록 높은 점수
    let hours_ago = (chrono::Utc::now() - created_at).num_hours() as f64;
    let time_weight = trending_time_weight_for_hours_ago(hours_ago);

    base_score + time_weight
}

/// (조회수 × 1) + (Solution 수 × 5) + (투표 수 × 3)
fn base_trending_score(view_count: i32, solution_count: i32, vote_count: i32) -> f64 {
    (view_count as f64) + (solution_count as f64 * 5.0) + (vote_count as f64 * 3.0)
}

/// `hours_ago`: 게시 시각 기준 경과 시간(시). 24시간 이상이면 가중치 0.
fn trending_time_weight_for_hours_ago(hours_ago: f64) -> f64 {
    ((24.0 - hours_ago) / 24.0 * 100.0).max(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base_trending_score_formula() {
        assert_eq!(base_trending_score(10, 2, 1), 23.0);
        assert_eq!(base_trending_score(0, 0, 0), 0.0);
    }

    #[test]
    fn trending_time_weight_linear_decay() {
        assert_eq!(trending_time_weight_for_hours_ago(0.0), 100.0);
        assert_eq!(trending_time_weight_for_hours_ago(12.0), 50.0);
        assert_eq!(trending_time_weight_for_hours_ago(24.0), 0.0);
    }

    #[test]
    fn trending_time_weight_clamps_below_zero() {
        assert_eq!(trending_time_weight_for_hours_ago(30.0), 0.0);
    }
}
