//! 뱃지 체크 배치 작업
//!
//! 매일 03:00에 실행되어 사용자 활동을 확인하고 뱃지 획득 조건을 체크합니다.
//! 조건 충족 시 user_badges 테이블에 자동 부여합니다.

use crate::{
    config::AppState,
    domains::badges::dto::{BadgeCriteria, BadgeProgress},
    entities,
    error::AppError,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};
use serde_json::Value;
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

/// 뱃지 체크 배치 실행
pub async fn run(state: Arc<AppState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting badge check batch job");

    let db = state.db.as_ref();

    // 모든 사용자 조회
    let users = entities::Users::find().all(db).await?;
    let total_users = users.len();

    // 모든 뱃지 조회
    let badges = entities::Badges::find().all(db).await?;
    let total_badges = badges.len();

    let mut total_awarded = 0;

    for user in users {
        // 이미 획득한 뱃지 ID 집합 조회
        let earned_badges = entities::UserBadges::find()
            .filter(entities::user_badges::Column::UserId.eq(user.id))
            .all(db)
            .await?;
        let earned_badge_ids: std::collections::HashSet<Uuid> =
            earned_badges.iter().map(|ub| ub.badge_id).collect();

        // 각 뱃지에 대해 조건 체크
        for badge in &badges {
            // 이미 획득한 뱃지는 스킵
            if earned_badge_ids.contains(&badge.id) {
                continue;
            }

            // criteria 파싱
            let criteria = match parse_criteria(&badge.criteria) {
                Ok(c) => c,
                Err(e) => {
                    error!(
                        badge_id = %badge.id,
                        error = %e,
                        "Failed to parse badge criteria"
                    );
                    continue;
                }
            };

            // 조건 체크
            match check_badge_progress(state.clone(), user.id, criteria.clone()).await {
                Ok(progress) => {
                    if progress.completed {
                        // 뱃지 부여
                        let user_badge = entities::user_badges::ActiveModel {
                            user_id: Set(user.id),
                            badge_id: Set(badge.id),
                            earned_at: Set(chrono::Utc::now().into()),
                        };

                        match user_badge.insert(db).await {
                            Ok(_) => {
                                total_awarded += 1;
                                info!(
                                    user_id = %user.id,
                                    badge_id = %badge.id,
                                    badge_name = %badge.name,
                                    "Badge awarded"
                                );
                            }
                            Err(e) => {
                                error!(
                                    user_id = %user.id,
                                    badge_id = %badge.id,
                                    error = %e,
                                    "Failed to award badge"
                                );
                            }
                        }
                    }
                }
                Err(e) => {
                    error!(
                        user_id = %user.id,
                        badge_id = %badge.id,
                        error = %e,
                        "Failed to check badge progress"
                    );
                }
            }
        }
    }

    info!(
        total_users = total_users,
        total_badges = total_badges,
        total_awarded = total_awarded,
        "Badge check batch job completed"
    );

    Ok(())
}

