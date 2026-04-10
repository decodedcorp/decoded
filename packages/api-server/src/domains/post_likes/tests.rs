//! Post likes 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::post_likes::dto::PostLikeStatsResponse;

    #[test]
    fn post_like_stats_serializes_expected_shape() {
        let s = PostLikeStatsResponse {
            like_count: 3,
            user_has_liked: true,
        };
        let v = serde_json::to_value(&s).unwrap();
        assert_eq!(v["like_count"], 3);
        assert_eq!(v["user_has_liked"], true);
        assert!(v.get("like_count").is_some());
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::post_likes::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    fn like_model() -> crate::entities::post_likes::Model {
        crate::entities::post_likes::Model {
            id: fixtures::test_uuid(50),
            post_id: fixtures::test_uuid(1),
            user_id: fixtures::test_uuid(10),
            created_at: fixtures::test_timestamp(),
        }
    }

    #[tokio::test]
    async fn create_like_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let result =
            service::create_like(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn create_like_already_liked() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[like_model()]])
            .into_connection();
        let result =
            service::create_like(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_like_success_inserts() {
        use sea_orm::MockExecResult;
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([Vec::<crate::entities::post_likes::Model>::new()])
            .append_query_results([[like_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result =
            service::create_like(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn delete_like_success_deletes() {
        use sea_orm::MockExecResult;
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[like_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result =
            service::delete_like(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn delete_like_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::post_likes::Model>::new()])
            .into_connection();
        let result =
            service::delete_like(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_like_stats_post_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let result = service::get_like_stats(&db, fixtures::test_uuid(99), None).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_like_stats_success_no_user() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[fixtures::count_row(5)]])
            .into_connection();
        let result = service::get_like_stats(&db, fixtures::test_uuid(1), None).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.like_count, 5);
        assert!(!stats.user_has_liked);
    }

    #[tokio::test]
    async fn get_like_stats_success_with_user_liked() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::post_model()]])
            .append_query_results([[fixtures::count_row(3)]])
            .append_query_results([[like_model()]])
            .into_connection();
        let result =
            service::get_like_stats(&db, fixtures::test_uuid(1), Some(fixtures::test_uuid(10)))
                .await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.like_count, 3);
        assert!(stats.user_has_liked);
    }

    #[tokio::test]
    async fn user_has_liked_false() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::post_likes::Model>::new()])
            .into_connection();
        let result =
            service::user_has_liked(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(!result.unwrap());
    }

    #[tokio::test]
    async fn user_has_liked_true() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[like_model()]])
            .into_connection();
        let result =
            service::user_has_liked(&db, fixtures::test_uuid(1), fixtures::test_uuid(10)).await;
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn count_likes_by_post_id() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(7)]])
            .into_connection();
        let result = service::count_likes_by_post_id(&db, fixtures::test_uuid(1)).await;
        assert_eq!(result.unwrap(), 7);
    }
}
