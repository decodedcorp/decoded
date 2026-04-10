//! Badges 도메인 테스트
//!
//! 뱃지 시스템 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::badges::dto::{BadgeCriteria, BadgeProgress, BadgeRarity, BadgeType};
    use serde_json::json;

    /// BadgeType 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_type_serialization() {
        let badge_type = BadgeType::Specialist;
        let serialized = serde_json::to_string(&badge_type).unwrap();
        assert_eq!(serialized, "\"specialist\"");

        let deserialized: BadgeType = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, BadgeType::Specialist);
    }

    /// BadgeRarity 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_rarity_serialization() {
        let rarity = BadgeRarity::Epic;
        let serialized = serde_json::to_string(&rarity).unwrap();
        assert_eq!(serialized, "\"epic\"");

        let deserialized: BadgeRarity = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, BadgeRarity::Epic);
    }

    /// BadgeCriteria 직렬화/역직렬화 테스트
    #[test]
    fn test_badge_criteria_serialization() {
        let criteria = BadgeCriteria {
            criteria_type: "count".to_string(),
            target: None,
            threshold: 30,
        };

        let serialized = serde_json::to_string(&criteria).unwrap();
        let deserialized: BadgeCriteria = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.criteria_type, "count");
        assert_eq!(deserialized.threshold, 30);
    }

    /// BadgeCriteria with target 테스트
    #[test]
    fn test_badge_criteria_with_target() {
        let json = json!({
            "type": "artist",
            "target": "Jennie",
            "threshold": 30
        });

        let deserialized: BadgeCriteria = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.criteria_type, "artist");
        assert_eq!(deserialized.target, Some("Jennie".to_string()));
        assert_eq!(deserialized.threshold, 30);
    }

    /// BadgeProgress 완료 여부 테스트
    #[test]
    fn test_badge_progress_completion() {
        let progress_completed = BadgeProgress {
            current: 35,
            threshold: 30,
            completed: true,
        };
        assert!(progress_completed.completed);

        let progress_incomplete = BadgeProgress {
            current: 25,
            threshold: 30,
            completed: false,
        };
        assert!(!progress_incomplete.completed);
    }

    /// BadgeType variants 테스트
    #[test]
    fn test_badge_type_variants() {
        assert_eq!(BadgeType::Specialist, BadgeType::Specialist);
        assert_eq!(BadgeType::Category, BadgeType::Category);
        assert_eq!(BadgeType::Achievement, BadgeType::Achievement);
        assert_eq!(BadgeType::Milestone, BadgeType::Milestone);
    }

    /// BadgeRarity variants 테스트
    #[test]
    fn test_badge_rarity_variants() {
        assert_eq!(BadgeRarity::Common, BadgeRarity::Common);
        assert_eq!(BadgeRarity::Rare, BadgeRarity::Rare);
        assert_eq!(BadgeRarity::Epic, BadgeRarity::Epic);
        assert_eq!(BadgeRarity::Legendary, BadgeRarity::Legendary);
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::badges::service::BadgesService;
    use crate::tests::{fixtures, helpers};
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn list_badges_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::badges::Model>::new()])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn list_badges_returns_badges() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::badge_model()]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(result.is_ok());
        let badges = result.unwrap();
        assert_eq!(badges.len(), 1);
        assert_eq!(badges[0].name, "First Post");
    }

    #[tokio::test]
    async fn get_badge_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::badge_model()]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_badge_by_id(&state, fixtures::test_uuid(40)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().name, "First Post");
    }

    #[tokio::test]
    async fn get_badge_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::badges::Model>::new()])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_badge_by_id(&state, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn list_badges_multiple() {
        let mut badge2 = fixtures::badge_model();
        badge2.id = fixtures::test_uuid(41);
        badge2.name = "Second Badge".to_string();
        badge2.rarity = "rare".to_string();
        badge2.r#type = "specialist".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::badge_model(), badge2]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 2);
    }

    #[tokio::test]
    async fn get_my_badges_empty_user() {
        // 1st query: earned user_badges (find_also_related) → empty
        // 2nd query: all badges → empty
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let empty_badges: Vec<crate::entities::badges::Model> = vec![];
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([empty_badges])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_my_badges(&state, fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
        assert!(resp.available_badges.is_empty());
    }

    #[tokio::test]
    async fn get_my_badges_with_earned_only() {
        // earned user_badges with related badge → one entry.
        // all_badges returns the same badge → no available badges (set intersection).
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![(
                crate::entities::user_badges::Model {
                    user_id: fixtures::test_uuid(10),
                    badge_id: fixtures::badge_model().id,
                    earned_at: fixtures::test_timestamp(),
                },
                Some(fixtures::badge_model()),
            )]])
            .append_query_results([vec![fixtures::badge_model()]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_my_badges(&state, fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 1);
        assert!(resp.available_badges.is_empty());
        assert_eq!(resp.data[0].badge.name, "First Post");
        assert!(resp.data[0].progress.completed);
    }

    #[tokio::test]
    async fn list_badges_returns_err_on_invalid_type() {
        let mut bad = fixtures::badge_model();
        bad.r#type = "explorer".to_string(); // not in parse_badge_type
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[bad]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(matches!(
            result,
            Err(crate::error::AppError::InternalError(_))
        ));
    }

    #[tokio::test]
    async fn list_badges_returns_err_on_invalid_rarity() {
        let mut bad = fixtures::badge_model();
        bad.rarity = "godlike".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[bad]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(matches!(
            result,
            Err(crate::error::AppError::InternalError(_))
        ));
    }

    #[tokio::test]
    async fn get_badge_by_id_returns_err_on_unparseable_criteria() {
        let mut bad = fixtures::badge_model();
        bad.criteria = serde_json::json!({"oops": true});
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[bad]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_badge_by_id(&state, fixtures::test_uuid(40)).await;
        assert!(matches!(
            result,
            Err(crate::error::AppError::InternalError(_))
        ));
    }

    #[tokio::test]
    async fn get_my_badges_with_available_count_criteria() {
        // 1) earned (find_also_related): empty
        // 2) all_badges: one count badge
        // 3) check_badge_progress -> count() solutions
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let badge = fixtures::badge_model();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge.clone()]])
            .append_query_results([[fixtures::count_row(2)]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert!(resp.data.is_empty());
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 2);
        assert_eq!(resp.available_badges[0].progress.threshold, 1);
        assert!(resp.available_badges[0].progress.completed);
    }

    #[tokio::test]
    async fn get_my_badges_with_verified_criteria() {
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria = serde_json::json!({"type": "verified", "target": null, "threshold": 5});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            .append_query_results([[fixtures::count_row(3)]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 3);
        assert!(!resp.available_badges[0].progress.completed);
    }

    #[tokio::test]
    async fn get_my_badges_with_adopted_criteria() {
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria = serde_json::json!({"type": "adopted", "target": null, "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            .append_query_results([[fixtures::count_row(1)]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert!(resp.available_badges[0].progress.completed);
    }

    #[tokio::test]
    async fn get_my_badges_with_artist_no_target_returns_zero() {
        // criteria: artist with target=None → current=0
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria = serde_json::json!({"type": "artist", "target": null, "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 0);
        assert!(!resp.available_badges[0].progress.completed);
    }

    #[tokio::test]
    async fn get_my_badges_with_unknown_criteria_returns_zero() {
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria =
            serde_json::json!({"type": "totally_unknown", "target": null, "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 0);
    }

    #[tokio::test]
    async fn get_my_badges_with_group_target_empty_solutions() {
        // criteria: group with target set; count_solutions_by_group fetches solutions → empty
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria = serde_json::json!({"type": "group", "target": "BTS", "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            // count_solutions_by_group: solutions list → empty
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 0);
    }

    #[tokio::test]
    async fn get_my_badges_with_artist_target_empty_solutions() {
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria = serde_json::json!({"type": "artist", "target": "Jennie", "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 0);
    }

    #[tokio::test]
    async fn get_my_badges_with_category_target_category_not_found() {
        // category lookup returns None → service should error
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria =
            serde_json::json!({"type": "category", "target": "fashion", "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            // count_solutions_by_category: category lookup → None → NotFound error
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::get_my_badges(&state, fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_my_badges_with_category_empty_subcategories() {
        let empty_earned: Vec<(
            crate::entities::user_badges::Model,
            Option<crate::entities::badges::Model>,
        )> = vec![];
        let mut badge = fixtures::badge_model();
        badge.criteria =
            serde_json::json!({"type": "category", "target": "fashion", "threshold": 1});

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([empty_earned])
            .append_query_results([vec![badge]])
            // count_solutions_by_category: category lookup → Some
            .append_query_results([vec![fixtures::category_model()]])
            // subcategories → empty → returns 0 early
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .into_connection();
        let state = helpers::test_app_state(db);
        let resp = BadgesService::get_my_badges(&state, fixtures::test_uuid(10))
            .await
            .expect("ok");
        assert_eq!(resp.available_badges.len(), 1);
        assert_eq!(resp.available_badges[0].progress.current, 0);
    }

    #[tokio::test]
    async fn list_badges_returns_err_on_unparseable_criteria() {
        let mut bad = fixtures::badge_model();
        bad.criteria = serde_json::json!("not an object");
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[bad]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let result = BadgesService::list_badges(&state).await;
        assert!(matches!(
            result,
            Err(crate::error::AppError::InternalError(_))
        ));
    }

    #[tokio::test]
    async fn get_badge_by_id_parses_type_and_rarity() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::badge_model()]])
            .into_connection();
        let state = helpers::test_app_state(db);
        let badge = BadgesService::get_badge_by_id(&state, fixtures::test_uuid(40))
            .await
            .unwrap();
        assert_eq!(
            badge.badge_type,
            crate::domains::badges::dto::BadgeType::Achievement
        );
        assert_eq!(
            badge.rarity,
            crate::domains::badges::dto::BadgeRarity::Common
        );
    }
}
