//! Solutions 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::solutions::dto::PriceDto;

    #[test]
    fn price_dto_serializes_amount_and_currency() {
        let p = PriceDto {
            amount: "1200.50".to_string(),
            currency: "KRW".to_string(),
        };
        let v = serde_json::to_value(&p).unwrap();
        assert_eq!(v["amount"], "1200.50");
        assert_eq!(v["currency"], "KRW");
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::solutions::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

    #[tokio::test]
    async fn get_solution_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result = service::get_solution_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_solution_by_id_user_not_found() {
        // solution found, but get_user_by_id returns empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();

        let result = service::get_solution_by_id(&db, fixtures::test_uuid(3)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_solution_by_id_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .into_connection();

        let result = service::get_solution_by_id(&db, fixtures::test_uuid(3)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let sol = result.unwrap();
        assert_eq!(sol.id, fixtures::test_uuid(3));
        assert_eq!(sol.title, "Test Solution");
        assert_eq!(sol.vote_stats.accurate, 5);
        assert_eq!(sol.vote_stats.different, 1);
    }

    #[tokio::test]
    async fn list_solutions_by_spot_id_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::solutions::Model, Vec<_>, _>([vec![]])
            .into_connection();

        let result = service::list_solutions_by_spot_id(&db, fixtures::test_uuid(2)).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn update_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let dto = crate::domains::solutions::dto::UpdateSolutionDto {
            title: Some("new title".to_string()),
            metadata: None,
            description: None,
        };
        let result =
            service::update_solution(&db, fixtures::test_uuid(99), fixtures::test_uuid(10), dto)
                .await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_solution_forbidden_when_not_owner() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();

        let dto = crate::domains::solutions::dto::UpdateSolutionDto {
            title: Some("new title".to_string()),
            metadata: None,
            description: None,
        };
        // solution.user_id = test_uuid(10); use a different user
        let result =
            service::update_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(77), dto)
                .await;
        assert!(matches!(result, Err(crate::error::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result =
            service::delete_solution(&db, fixtures::test_uuid(99), fixtures::test_uuid(10)).await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_solution_forbidden_when_not_owner() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();

        let result =
            service::delete_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(77)).await;
        assert!(matches!(result, Err(crate::error::AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_solution_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();

        let result =
            service::delete_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn admin_update_solution_status_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();

        let result =
            service::admin_update_solution_status(&db, fixtures::test_uuid(99), "hidden").await;
        assert!(matches!(result, Err(crate::error::AppError::NotFound(_))));
    }

    // ── update_solution success path ──
    #[tokio::test]
    async fn update_solution_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]]) // find_by_id
            .append_query_results([[fixtures::solution_model()]]) // update returns model
            .into_connection();

        let dto = crate::domains::solutions::dto::UpdateSolutionDto {
            title: Some("updated".to_string()),
            metadata: Some(serde_json::json!({"k": "v"})),
            description: Some("new desc".to_string()),
        };
        let result =
            service::update_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10), dto)
                .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn update_solution_no_op_optionals_still_succeeds() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();

        let dto = crate::domains::solutions::dto::UpdateSolutionDto {
            title: None,
            metadata: None,
            description: None,
        };
        let result =
            service::update_solution(&db, fixtures::test_uuid(3), fixtures::test_uuid(10), dto)
                .await;
        assert!(result.is_ok());
    }

    // ── admin_update_solution_status success ──
    #[tokio::test]
    async fn admin_update_solution_status_success() {
        let mut updated = fixtures::solution_model();
        updated.status = "hidden".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]]) // find_by_id
            .append_query_results([[updated.clone()]]) // update
            .append_query_results([[updated.clone()]]) // get_solution_by_id: solution find
            .append_query_results([[fixtures::user_model()]]) // get_user_by_id
            .into_connection();

        let result =
            service::admin_update_solution_status(&db, fixtures::test_uuid(3), "hidden").await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    // ── admin_list_solutions: empty result for various sort keys ──
    #[tokio::test]
    async fn admin_list_solutions_empty_recent_sort() {
        use crate::domains::admin::solutions::AdminSolutionListQuery;
        use crate::utils::pagination::Pagination;

        let empty: Vec<(
            crate::entities::solutions::Model,
            Option<crate::entities::users::Model>,
        )> = vec![];

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()]) // count
            .append_query_results([empty]) // paginated find_also_related
            .into_connection();

        let query = AdminSolutionListQuery {
            status: Some("active".to_string()),
            spot_id: Some(fixtures::test_uuid(2)),
            user_id: Some(fixtures::test_uuid(10)),
            sort: "recent".to_string(),
            pagination: Pagination::new(1, 20),
        };
        let result = service::admin_list_solutions(&db, query).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(result.unwrap().data.is_empty());
    }

    #[tokio::test]
    async fn admin_list_solutions_empty_popular_sort() {
        use crate::domains::admin::solutions::AdminSolutionListQuery;
        use crate::utils::pagination::Pagination;

        let empty: Vec<(
            crate::entities::solutions::Model,
            Option<crate::entities::users::Model>,
        )> = vec![];

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([empty])
            .into_connection();

        let query = AdminSolutionListQuery {
            status: None,
            spot_id: None,
            user_id: None,
            sort: "popular".to_string(),
            pagination: Pagination::new(1, 20),
        };
        assert!(service::admin_list_solutions(&db, query).await.is_ok());
    }

    #[tokio::test]
    async fn admin_list_solutions_verified_sort() {
        use crate::domains::admin::solutions::AdminSolutionListQuery;
        use crate::utils::pagination::Pagination;

        let empty: Vec<(
            crate::entities::solutions::Model,
            Option<crate::entities::users::Model>,
        )> = vec![];

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([empty])
            .into_connection();

        let query = AdminSolutionListQuery {
            status: None,
            spot_id: None,
            user_id: None,
            sort: "verified".to_string(),
            pagination: Pagination::new(1, 20),
        };
        assert!(service::admin_list_solutions(&db, query).await.is_ok());
    }

    #[tokio::test]
    async fn admin_list_solutions_adopted_sort() {
        use crate::domains::admin::solutions::AdminSolutionListQuery;
        use crate::utils::pagination::Pagination;

        let empty: Vec<(
            crate::entities::solutions::Model,
            Option<crate::entities::users::Model>,
        )> = vec![];

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([empty])
            .into_connection();

        let query = AdminSolutionListQuery {
            status: None,
            spot_id: None,
            user_id: None,
            sort: "adopted".to_string(),
            pagination: Pagination::new(1, 20),
        };
        assert!(service::admin_list_solutions(&db, query).await.is_ok());
    }

    #[tokio::test]
    async fn admin_list_solutions_default_sort_fallback() {
        use crate::domains::admin::solutions::AdminSolutionListQuery;
        use crate::utils::pagination::Pagination;

        let empty: Vec<(
            crate::entities::solutions::Model,
            Option<crate::entities::users::Model>,
        )> = vec![];

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .append_query_results([empty])
            .into_connection();

        let query = AdminSolutionListQuery {
            status: None,
            spot_id: None,
            user_id: None,
            sort: "unknown_sort_key".to_string(),
            pagination: Pagination::new(1, 20),
        };
        assert!(service::admin_list_solutions(&db, query).await.is_ok());
    }

    // ── list_solutions_by_spot_id db error ──
    #[tokio::test]
    async fn list_solutions_by_spot_id_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let result = service::list_solutions_by_spot_id(&db, fixtures::test_uuid(2)).await;
        assert!(result.is_err());
    }

    // ── create_solution success ──
    #[tokio::test]
    async fn create_solution_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]]) // insert returns model
            .into_connection();

        let dto = crate::domains::solutions::dto::CreateSolutionDto {
            original_url: "https://example.com/p".to_string(),
            affiliate_url: None,
            title: Some("title".to_string()),
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };
        let result =
            service::create_solution(&db, fixtures::test_uuid(2), fixtures::test_uuid(10), dto)
                .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod handler_tests {
    use crate::domains::solutions::dto::{
        ConvertAffiliateDto, CreateSolutionDto, ExtractMetadataDto, UpdateSolutionDto,
    };
    use crate::domains::solutions::handlers;
    use crate::error::AppError;
    use crate::tests::fixtures;
    use crate::tests::helpers::{mock_user, test_app_state};
    use axum::extract::{Path, State};
    use axum::{Extension, Json};
    use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

    // ── list_solutions ──
    #[tokio::test]
    async fn list_solutions_handler_empty() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<crate::entities::solutions::Model, Vec<_>, _>([vec![]])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::list_solutions(State(state), Path(fixtures::test_uuid(2))).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(result.unwrap().0.is_empty());
    }

    #[tokio::test]
    async fn list_solutions_handler_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::list_solutions(State(state), Path(fixtures::test_uuid(2))).await;
        assert!(result.is_err());
    }

    // ── get_solution ──
    #[tokio::test]
    async fn get_solution_handler_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::get_solution(State(state), Path(fixtures::test_uuid(99))).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_solution_handler_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::get_solution(State(state), Path(fixtures::test_uuid(3))).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap().0;
        assert_eq!(resp.id, fixtures::test_uuid(3));
        assert_eq!(resp.title, "Test Solution");
    }

    // ── update_solution ──
    #[tokio::test]
    async fn update_solution_handler_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let dto = UpdateSolutionDto {
            title: Some("new".to_string()),
            metadata: None,
            description: None,
        };
        let result = handlers::update_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(99)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_solution_handler_forbidden() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = UpdateSolutionDto {
            title: Some("new".to_string()),
            metadata: None,
            description: None,
        };
        // solution.user_id = test_uuid(10); mock_user is test_uuid(10) → use different user
        let mut other = mock_user();
        other.id = fixtures::test_uuid(77);
        let result = handlers::update_solution(
            State(state),
            Extension(other),
            Path(fixtures::test_uuid(3)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn update_solution_handler_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = UpdateSolutionDto {
            title: Some("updated".to_string()),
            metadata: None,
            description: None,
        };
        let result = handlers::update_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(3)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    // ── delete_solution ──
    #[tokio::test]
    async fn delete_solution_handler_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::delete_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(99)),
        )
        .await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_solution_handler_forbidden() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let state = test_app_state(db);

        let mut other = mock_user();
        other.id = fixtures::test_uuid(77);
        let result =
            handlers::delete_solution(State(state), Extension(other), Path(fixtures::test_uuid(3)))
                .await;
        assert!(matches!(result, Err(AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_solution_handler_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let state = test_app_state(db);

        let result = handlers::delete_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(3)),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    // ── convert_affiliate ──
    #[tokio::test]
    async fn convert_affiliate_handler_returns_wrapped_url() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ConvertAffiliateDto {
            url: "https://shop.example.com/p/1".to_string(),
        };
        let result = handlers::convert_affiliate(State(state), Json(dto)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap().0;
        assert_eq!(resp.original_url, "https://shop.example.com/p/1");
        assert!(resp.affiliate_url.contains("affiliate.example.com"));
        assert!(resp.affiliate_url.contains("shop.example.com"));
    }

    // ── extract_metadata (gRPC unavailable → InternalError) ──
    #[tokio::test]
    async fn extract_metadata_handler_grpc_unavailable_returns_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ExtractMetadataDto {
            url: "https://example.com/p".to_string(),
        };
        let result = handlers::extract_metadata(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    #[tokio::test]
    async fn test_extract_metadata_handler_grpc_unavailable_returns_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ExtractMetadataDto {
            url: "https://example.com/p".to_string(),
        };
        let result = handlers::test_extract_metadata(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    // ── test_analyze_link ──
    #[tokio::test]
    async fn test_analyze_link_handler_solution_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::solutions::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let dto = handlers::TestAnalyzeLinkDto {
            solution_id: fixtures::test_uuid(99),
        };
        let result = handlers::test_analyze_link(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn test_analyze_link_handler_no_url_returns_bad_request() {
        let mut sol = fixtures::solution_model();
        sol.original_url = None;
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[sol]])
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = handlers::TestAnalyzeLinkDto {
            solution_id: fixtures::test_uuid(3),
        };
        let result = handlers::test_analyze_link(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    // ── create_solution handler happy path (fire-and-forget tasks detached) ──
    #[tokio::test]
    async fn create_solution_handler_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]]) // insert
            .into_connection();
        let state = test_app_state(db);

        let dto = CreateSolutionDto {
            original_url: "https://www.shop.example.com/item/123".to_string(),
            affiliate_url: None,
            title: Some("t".to_string()),
            metadata: None,
            description: Some("d".to_string()),
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };
        let result = handlers::create_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(2)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let (status, _body) = result.unwrap();
        assert_eq!(status, reqwest::StatusCode::CREATED);
    }

    #[tokio::test]
    async fn create_solution_handler_success_minimal_dto() {
        // All optional fields None — exercises unwrap_or_default branches.
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = CreateSolutionDto {
            original_url: "https://bare.example.com/".to_string(),
            affiliate_url: None,
            title: None,
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };
        let result = handlers::create_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(2)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn create_solution_handler_success_invalid_url_for_site_name() {
        // original_url does not parse → extract_site_name_from_url returns empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = CreateSolutionDto {
            original_url: "not a valid url".to_string(),
            affiliate_url: None,
            title: Some("x".to_string()),
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };
        let result = handlers::create_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(2)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn create_solution_handler_db_error() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let state = test_app_state(db);

        let dto = CreateSolutionDto {
            original_url: "https://example.com/".to_string(),
            affiliate_url: None,
            title: None,
            metadata: None,
            description: None,
            comment: None,
            thumbnail_url: None,
            brand_id: None,
        };
        let result = handlers::create_solution(
            State(state),
            Extension(mock_user()),
            Path(fixtures::test_uuid(2)),
            Json(dto),
        )
        .await;
        assert!(result.is_err());
    }

    // ── test_analyze_link handler: AI gRPC unavailable path ──
    #[tokio::test]
    async fn test_analyze_link_handler_ai_unavailable_returns_internal() {
        // Solution exists with URL; AI client can't connect → InternalError
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::solution_model()]])
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = handlers::TestAnalyzeLinkDto {
            solution_id: fixtures::test_uuid(3),
        };
        let result = handlers::test_analyze_link(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    #[tokio::test]
    async fn test_analyze_link_handler_solution_with_empty_url_returns_bad_request() {
        let mut sol = fixtures::solution_model();
        sol.original_url = Some(String::new());
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[sol]])
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let state = test_app_state(db);

        let dto = handlers::TestAnalyzeLinkDto {
            solution_id: fixtures::test_uuid(3),
        };
        let result = handlers::test_analyze_link(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    // ── test_full_integration_flow handler: metadata extraction fails fast ──
    #[tokio::test]
    async fn test_full_integration_handler_og_extraction_fails() {
        // AI gRPC unavailable → OG extract fails → InternalError
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = handlers::FullIntegrationTestDto {
            url: "https://example.com/p".to_string(),
        };
        let result = handlers::test_full_integration_flow(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    // ── convert_affiliate with empty URL ──
    #[tokio::test]
    async fn convert_affiliate_handler_empty_url() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ConvertAffiliateDto { url: String::new() };
        let result = handlers::convert_affiliate(State(state), Json(dto)).await;
        assert!(result.is_ok());
        let resp = result.unwrap().0;
        assert_eq!(resp.original_url, "");
        assert!(resp.affiliate_url.contains("affiliate.example.com"));
    }

    // ── router smoke ──
    #[test]
    fn router_builds_successfully() {
        let config = crate::tests::helpers::test_config();
        let _router = handlers::router(config);
    }

    // ── extract_metadata with various inputs ──
    #[tokio::test]
    async fn extract_metadata_handler_http_url() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ExtractMetadataDto {
            url: "http://plain.example.com/path".to_string(),
        };
        let result = handlers::extract_metadata(State(state), Json(dto)).await;
        // gRPC unavailable → InternalError
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    #[tokio::test]
    async fn extract_metadata_handler_empty_url() {
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);

        let dto = ExtractMetadataDto { url: String::new() };
        let result = handlers::extract_metadata(State(state), Json(dto)).await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }
}
