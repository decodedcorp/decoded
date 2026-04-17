//! Reports 도메인 mock DB 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::reports::dto::{AdminReportListQuery, UpdateReportStatusDto};
    use crate::domains::reports::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn create_report_duplicate_fails() {
        // Existing report returned → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::report_model()]])
            .into_connection();
        let result = service::create_report(
            &db,
            fixtures::test_uuid(10),
            "post",
            fixtures::test_uuid(1),
            "spam",
            Some("dup"),
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_report_success() {
        // 1st query: duplicate check → empty
        // 2nd query: insert → returns saved row
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::content_reports::Model>::new()])
            .append_query_results([[fixtures::report_model()]])
            .into_connection();
        let result = service::create_report(
            &db,
            fixtures::test_uuid(10),
            "post",
            fixtures::test_uuid(1),
            "spam",
            Some("details"),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let r = result.unwrap();
        assert_eq!(r.target_type, "post");
        assert_eq!(r.reason, "spam");
        assert_eq!(r.status, "pending");
    }

    #[tokio::test]
    async fn admin_list_reports_empty() {
        // 1st query: count → 0
        // 2nd query: reports list → empty
        // users lookup is skipped when reports is empty? No — it runs with empty ids.
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(0)]])
            .append_query_results([Vec::<crate::entities::content_reports::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let query = AdminReportListQuery {
            status: None,
            target_type: None,
            page: Some(1),
            per_page: Some(20),
        };
        let result = service::admin_list_reports(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 0);
        assert_eq!(resp.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn admin_update_report_status_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::content_reports::Model>::new()])
            .into_connection();
        let dto = UpdateReportStatusDto {
            status: "reviewed".to_string(),
            resolution: None,
        };
        let result = service::admin_update_report_status(
            &db,
            fixtures::test_uuid(99),
            fixtures::test_uuid(99),
            dto,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_report_status_invalid_status() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let dto = UpdateReportStatusDto {
            status: "nonsense".to_string(),
            resolution: None,
        };
        let result = service::admin_update_report_status(
            &db,
            fixtures::test_uuid(100),
            fixtures::test_uuid(99),
            dto,
        )
        .await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn admin_update_report_status_success() {
        let mut updated = fixtures::report_model();
        updated.status = "reviewed".to_string();
        updated.resolution = Some("handled".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // find_by_id (txn)
            .append_query_results([[fixtures::report_model()]])
            // update
            .append_query_results([[updated.clone()]])
            // audit insert RETURNING
            .append_query_results([[fixtures::audit_log_model()]])
            // reporter lookup (post-commit)
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let dto = UpdateReportStatusDto {
            status: "reviewed".to_string(),
            resolution: Some("handled".to_string()),
        };
        let result = service::admin_update_report_status(
            &db,
            fixtures::test_uuid(100),
            fixtures::test_uuid(99),
            dto,
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let item = result.unwrap();
        assert_eq!(item.status, "reviewed");
        assert_eq!(item.resolution, Some("handled".to_string()));
        assert_eq!(item.reporter.username, "testuser");
    }
}
