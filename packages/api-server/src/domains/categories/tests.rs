//! Categories 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::categories::dto::CategoryName;
    use crate::domains::categories::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use serde_json::json;

    #[test]
    fn category_name_roundtrips_json() {
        let name = CategoryName {
            ko: "패션".to_string(),
            en: "fashion".to_string(),
            ja: None,
        };
        let v = serde_json::to_value(&name).unwrap();
        assert_eq!(v["ko"], "패션");
        let back: CategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(back.en, "fashion");
    }

    #[test]
    fn category_name_deserializes_from_snake_keys() {
        let v = json!({ "ko": "a", "en": "b" });
        let n: CategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(n.ko, "a");
    }

    #[tokio::test]
    async fn get_category_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .into_connection();

        let result = service::get_category_by_id(&db, fixtures::test_uuid(20)).await;
        assert!(result.is_ok());
        let cat = result.unwrap();
        assert_eq!(cat.code, "fashion");
        assert_eq!(cat.name.ko, "패션");
        assert_eq!(cat.name.en, "Fashion");
        assert!(cat.is_active);
    }

    #[tokio::test]
    async fn get_category_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::get_category_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_active_categories_returns_all() {
        let mut cat2 = fixtures::category_model();
        cat2.id = fixtures::test_uuid(22);
        cat2.code = "beauty".to_string();
        cat2.name = json!({"ko": "뷰티", "en": "Beauty"});
        cat2.display_order = 2;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model(), cat2]])
            .into_connection();

        let result = service::list_active_categories(&db).await;
        assert!(result.is_ok());
        let cats = result.unwrap();
        assert_eq!(cats.len(), 2);
        assert_eq!(cats[0].code, "fashion");
        assert_eq!(cats[1].code, "beauty");
    }

    #[tokio::test]
    async fn list_active_categories_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::list_active_categories(&db).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn get_category_by_id_checks_description() {
        let mut cat = fixtures::category_model();
        cat.description = Some(json!({"ko": "패션 설명", "en": "Fashion desc"}));

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![cat]])
            .into_connection();

        let result = service::get_category_by_id(&db, fixtures::test_uuid(20)).await;
        assert!(result.is_ok());
        let cat = result.unwrap();
        let desc = cat.description.unwrap();
        assert_eq!(desc.ko.unwrap(), "패션 설명");
        assert_eq!(desc.en.unwrap(), "Fashion desc");
    }

    #[tokio::test]
    async fn get_category_by_id_no_description() {
        let mut cat = fixtures::category_model();
        cat.description = None;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![cat]])
            .into_connection();

        let result = service::get_category_by_id(&db, fixtures::test_uuid(20)).await;
        assert!(result.is_ok());
        assert!(result.unwrap().description.is_none());
    }

    // ──────────────────────────────────────────────────────────────
    // Admin category service tests
    // ──────────────────────────────────────────────────────────────

    use crate::domains::admin::categories::{
        CategoryOrderItem, CreateCategoryDto, UpdateCategoryDto,
    };
    use crate::domains::categories::dto::CategoryDescription;

    fn sample_name() -> CategoryName {
        CategoryName {
            ko: "패션".to_string(),
            en: "Fashion".to_string(),
            ja: None,
        }
    }

    fn sample_create_dto() -> CreateCategoryDto {
        CreateCategoryDto {
            code: "fashion".to_string(),
            name: sample_name(),
            icon_url: None,
            color_hex: None,
            description: Some(CategoryDescription {
                ko: Some("패션 설명".to_string()),
                en: Some("Fashion desc".to_string()),
                ja: None,
            }),
            display_order: Some(1),
        }
    }

    #[tokio::test]
    async fn admin_create_category_duplicate_code_fails() {
        // Existing category with same code is returned → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .into_connection();

        let result = service::admin_create_category(&db, sample_create_dto()).await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn admin_create_category_success_with_explicit_order() {
        // 1st query: duplicate check → empty
        // 2nd query: insert → returns the saved row
        // (display_order is provided, so no max-order lookup)
        let saved = fixtures::category_model();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .append_query_results([vec![saved.clone()]])
            .into_connection();

        let result = service::admin_create_category(&db, sample_create_dto()).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let cat = result.unwrap();
        assert_eq!(cat.code, "fashion");
        assert_eq!(cat.name.en, "Fashion");
    }

    #[tokio::test]
    async fn admin_create_category_success_auto_order() {
        // display_order = None → service queries max-order first
        let mut dto = sample_create_dto();
        dto.display_order = None;

        let mut max_cat = fixtures::category_model();
        max_cat.display_order = 5;

        let saved = fixtures::category_model();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // duplicate check
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            // max-order lookup
            .append_query_results([vec![max_cat]])
            // insert
            .append_query_results([vec![saved]])
            .into_connection();

        let result = service::admin_create_category(&db, dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn admin_update_category_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let dto = UpdateCategoryDto {
            code: None,
            name: None,
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: Some(2),
        };
        let result = service::admin_update_category(&db, fixtures::test_uuid(99), dto).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_category_duplicate_new_code_fails() {
        // 1st query: find_by_id → returns category (code = "fashion")
        // 2nd query: duplicate check for new code "beauty" → returns some row
        let mut other = fixtures::category_model();
        other.id = fixtures::test_uuid(22);
        other.code = "beauty".to_string();

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([vec![other]])
            .into_connection();

        let dto = UpdateCategoryDto {
            code: Some("beauty".to_string()),
            name: None,
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: None,
        };
        let result = service::admin_update_category(&db, fixtures::test_uuid(20), dto).await;
        assert!(matches!(result, Err(crate::error::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn admin_update_category_success_order_only() {
        // 1st query: find_by_id → returns category
        // no duplicate check (code is None)
        // 2nd query: update → returns updated row
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([vec![fixtures::category_model()]])
            .into_connection();

        let dto = UpdateCategoryDto {
            code: None,
            name: None,
            icon_url: None,
            color_hex: None,
            description: None,
            display_order: Some(10),
        };
        let result = service::admin_update_category(&db, fixtures::test_uuid(20), dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn admin_update_category_status_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result =
            service::admin_update_category_status(&db, fixtures::test_uuid(99), false).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_category_status_success() {
        let mut updated = fixtures::category_model();
        updated.is_active = false;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([vec![updated]])
            .into_connection();

        let result =
            service::admin_update_category_status(&db, fixtures::test_uuid(20), false).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(!result.unwrap().is_active);
    }

    #[tokio::test]
    async fn admin_update_category_order_empty_list_ok() {
        // No orders → transaction body is a no-op, then final list query returns empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::admin_update_category_order(&db, vec![]).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn admin_update_category_order_not_found_inside_txn() {
        // Transaction looks up each category_id; when the first lookup returns empty
        // the service should return NotFound.
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let orders = vec![CategoryOrderItem {
            category_id: fixtures::test_uuid(99),
            display_order: 1,
        }];
        let result = service::admin_update_category_order(&db, orders).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }
}
