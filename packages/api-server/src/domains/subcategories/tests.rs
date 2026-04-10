//! Subcategories 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::subcategories::dto::SubcategoryName;
    use crate::domains::subcategories::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use serde_json::json;

    #[test]
    fn subcategory_name_roundtrips() {
        let n = SubcategoryName {
            ko: "가방".to_string(),
            en: "bags".to_string(),
        };
        let v = serde_json::to_value(&n).unwrap();
        let back: SubcategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(back.ko, "가방");
        assert_eq!(back.en, "bags");
    }

    #[test]
    fn subcategory_name_from_json() {
        let v = json!({ "ko": "k", "en": "e" });
        let n: SubcategoryName = serde_json::from_value(v).unwrap();
        assert_eq!(n.ko, "k");
    }

    #[tokio::test]
    async fn get_subcategory_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::subcategory_model()]])
            .into_connection();

        let result = service::get_subcategory_by_id(&db, fixtures::test_uuid(21)).await;
        assert!(result.is_ok());
        let sub = result.unwrap();
        assert_eq!(sub.code, "tops");
        assert_eq!(sub.name.ko, "상의");
        assert_eq!(sub.name.en, "Tops");
        assert!(sub.is_active);
    }

    #[tokio::test]
    async fn get_subcategory_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::subcategories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::get_subcategory_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn get_subcategory_by_code_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::subcategory_model()]])
            .into_connection();

        let result = service::get_subcategory_by_code(&db, "tops").await;
        assert!(result.is_ok());
        let sub = result.unwrap();
        assert_eq!(sub.code, "tops");
    }

    #[tokio::test]
    async fn get_subcategory_by_code_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::subcategories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::get_subcategory_by_code(&db, "nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn ensure_subcategory_exists_ok() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::subcategory_model()]])
            .into_connection();

        let result = service::ensure_subcategory_exists(&db, fixtures::test_uuid(21)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn ensure_subcategory_exists_fails() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::subcategories::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::ensure_subcategory_exists(&db, fixtures::test_uuid(99)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_subcategories_by_category_ok() {
        // 1) get_category_by_id → category
        // 2) subcategories list by category
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([vec![fixtures::subcategory_model()]])
            .into_connection();

        let result = service::list_subcategories_by_category(&db, fixtures::test_uuid(20)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let list = result.unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].code, "tops");
    }

    #[tokio::test]
    async fn list_subcategories_by_category_when_category_missing() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let result = service::list_subcategories_by_category(&db, fixtures::test_uuid(99)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_all_with_categories_empty_returns_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let result = service::list_all_with_categories(&db).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn list_all_with_categories_with_one_category() {
        // Flow:
        // 1. categories list (active) → [category]
        // 2. subcategories of that category → [subcategory]
        // 3. get_category_by_id call from inside the loop → category
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]])
            .append_query_results([vec![fixtures::subcategory_model()]])
            .append_query_results([vec![fixtures::category_model()]])
            .into_connection();
        let result = service::list_all_with_categories(&db).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let cats = result.unwrap();
        assert_eq!(cats.len(), 1);
        assert_eq!(cats[0].subcategories.len(), 1);
    }

    #[tokio::test]
    async fn resolve_uncategorized_subcategory_id_missing_system_category() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::categories::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let result = service::resolve_uncategorized_subcategory_id(&db).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn resolve_uncategorized_subcategory_id_missing_subcategory() {
        let mut system_cat = fixtures::category_model();
        system_cat.code = "system".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![system_cat]])
            .append_query_results::<crate::entities::subcategories::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let result = service::resolve_uncategorized_subcategory_id(&db).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn resolve_uncategorized_subcategory_id_ok() {
        let mut system_cat = fixtures::category_model();
        system_cat.code = "system".to_string();
        let mut uncat = fixtures::subcategory_model();
        uncat.code = "uncategorized".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![system_cat]])
            .append_query_results([vec![uncat.clone()]])
            .into_connection();
        let result = service::resolve_uncategorized_subcategory_id(&db).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), uncat.id);
    }

    #[tokio::test]
    async fn get_subcategory_by_id_display_order() {
        let mut sub = fixtures::subcategory_model();
        sub.display_order = 5;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![sub]])
            .into_connection();

        let result = service::get_subcategory_by_id(&db, fixtures::test_uuid(21)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().display_order, 5);
    }
}
