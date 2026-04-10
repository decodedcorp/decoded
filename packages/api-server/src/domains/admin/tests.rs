//! Admin 도메인 — DTO 검증 등 최소 단위 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::admin::synonyms::{
        service::{
            admin_create_synonym, admin_delete_synonym, admin_list_synonyms, admin_update_synonym,
        },
        CreateSynonymDto, SynonymListQuery, UpdateSynonymDto,
    };
    use crate::entities::synonyms::Model as SynonymModel;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use validator::Validate;

    fn synonym_model() -> SynonymModel {
        SynonymModel {
            id: fixtures::test_uuid(120),
            type_: "artist".to_string(),
            canonical: "Jennie".to_string(),
            synonyms: vec!["jennie kim".to_string(), "ジェニー".to_string()],
            is_active: true,
            created_at: fixtures::test_timestamp(),
            updated_at: fixtures::test_timestamp(),
        }
    }

    #[test]
    fn create_synonym_rejects_empty_canonical() {
        let dto = CreateSynonymDto {
            type_: "artist".to_string(),
            canonical: String::new(),
            synonyms: vec!["alias".to_string()],
            is_active: true,
        };
        assert!(dto.validate().is_err());
    }

    #[tokio::test]
    async fn admin_create_synonym_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<SynonymModel>::new()])
            .append_query_results([vec![synonym_model()]])
            .into_connection();
        let dto = CreateSynonymDto {
            type_: "artist".to_string(),
            canonical: "Jennie".to_string(),
            synonyms: vec!["alias".to_string()],
            is_active: true,
        };
        let result = admin_create_synonym(&db, dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.canonical, "Jennie");
        assert_eq!(resp.type_, "artist");
    }

    #[tokio::test]
    async fn admin_delete_synonym_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![synonym_model()]])
            .append_exec_results([sea_orm::MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let result = admin_delete_synonym(&db, synonym_model().id).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn admin_update_synonym_success_updates_is_active() {
        let mut updated = synonym_model();
        updated.is_active = false;
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![synonym_model()]])
            .append_query_results([vec![updated]])
            .into_connection();
        let dto = UpdateSynonymDto {
            type_: None,
            canonical: None,
            synonyms: None,
            is_active: Some(false),
        };
        let result = admin_update_synonym(&db, synonym_model().id, dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(!result.unwrap().is_active);
    }

    #[tokio::test]
    async fn admin_list_synonyms_type_only_filter() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![synonym_model()]])
            .into_connection();
        let result = admin_list_synonyms(
            &db,
            SynonymListQuery {
                type_: Some("artist".to_string()),
                is_active: None,
                search: None,
            },
        )
        .await
        .expect("ok");
        assert_eq!(result.len(), 1);
    }

    #[tokio::test]
    async fn admin_list_synonyms_is_active_only_filter() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![synonym_model()]])
            .into_connection();
        let result = admin_list_synonyms(
            &db,
            SynonymListQuery {
                type_: None,
                is_active: Some(false),
                search: None,
            },
        )
        .await
        .expect("ok");
        assert_eq!(result.len(), 1);
    }

    #[test]
    fn update_synonym_dto_deserializes_all_fields() {
        let json = serde_json::json!({
            "type": "brand",
            "canonical": "Gucci",
            "synonyms": ["GUCCI", "gucci"],
            "is_active": false
        });
        let dto: UpdateSynonymDto = serde_json::from_value(json).unwrap();
        assert_eq!(dto.type_.as_deref(), Some("brand"));
        assert_eq!(dto.canonical.as_deref(), Some("Gucci"));
        assert_eq!(dto.synonyms.as_ref().unwrap().len(), 2);
        assert_eq!(dto.is_active, Some(false));
    }
}
