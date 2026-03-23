//! 등급 갱신 배치 작업
//!
//! 매주 월요일 00:00 (KST)에 실행되어 사용자 등급을 자동으로 업그레이드합니다.
//! - Member (0점) → Contributor (200점 이상)
//! - Contributor (200점) → Expert (1000점 이상)

use crate::{config::AppState, entities};
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use std::sync::Arc;
use tracing::{error, info};

/// 등급 갱신 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting rank update batch job");

    let db = &state.db;

    // 모든 사용자 조회
    let users = entities::Users::find().all(db).await?;
    let total_users = users.len();

    let mut updated_count = 0;
    let mut member_to_contributor = 0;
    let mut contributor_to_expert = 0;

    for user in users {
        let old_rank = user.rank.clone();
        let new_rank = calculate_rank(user.total_points);

        // 등급이 변경된 경우에만 업데이트
        if old_rank != new_rank {
            let user_id = user.id;
            let total_points = user.total_points;
            let mut user_model: entities::users::ActiveModel = user.into();
            user_model.rank = Set(new_rank.clone());

            match user_model.update(db).await {
                Ok(_) => {
                    updated_count += 1;
                    if old_rank == "Member" && new_rank == "Contributor" {
                        member_to_contributor += 1;
                    } else if old_rank == "Contributor" && new_rank == "Expert" {
                        contributor_to_expert += 1;
                    }

                    info!(
                        user_id = %user_id,
                        old_rank = %old_rank,
                        new_rank = %new_rank,
                        total_points = total_points,
                        "User rank updated"
                    );
                }
                Err(e) => {
                    error!(
                        user_id = %user_id,
                        error = %e,
                        "Failed to update user rank"
                    );
                }
            }
        }
    }

    info!(
        total_users = total_users,
        updated_count = updated_count,
        member_to_contributor = member_to_contributor,
        contributor_to_expert = contributor_to_expert,
        "Rank update batch job completed"
    );

    Ok(())
}

/// 포인트에 따른 등급 계산
fn calculate_rank(total_points: i32) -> String {
    if total_points >= 1000 {
        "Expert".to_string()
    } else if total_points >= 200 {
        "Contributor".to_string()
    } else {
        "Member".to_string()
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_rank() {
        assert_eq!(calculate_rank(0), "Member");
        assert_eq!(calculate_rank(100), "Member");
        assert_eq!(calculate_rank(199), "Member");
        assert_eq!(calculate_rank(200), "Contributor");
        assert_eq!(calculate_rank(500), "Contributor");
        assert_eq!(calculate_rank(999), "Contributor");
        assert_eq!(calculate_rank(1000), "Expert");
        assert_eq!(calculate_rank(2000), "Expert");
        assert_eq!(calculate_rank(-1), "Member");
    }
}
