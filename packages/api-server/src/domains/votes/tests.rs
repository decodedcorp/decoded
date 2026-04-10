//! Votes 도메인 MockDatabase 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::votes::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn get_vote_stats_solution_found_no_user() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();

        let result = service::get_vote_stats(&db, fixtures::test_uuid(3), None).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.solution_id, fixtures::test_uuid(3));
        assert_eq!(stats.accurate_count, 5);
        assert_eq!(stats.different_count, 1);
        assert_eq!(stats.total_count, 6);
        assert!(stats.user_vote.is_none());
    }

    #[tokio::test]
    async fn get_vote_stats_accuracy_rate_calculated() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();

        let stats = service::get_vote_stats(&db, fixtures::test_uuid(3), None)
            .await
            .unwrap();
        // 5 accurate / 6 total ≈ 0.8333
        assert!((stats.accuracy_rate - 5.0 / 6.0).abs() < 1e-10);
    }

    #[tokio::test]
    async fn get_vote_stats_zero_votes_accuracy_zero() {
        let mut sol = fixtures::solution_model();
        sol.accurate_count = 0;
        sol.different_count = 0;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[sol]])
            .into_connection();

        let stats = service::get_vote_stats(&db, fixtures::test_uuid(3), None)
            .await
            .unwrap();
        assert_eq!(stats.total_count, 0);
        assert_eq!(stats.accuracy_rate, 0.0);
    }

    #[tokio::test]
    async fn get_vote_stats_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result = service::get_vote_stats(&db, fixtures::test_uuid(99), None).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_vote_stats_with_user_vote_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // First query: find solution
            .append_query_results([[fixtures::solution_model()]])
            // Second query: find user's vote
            .append_query_results([[fixtures::vote_model()]])
            .into_connection();

        let result =
            service::get_vote_stats(&db, fixtures::test_uuid(3), Some(fixtures::test_uuid(10)))
                .await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert!(stats.user_vote.is_some());
    }

    #[tokio::test]
    async fn adopt_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(99),
            fixtures::test_uuid(10),
            "perfect".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn adopt_solution_spot_not_found() {
        // 1st query: solution found
        // 2nd query: spot not found
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();

        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            "perfect".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn adopt_solution_forbidden_when_not_owner() {
        // solution + spot found, but spot.user_id != spotter_id
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();

        // spot.user_id = test_uuid(10); use a different spotter
        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(77),
            "perfect".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn adopt_solution_conflict_with_other_adopted() {
        // solution + spot found, and a different adopted solution already exists
        let mut other_adopted = fixtures::solution_model();
        other_adopted.id = fixtures::test_uuid(44);
        other_adopted.is_adopted = true;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .append_query_results([[other_adopted]])
            .into_connection();

        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            "perfect".to_string(),
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn unadopt_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result =
            service::unadopt_solution(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn unadopt_solution_spot_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();

        let result =
            service::unadopt_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn unadopt_solution_forbidden_when_not_owner() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();

        let result =
            service::unadopt_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(77)).await;
        assert!(matches!(result, Err(crate::error::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn create_vote_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result = service::create_vote(
            &db,
            fixtures::test_uuid(99),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Accurate,
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_vote_already_voted() {
        // solution found, existing vote found → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::vote_model()]])
            .into_connection();

        let result = service::create_vote(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Accurate,
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn delete_vote_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::votes::Model>::new()])
            .into_connection();

        let result =
            service::delete_vote(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_vote_stats_with_user_no_vote() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // First query: find solution
            .append_query_results([[fixtures::solution_model()]])
            // Second query: no vote found
            .append_query_results([Vec::<crate::entities::votes::Model>::new()])
            .into_connection();

        let result =
            service::get_vote_stats(&db, fixtures::test_uuid(3), Some(fixtures::test_uuid(10)))
                .await;
        assert!(result.is_ok());
        assert!(result.unwrap().user_vote.is_none());
    }

    // ── delete_vote: solution not found after vote found ──
    #[tokio::test]
    async fn delete_vote_solution_not_found_after_vote() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::vote_model()]]) // 1) vote found
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // 2) solution missing
            .into_connection();

        let result =
            service::delete_vote(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_vote_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let result =
            service::delete_vote(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(result.is_err());
    }

    // ── create_vote different vote_type variant ──
    #[tokio::test]
    async fn create_vote_different_vote_type_already_voted() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::vote_model()]])
            .into_connection();

        let result = service::create_vote(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Different,
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_vote_db_error_on_solution_lookup() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let result = service::create_vote(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Accurate,
        )
        .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn delete_vote_solution_lookup_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::vote_model()]]) // vote found
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())]) // solution err
            .into_connection();
        let result =
            service::delete_vote(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(result.is_err());
    }

    // ── get_vote_stats: user vote found but invalid vote_type string ──
    #[tokio::test]
    async fn get_vote_stats_with_user_vote_invalid_type_ignored() {
        let mut v = fixtures::vote_model();
        v.vote_type = "unknown_type".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[v]])
            .into_connection();

        let result =
            service::get_vote_stats(&db, fixtures::test_uuid(3), Some(fixtures::test_uuid(10)))
                .await;
        assert!(result.is_ok());
        // parse fails → user_vote is None
        assert!(result.unwrap().user_vote.is_none());
    }

    #[tokio::test]
    async fn get_vote_stats_with_different_vote_type() {
        let mut v = fixtures::vote_model();
        v.vote_type = "different".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[v]])
            .into_connection();

        let stats =
            service::get_vote_stats(&db, fixtures::test_uuid(3), Some(fixtures::test_uuid(10)))
                .await
                .unwrap();
        assert_eq!(
            stats.user_vote,
            Some(crate::domains::votes::dto::VoteType::Different)
        );
    }

    #[tokio::test]
    async fn get_vote_stats_user_vote_lookup_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let result =
            service::get_vote_stats(&db, fixtures::test_uuid(3), Some(fixtures::test_uuid(10)))
                .await;
        assert!(result.is_err());
    }

    // ── unadopt_solution success (no transaction) ──
    #[tokio::test]
    async fn unadopt_solution_success() {
        let mut adopted = fixtures::solution_model();
        adopted.is_adopted = true;
        adopted.match_type = Some("perfect".to_string());
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[adopted.clone()]]) // solution find
            .append_query_results([[fixtures::spot_model()]]) // spot find
            .append_query_results([[adopted.clone()]]) // update returns model
            .into_connection();

        let result =
            service::unadopt_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn unadopt_solution_db_error_on_update() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();

        let result =
            service::unadopt_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(result.is_err());
    }

    // ── adopt_solution happy path (with transaction) ──
    #[tokio::test]
    async fn adopt_solution_success_close_match() {
        let mut updated = fixtures::solution_model();
        updated.is_adopted = true;
        updated.match_type = Some("close".to_string());
        updated.adopted_at = Some(fixtures::test_timestamp());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]]) // solution find
            .append_query_results([[fixtures::spot_model()]]) // spot find
            .append_query_results::<crate::entities::solutions::Model, Vec<_>, _>([vec![]]) // no existing adopted
            .append_query_results([[updated.clone()]]) // update inside txn
            .into_connection();

        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            "close".to_string(),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.is_adopted);
        assert_eq!(resp.match_type, "close");
        assert!(resp.updated_spot.is_none());
    }

    #[tokio::test]
    async fn adopt_solution_perfect_match_includes_updated_spot() {
        let mut updated = fixtures::solution_model();
        updated.is_adopted = true;
        updated.match_type = Some("perfect".to_string());
        updated.adopted_at = Some(fixtures::test_timestamp());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .append_query_results([[fixtures::solution_model()]]) // same id — not a conflict
            .append_query_results([[updated.clone()]])
            .into_connection();

        let result = service::adopt_solution(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            "perfect".to_string(),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.match_type, "perfect");
        assert!(resp.updated_spot.is_some());
    }

    // ── create_vote / delete_vote db error paths within txn ──
    #[tokio::test]
    async fn create_vote_already_voted_different_type() {
        let mut v = fixtures::vote_model();
        v.vote_type = "different".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[v]])
            .into_connection();

        let result = service::create_vote(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Accurate,
        )
        .await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_vote_existing_vote_lookup_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let result = service::create_vote(
            &db,
            fixtures::test_uuid(3),
            fixtures::test_uuid(10),
            crate::domains::votes::dto::VoteType::Accurate,
        )
        .await;
        assert!(result.is_err());
    }
}