/// 뱃지 획득 조건 체크 및 진행도 계산
async fn check_badge_progress(
    state: Arc<AppState>,
    user_id: Uuid,
    criteria: BadgeCriteria,
) -> Result<BadgeProgress, Box<dyn std::error::Error + Send + Sync>> {
    let db = state.db.as_ref();
    let current = match criteria.criteria_type.as_str() {
        "count" => {
            // 총 Solution 수
            let count = entities::Solutions::find()
                .filter(entities::solutions::Column::UserId.eq(user_id))
                .filter(entities::solutions::Column::Status.eq("active"))
                .count(db)
                .await?;
            count as i32
        }
        "verified" => {
            // Verified Solution 수
            let count = entities::Solutions::find()
                .filter(entities::solutions::Column::UserId.eq(user_id))
                .filter(entities::solutions::Column::IsVerified.eq(true))
                .filter(entities::solutions::Column::Status.eq("active"))
                .count(db)
                .await?;
            count as i32
        }
        "adopted" => {
            // 채택된 Solution 수
            let count = entities::Solutions::find()
                .filter(entities::solutions::Column::UserId.eq(user_id))
                .filter(entities::solutions::Column::IsAdopted.eq(true))
                .filter(entities::solutions::Column::Status.eq("active"))
                .count(db)
                .await?;
            count as i32
        }
        "artist" => {
            // 특정 아티스트 관련 Solution 수
            if let Some(artist_name) = &criteria.target {
                let count = count_solutions_by_artist(state.clone(), user_id, artist_name).await?;
                count as i32
            } else {
                0
            }
        }
        "group" => {
            // 특정 그룹 관련 Solution 수
            if let Some(group_name) = &criteria.target {
                let count = count_solutions_by_group(state.clone(), user_id, group_name).await?;
                count as i32
            } else {
                0
            }
        }
        "category" => {
            // 특정 카테고리 Solution 수
            if let Some(category_code) = &criteria.target {
                let count =
                    count_solutions_by_category(state.clone(), user_id, category_code).await?;
                count as i32
            } else {
                0
            }
        }
        "explorer_post" => {
            // Post 조회 수
            let count = crate::domains::views::service::count_post_views(db, user_id).await?;
            count as i32
        }
        "explorer_spot" => {
            // Spot 조회 수
            let count = crate::domains::views::service::count_spot_views(db, user_id).await?;
            count as i32
        }
        "shopper_solution" => {
            // Solution 클릭 수
            let count = entities::ClickLogs::find()
                .filter(entities::click_logs::Column::UserId.eq(user_id))
                .count(db)
                .await?;
            count as i32
        }
        _ => 0,
    };

    Ok(BadgeProgress {
        current,
        threshold: criteria.threshold,
        completed: current >= criteria.threshold,
    })
}

