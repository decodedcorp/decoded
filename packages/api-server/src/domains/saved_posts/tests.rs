//! Saved posts 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::saved_posts::dto::SavedPostStatsResponse;

    #[test]
    fn saved_post_stats_serializes_flag() {
        let s = SavedPostStatsResponse {
            user_has_saved: false,
        };
        let v = serde_json::to_value(&s).unwrap();
        assert_eq!(v["user_has_saved"], false);
        assert!(v.get("user_has_saved").is_some());
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::saved_posts::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn save_post_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let result =
            service::save_post(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn save_post_already_saved_returns_bad_request() {
        let saved = crate::entities::saved_posts::Model {
            id: fixtures::test_uuid(50),
            post_id: fixtures::test_uuid(1),
            user_id: fixtures::test_uuid(10),
            created_at: fixtures::test_timestamp(),
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[saved]])
            .into_connection();
        let result = service::save_post(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn unsave_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::saved_posts::Model>::new()])
            .into_connection();
        let result =
            service::unsave_post(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn user_has_saved_false_when_missing() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::saved_posts::Model>::new()])
            .into_connection();
        let result =
            service::user_has_saved(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(!result.unwrap());
    }

    #[tokio::test]
    async fn save_post_success_inserts() {
        use sea_orm::MockExecResult;
        let saved = crate::entities::saved_posts::Model {
            id: fixtures::test_uuid(50),
            post_id: fixtures::test_uuid(1),
            user_id: fixtures::test_uuid(10),
            created_at: fixtures::test_timestamp(),
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([Vec::<crate::entities::saved_posts::Model>::new()])
            .append_query_results([[saved.clone()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result = service::save_post(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn unsave_post_success_deletes() {
        use sea_orm::MockExecResult;
        let saved = crate::entities::saved_posts::Model {
            id: fixtures::test_uuid(50),
            post_id: fixtures::test_uuid(1),
            user_id: fixtures::test_uuid(10),
            created_at: fixtures::test_timestamp(),
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[saved]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result =
            service::unsave_post(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn user_has_saved_true_when_present() {
        let saved = crate::entities::saved_posts::Model {
            id: fixtures::test_uuid(50),
            post_id: fixtures::test_uuid(1),
            user_id: fixtures::test_uuid(10),
            created_at: fixtures::test_timestamp(),
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[saved]])
            .into_connection();
        let result =
            service::user_has_saved(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.unwrap());
    }
}
