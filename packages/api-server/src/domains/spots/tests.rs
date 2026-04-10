//! Spots 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::spots::dto::CreateSpotDto;
    use uuid::Uuid;
    use validator::Validate;

    #[test]
    fn create_spot_rejects_empty_position_left() {
        let dto = CreateSpotDto {
            position_left: String::new(),
            position_top: "12%".to_string(),
            category_id: Uuid::nil(),
        };
        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_spot_rejects_empty_position_top() {
        let dto = CreateSpotDto {
            position_left: "50%".to_string(),
            position_top: String::new(),
            category_id: Uuid::nil(),
        };
        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_spot_valid() {
        let dto = CreateSpotDto {
            position_left: "50%".to_string(),
            position_top: "30%".to_string(),
            category_id: Uuid::new_v4(),
        };
        assert!(dto.validate().is_ok());
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::spots::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn get_spot_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();
        let result = service::get_spot_by_id(&db, fixtures::test_uuid(2)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().position_left, "50.0");
    }

    #[tokio::test]
    async fn get_spot_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let result = service::get_spot_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_spot_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let result =
            service::delete_spot(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_spot_forbidden_wrong_user() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();
        // spot owned by user 10, deleting as user 11
        let result =
            service::delete_spot(&db, fixtures::test_uuid(2), fixtures::test_uuid(11)).await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn list_spots_by_post_id_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let result = service::list_spots_by_post_id(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn list_spots_by_post_id_with_no_subcategory() {
        let mut spot = fixtures::spot_model();
        spot.subcategory_id = None;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[spot]])
            .into_connection();
        let result = service::list_spots_by_post_id(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        let items = result.unwrap();
        assert_eq!(items.len(), 1);
        assert!(items[0].category.is_none());
    }

    #[tokio::test]
    async fn list_spots_by_post_id_with_subcategory() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // spots query
            .append_query_results([[fixtures::spot_model()]])
            // subcategory lookup
            .append_query_results([[fixtures::subcategory_model()]])
            // category lookup
            .append_query_results([[fixtures::category_model()]])
            .into_connection();
        let result = service::list_spots_by_post_id(&db, fixtures::test_uuid(1)).await;
        assert!(result.is_ok());
        let items = result.unwrap();
        assert_eq!(items.len(), 1);
        assert!(items[0].category.is_some());
    }

    #[tokio::test]
    async fn update_spot_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let dto = crate::domains::spots::dto::UpdateSpotDto {
            position_left: Some("60.0".to_string()),
            position_top: None,
            category_id: None,
            status: None,
        };
        let result =
            service::update_spot(&db, fixtures::test_uuid(99), fixtures::test_uuid(10), dto).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_spot_forbidden_wrong_user() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();
        let dto = crate::domains::spots::dto::UpdateSpotDto {
            position_left: Some("60.0".to_string()),
            position_top: None,
            category_id: None,
            status: None,
        };
        let result =
            service::update_spot(&db, fixtures::test_uuid(2), fixtures::test_uuid(11), dto).await;
        assert!(matches!(result, Err(crate::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn get_category_from_spot_subcategory_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .into_connection();
        let result = service::get_category_from_spot(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_category_from_spot_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::subcategory_model()]])
            .append_query_results([[fixtures::category_model()]])
            .into_connection();
        let result = service::get_category_from_spot(&db, fixtures::test_uuid(21)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn create_spot_success() {
        // subcategory + category lookups (for get_category_from_spot), then insert
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::subcategory_model()]])
            .append_query_results([[fixtures::category_model()]])
            .append_query_results([[fixtures::spot_model()]])
            .into_connection();
        let dto = crate::domains::spots::dto::CreateSpotDto {
            position_left: "50%".to_string(),
            position_top: "30%".to_string(),
            category_id: fixtures::test_uuid(21),
        };
        let result =
            service::create_spot(&db, fixtures::test_uuid(1), fixtures::test_uuid(10), dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.post_id, fixtures::test_uuid(1));
        assert!(resp.category.is_some());
    }

    #[tokio::test]
    async fn create_spot_subcategory_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .into_connection();
        let dto = crate::domains::spots::dto::CreateSpotDto {
            position_left: "50%".to_string(),
            position_top: "30%".to_string(),
            category_id: fixtures::test_uuid(99),
        };
        let result =
            service::create_spot(&db, fixtures::test_uuid(1), fixtures::test_uuid(10), dto).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_list_spots_empty() {
        // count → 0, spots list → empty, posts lookup skipped when post_ids empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(0)]])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let pagination = crate::utils::pagination::Pagination::new(1, 20);
        let result = service::admin_list_spots(&db, None, pagination).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
        assert_eq!(resp.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn admin_update_spot_subcategory_invalid_subcategory() {
        // ensure_subcategory_exists → empty → BadRequest
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()])
            .into_connection();
        let dto = crate::domains::spots::dto::AdminSpotSubcategoryUpdate {
            subcategory_id: fixtures::test_uuid(99),
        };
        let result = service::admin_update_spot_subcategory(&db, fixtures::test_uuid(2), dto).await;
        assert!(matches!(result, Err(crate::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn admin_update_spot_subcategory_spot_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // ensure_subcategory_exists
            .append_query_results([[fixtures::subcategory_model()]])
            // get_spot_by_id → empty
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .into_connection();
        let dto = crate::domains::spots::dto::AdminSpotSubcategoryUpdate {
            subcategory_id: fixtures::test_uuid(21),
        };
        let result =
            service::admin_update_spot_subcategory(&db, fixtures::test_uuid(99), dto).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_spot_subcategory_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // ensure_subcategory_exists
            .append_query_results([[fixtures::subcategory_model()]])
            // get_spot_by_id
            .append_query_results([[fixtures::spot_model()]])
            // update
            .append_query_results([[fixtures::spot_model()]])
            // get_category_from_spot: subcategory
            .append_query_results([[fixtures::subcategory_model()]])
            // get_category_from_spot: category
            .append_query_results([[fixtures::category_model()]])
            .into_connection();
        let dto = crate::domains::spots::dto::AdminSpotSubcategoryUpdate {
            subcategory_id: fixtures::test_uuid(21),
        };
        let result = service::admin_update_spot_subcategory(&db, fixtures::test_uuid(2), dto).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.category.is_some());
    }
}
