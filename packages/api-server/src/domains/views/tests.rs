//! Views 도메인 테스트 — 엔티티/스키마 계약 + MockDB 서비스 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use sea_orm::Iden;

    #[test]
    fn view_logs_column_reference_type_sql_name() {
        assert_eq!(
            crate::entities::view_logs::Column::ReferenceType.to_string(),
            "reference_type"
        );
    }

    #[tokio::test]
    async fn create_view_log_duplicate_skips_insert() {
        use crate::entities::view_logs;
        use sea_orm::{DatabaseBackend, MockDatabase};
        use uuid::Uuid;

        let existing = view_logs::Model {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::nil()),
            reference_type: "post".into(),
            reference_id: Uuid::nil(),
            created_at: chrono::Utc::now().into(),
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[existing]])
            .into_connection();
        let result =
            super::super::service::create_view_log(&db, Uuid::nil(), "post", Uuid::nil()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn create_view_log_new_entry_inserts() {
        use crate::entities::view_logs;
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};
        use uuid::Uuid;

        let inserted = view_logs::Model {
            id: Uuid::new_v4(),
            user_id: Some(Uuid::nil()),
            reference_type: "post".into(),
            reference_id: Uuid::nil(),
            created_at: chrono::Utc::now().into(),
        };

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<view_logs::Model>::new()])
            .append_query_results([[inserted]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result =
            super::super::service::create_view_log(&db, Uuid::nil(), "post", Uuid::nil()).await;
        assert!(result.is_ok());
    }
}