/// 특정 아티스트 관련 Solution 수 계산
async fn count_solutions_by_artist(
    state: Arc<AppState>,
    user_id: Uuid,
    artist_name: &str,
) -> Result<u64, Box<dyn std::error::Error + Send + Sync>> {
    let db = state.db.as_ref();
    let solutions = entities::Solutions::find()
        .filter(entities::solutions::Column::UserId.eq(user_id))
        .filter(entities::solutions::Column::Status.eq("active"))
        .all(db)
        .await?;

    let mut count = 0;
    for solution in solutions {
        let spot = entities::Spots::find_by_id(solution.spot_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

        let post = entities::Posts::find_by_id(spot.post_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

        if post.artist_name.as_deref() == Some(artist_name) {
            count += 1;
        }
    }

    Ok(count)
}

/// 특정 그룹 관련 Solution 수 계산
async fn count_solutions_by_group(
    state: Arc<AppState>,
    user_id: Uuid,
    group_name: &str,
) -> Result<u64, Box<dyn std::error::Error + Send + Sync>> {
    let db = state.db.as_ref();
    let solutions = entities::Solutions::find()
        .filter(entities::solutions::Column::UserId.eq(user_id))
        .filter(entities::solutions::Column::Status.eq("active"))
        .all(db)
        .await?;

    let mut count = 0;
    for solution in solutions {
        let spot = entities::Spots::find_by_id(solution.spot_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

        let post = entities::Posts::find_by_id(spot.post_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("Post를 찾을 수 없습니다"))?;

        if post.group_name.as_deref() == Some(group_name) {
            count += 1;
        }
    }

    Ok(count)
}

/// 특정 카테고리 Solution 수 계산
async fn count_solutions_by_category(
    state: Arc<AppState>,
    user_id: Uuid,
    category_code: &str,
) -> Result<u64, Box<dyn std::error::Error + Send + Sync>> {
    let db = state.db.as_ref();
    let category = entities::Categories::find()
        .filter(entities::categories::Column::Code.eq(category_code))
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("카테고리를 찾을 수 없습니다"))?;

    let solutions = entities::Solutions::find()
        .filter(entities::solutions::Column::UserId.eq(user_id))
        .filter(entities::solutions::Column::Status.eq("active"))
        .all(db)
        .await?;

    let mut count = 0;
    for solution in solutions {
        let spot = entities::Spots::find_by_id(solution.spot_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::not_found("Spot을 찾을 수 없습니다"))?;

        // subcategory를 통해 category 확인 (subcategory_id가 있는 경우만)
        if let Some(subcategory_id) = spot.subcategory_id {
            let subcategory = entities::Subcategories::find_by_id(subcategory_id)
                .one(db)
                .await?
                .ok_or_else(|| AppError::not_found("Subcategory를 찾을 수 없습니다"))?;

            if subcategory.category_id == category.id {
                count += 1;
            }
        }
    }

    Ok(count)
}

/// BadgeCriteria 파싱
fn parse_criteria(
    criteria: &Value,
) -> Result<BadgeCriteria, Box<dyn std::error::Error + Send + Sync>> {
    let criteria_type = criteria
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or("Missing 'type' field")?
        .to_string();

    let target = criteria
        .get("target")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let threshold = criteria
        .get("threshold")
        .and_then(|v| v.as_i64())
        .ok_or("Missing or invalid 'threshold' field")? as i32;

    Ok(BadgeCriteria {
        criteria_type,
        target,
        threshold,
    })
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parse_criteria_minimal() {
        let v = json!({ "type": "count", "threshold": 5 });
        let c = parse_criteria(&v).unwrap();
        assert_eq!(c.criteria_type, "count");
        assert_eq!(c.target, None);
        assert_eq!(c.threshold, 5);
    }

    #[test]
    fn parse_criteria_with_target() {
        let v = json!({ "type": "artist", "target": "BTS", "threshold": 10 });
        let c = parse_criteria(&v).unwrap();
        assert_eq!(c.criteria_type, "artist");
        assert_eq!(c.target.as_deref(), Some("BTS"));
        assert_eq!(c.threshold, 10);
    }

    #[test]
    fn parse_criteria_rejects_missing_type() {
        let v = json!({ "threshold": 1 });
        assert!(parse_criteria(&v).is_err());
    }

    #[test]
    fn parse_criteria_rejects_missing_threshold() {
        let v = json!({ "type": "count" });
        assert!(parse_criteria(&v).is_err());
    }

    #[test]
    fn parse_criteria_zero_threshold() {
        let v = json!({ "type": "count", "threshold": 0 });
        let c = parse_criteria(&v).unwrap();
        assert_eq!(c.threshold, 0);
    }

    #[test]
    fn parse_criteria_rejects_string_threshold() {
        let v = json!({ "type": "count", "threshold": "five" });
        assert!(parse_criteria(&v).is_err());
    }

    #[test]
    fn parse_criteria_rejects_empty_object() {
        let v = json!({});
        assert!(parse_criteria(&v).is_err());
    }

    #[test]
    fn parse_criteria_ignores_extra_fields() {
        let v = json!({ "type": "verified", "threshold": 3, "extra": true });
        let c = parse_criteria(&v).unwrap();
        assert_eq!(c.criteria_type, "verified");
        assert_eq!(c.threshold, 3);
        assert_eq!(c.target, None);
    }

    #[test]
    fn parse_criteria_negative_threshold() {
        let v = json!({ "type": "count", "threshold": -1 });
        let c = parse_criteria(&v).unwrap();
        assert_eq!(c.threshold, -1);
    }

    #[test]
    fn badge_progress_completed_when_current_meets_threshold() {
        use crate::domains::badges::dto::BadgeProgress;
        let p = BadgeProgress {
            current: 5,
            threshold: 5,
            completed: 5 >= 5,
        };
        assert!(p.completed);
    }

    #[test]
    fn badge_progress_not_completed_below_threshold() {
        use crate::domains::badges::dto::BadgeProgress;
        let p = BadgeProgress {
            current: 4,
            threshold: 5,
            completed: 4 >= 5,
        };
        assert!(!p.completed);
    }

    #[test]
    fn parse_criteria_all_known_types() {
        for ty in [
            "count",
            "verified",
            "adopted",
            "artist",
            "group",
            "category",
            "explorer_post",
            "explorer_spot",
            "shopper_solution",
            "unknown_type",
        ] {
            let v = json!({ "type": ty, "threshold": 1 });
            let c = parse_criteria(&v).unwrap();
            assert_eq!(c.criteria_type, ty);
        }
    }

    #[tokio::test]
    async fn run_with_empty_users_and_badges_succeeds() {
        use crate::tests::helpers;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::badges::Model>::new()])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = super::run(state).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn check_badge_progress_count_completes_when_threshold_met() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(5)]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "count".to_string(),
            target: None,
            threshold: 5,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 5);
        assert!(progress.completed);
    }

    #[tokio::test]
    async fn check_badge_progress_verified_below_threshold() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(2)]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "verified".to_string(),
            target: None,
            threshold: 10,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 2);
        assert!(!progress.completed);
    }

    #[tokio::test]
    async fn check_badge_progress_adopted_zero() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(0)]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "adopted".to_string(),
            target: None,
            threshold: 1,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 0);
        assert!(!progress.completed);
    }

    #[tokio::test]
    async fn check_badge_progress_artist_no_target_zero() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "artist".to_string(),
            target: None,
            threshold: 1,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 0);
        assert!(!progress.completed);
    }

    #[tokio::test]
    async fn check_badge_progress_group_no_target_zero() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "group".to_string(),
            target: None,
            threshold: 1,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 0);
    }

    #[tokio::test]
    async fn check_badge_progress_category_no_target_zero() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "category".to_string(),
            target: None,
            threshold: 1,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 0);
    }

    #[tokio::test]
    async fn check_badge_progress_unknown_type_zero() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "this_does_not_exist".to_string(),
            target: None,
            threshold: 1,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 0);
    }

    #[tokio::test]
    async fn check_badge_progress_shopper_solution_counts_clicks() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(7)]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));

        let criteria = BadgeCriteria {
            criteria_type: "shopper_solution".to_string(),
            target: None,
            threshold: 5,
        };
        let progress = check_badge_progress(state, fixtures::test_uuid(10), criteria)
            .await
            .expect("ok");
        assert_eq!(progress.current, 7);
        assert!(progress.completed);
    }

    #[tokio::test]
    async fn count_solutions_by_artist_filters_correctly() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // 1) load solutions
        // 2) per solution: spot, post (loop)
        let mut post_match = fixtures::post_model();
        post_match.artist_name = Some("BTS".to_string());
        let mut post_other = fixtures::post_model();
        post_other.artist_name = Some("BLACKPINK".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::solution_model(), {
                let mut s2 = fixtures::solution_model();
                s2.id = fixtures::test_uuid(31);
                s2
            }]])
            // sol1: spot then post (BTS)
            .append_query_results([vec![fixtures::spot_model()]])
            .append_query_results([vec![post_match]])
            // sol2: spot then post (BLACKPINK)
            .append_query_results([vec![fixtures::spot_model()]])
            .append_query_results([vec![post_other]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let count = count_solutions_by_artist(state, fixtures::test_uuid(10), "BTS")
            .await
            .expect("ok");
        assert_eq!(count, 1);
    }

    #[tokio::test]
    async fn count_solutions_by_group_filters_correctly() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut post_match = fixtures::post_model();
        post_match.group_name = Some("BTS".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::solution_model()]])
            .append_query_results([vec![fixtures::spot_model()]])
            .append_query_results([vec![post_match]])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let count = count_solutions_by_group(state, fixtures::test_uuid(10), "BTS")
            .await
            .expect("ok");
        assert_eq!(count, 1);
    }

    #[tokio::test]
    async fn count_solutions_by_category_returns_zero_when_category_not_found() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::categories::Model>::new()])
            .into_connection();
        let state = Arc::new(helpers::test_app_state(db));
        let result = count_solutions_by_category(state, fixtures::test_uuid(10), "fashion").await;
        // Returns NotFound error wrapped in Box<dyn Error>
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn run_with_user_no_badges_succeeds() {
        use crate::tests::{fixtures, helpers};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // 1) Users::find().all → one user
        // 2) Badges::find().all → empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::user_model()]])
            .append_query_results([Vec::<crate::entities::badges::Model>::new()])
            // user-loop: earned user_badges for that one user
            .append_query_results([Vec::<crate::entities::user_badges::Model>::new()])
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
