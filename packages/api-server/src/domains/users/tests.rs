//! Users domain tests
//!
//! 사용자 도메인 관련 단위 테스트 및 통합 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod mock_db_tests {
    use crate::domains::users::service;
    use crate::tests::fixtures;
    use sea_orm::{DatabaseBackend, MockDatabase};

    #[tokio::test]
    async fn get_user_by_id_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let result = service::get_user_by_id(&db, fixtures::test_uuid(10)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().username, "testuser");
    }

    #[tokio::test]
    async fn get_user_by_id_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let result = service::get_user_by_id(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn update_user_profile_success() {
        use crate::domains::users::dto::UpdateUserDto;

        let mut updated = fixtures::user_model();
        updated.display_name = Some("New Name".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::user_model()]])
            .append_query_results([[updated.clone()]])
            .into_connection();
        let dto = UpdateUserDto {
            display_name: Some("New Name".to_string()),
            avatar_url: None,
            bio: None,
        };
        let result = service::update_user_profile(&db, fixtures::test_uuid(10), dto).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn update_user_profile_user_not_found() {
        use crate::domains::users::dto::UpdateUserDto;

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let dto = UpdateUserDto {
            display_name: Some("X".to_string()),
            avatar_url: None,
            bio: None,
        };
        let result = service::update_user_profile(&db, fixtures::test_uuid(99), dto).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn get_user_stats_success() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::user_model()]])
            .into_connection();
        let result = service::get_user_stats(&db, fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let stats = result.unwrap();
        assert_eq!(stats.user_id, fixtures::test_uuid(10));
        assert_eq!(stats.total_points, 100);
        assert_eq!(stats.rank, "user");
        assert_eq!(stats.total_posts, 0);
        assert_eq!(stats.total_comments, 0);
        assert_eq!(stats.total_likes_received, 0);
    }

    #[tokio::test]
    async fn get_user_stats_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let result = service::get_user_stats(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn list_user_activities_returns_empty_stub() {
        // Service currently returns an empty stub — no DB call.
        let db = crate::tests::helpers::empty_mock_db();
        let pagination = crate::utils::pagination::Pagination::new(1, 20);
        let result =
            service::list_user_activities(&db, fixtures::test_uuid(10), None, pagination).await;
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
        assert_eq!(resp.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn list_my_tries_empty() {
        // 1st query: count → 0
        // 2nd query: tryon history list → empty
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(0)]])
            .append_query_results([Vec::<crate::entities::user_tryon_history::Model>::new()])
            .into_connection();
        let pagination = crate::utils::pagination::Pagination::new(1, 20);
        let result = service::list_my_tries(&db, fixtures::test_uuid(10), pagination).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert!(resp.data.is_empty());
        assert_eq!(resp.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn list_my_tries_with_data() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::count_row(1)]])
            .append_query_results([[fixtures::try_history_model()]])
            .into_connection();
        let pagination = crate::utils::pagination::Pagination::new(1, 20);
        let result = service::list_my_tries(&db, fixtures::test_uuid(10), pagination).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.data.len(), 1);
        assert_eq!(resp.pagination.total_items, 1);
        assert_eq!(resp.data[0].image_url, "https://example.com/tryon.webp");
    }

    #[tokio::test]
    async fn get_user_with_follow_counts_success() {
        // get_user_by_id + count_followers (raw SQL) + count_following (raw SQL)
        let mk_cnt = |n: i64| {
            let mut m = std::collections::BTreeMap::new();
            m.insert("cnt".to_string(), sea_orm::Value::BigInt(Some(n)));
            m
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([[fixtures::user_model()]])
            .append_query_results([[mk_cnt(5)]])
            .append_query_results([[mk_cnt(7)]])
            .into_connection();
        let result = service::get_user_with_follow_counts(&db, fixtures::test_uuid(10)).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let resp = result.unwrap();
        assert_eq!(resp.followers_count, 5);
        assert_eq!(resp.following_count, 7);
        assert_eq!(resp.username, "testuser");
    }

    #[tokio::test]
    async fn get_user_with_follow_counts_not_found() {
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .into_connection();
        let result = service::get_user_with_follow_counts(&db, fixtures::test_uuid(99)).await;
        assert!(matches!(result, Err(crate::AppError::NotFound(_))));
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod unit_tests {
    use super::super::dto::{UpdateUserDto, UserActivitiesQuery, UserActivityType};

    #[test]
    fn test_update_user_dto_partial_update() {
        // 일부 필드만 업데이트
        let dto = UpdateUserDto {
            display_name: Some("New Name".to_string()),
            avatar_url: None,
            bio: None,
        };

        assert_eq!(dto.display_name, Some("New Name".to_string()));
        assert!(dto.avatar_url.is_none());
        assert!(dto.bio.is_none());
    }

    #[test]
    fn test_update_user_dto_all_fields() {
        // 모든 필드 업데이트
        let dto = UpdateUserDto {
            display_name: Some("Display Name".to_string()),
            avatar_url: Some("https://example.com/avatar.jpg".to_string()),
            bio: Some("Bio text".to_string()),
        };

        assert_eq!(dto.display_name, Some("Display Name".to_string()));
        assert_eq!(
            dto.avatar_url,
            Some("https://example.com/avatar.jpg".to_string())
        );
        assert_eq!(dto.bio, Some("Bio text".to_string()));
    }

    #[test]
    fn test_user_activity_type_serialization() {
        // snake_case로 직렬화되는지 확인
        let post_type = UserActivityType::Post;
        let spot_type = UserActivityType::Spot;
        let solution_type = UserActivityType::Solution;

        // enum 자체는 직렬화 테스트는 serde_json으로 해야 하지만,
        // 여기서는 타입이 올바른지 확인
        match post_type {
            UserActivityType::Post => {}
            _ => panic!("Expected Post"),
        }

        match spot_type {
            UserActivityType::Spot => {}
            _ => panic!("Expected Spot"),
        }

        match solution_type {
            UserActivityType::Solution => {}
            _ => panic!("Expected Solution"),
        }
    }

    #[test]
    fn test_user_activities_query_default() {
        // 쿼리 파라미터 기본값 테스트
        let query: UserActivitiesQuery = serde_json::from_str("{}").unwrap();
        assert!(query.activity_type.is_none());
        assert_eq!(query.pagination.page, 1);
        assert_eq!(query.pagination.per_page, 20);
    }

    #[test]
    fn test_user_activities_query_with_type() {
        // 타입 필터 포함 쿼리
        let query: UserActivitiesQuery = serde_json::from_str(r#"{"type": "post"}"#).unwrap();
        match query.activity_type {
            Some(UserActivityType::Post) => {}
            _ => panic!("Expected Post type"),
        }
    }

    #[test]
    fn test_user_activities_query_with_pagination() {
        // 페이지네이션 포함 쿼리
        let query: UserActivitiesQuery =
            serde_json::from_str(r#"{"page": 2, "per_page": 50}"#).unwrap();
        assert_eq!(query.pagination.page, 2);
        assert_eq!(query.pagination.per_page, 50);
    }

    #[test]
    fn test_user_activities_query_full() {
        // 전체 파라미터 포함 쿼리
        let query: UserActivitiesQuery =
            serde_json::from_str(r#"{"type": "solution", "page": 3, "per_page": 30}"#).unwrap();
        match query.activity_type {
            Some(UserActivityType::Solution) => {}
            _ => panic!("Expected Solution type"),
        }
        assert_eq!(query.pagination.page, 3);
        assert_eq!(query.pagination.per_page, 30);
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod service_tests {
    use super::super::dto::UpdateUserDto;
    use crate::utils::pagination::Pagination;
    use uuid::Uuid;

    #[tokio::test]
    #[ignore] // 실제 DB 필요 - 통합 테스트에서 실행
    async fn test_get_user_by_id_success() {
        // 실제 DB 연결 필요 - 통합 테스트로 이동
        // let db = create_mock_db().await.unwrap();
        // let user_id = Uuid::new_v4();
        // let result = service::get_user_by_id(&db, user_id).await;
        // assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore] // 실제 DB 필요 - 통합 테스트에서 실행
    async fn test_get_user_by_id_not_found() {
        // 실제 DB 연결 필요 - 통합 테스트로 이동
        // let db = create_mock_db().await.unwrap();
        // let non_existent_id = Uuid::new_v4();
        // let result = service::get_user_by_id(&db, non_existent_id).await;
        // assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[test]
    fn test_update_user_dto_validation() {
        // 빈 DTO도 유효함 (모든 필드가 Option)
        let empty_dto = UpdateUserDto {
            display_name: None,
            avatar_url: None,
            bio: None,
        };
        assert!(empty_dto.display_name.is_none());
        assert!(empty_dto.avatar_url.is_none());
        assert!(empty_dto.bio.is_none());

        // 일부 필드만 설정
        let partial_dto = UpdateUserDto {
            display_name: Some("Test".to_string()),
            avatar_url: None,
            bio: None,
        };
        assert_eq!(partial_dto.display_name, Some("Test".to_string()));
    }

    #[test]
    fn test_user_stats_response_structure() {
        use super::super::dto::UserStatsResponse;

        let stats = UserStatsResponse {
            user_id: Uuid::new_v4(),
            total_posts: 10,
            total_comments: 5,
            total_likes_received: 20,
            total_points: 100,
            rank: "Contributor".to_string(),
        };

        assert_eq!(stats.total_posts, 10);
        assert_eq!(stats.total_comments, 5);
        assert_eq!(stats.total_likes_received, 20);
        assert_eq!(stats.total_points, 100);
        assert_eq!(stats.rank, "Contributor");
    }

    #[test]
    fn test_pagination_default() {
        let pagination = Pagination::default();
        assert_eq!(pagination.page, 1);
        assert_eq!(pagination.per_page, 20);
        assert_eq!(pagination.offset(), 0);
        assert_eq!(pagination.limit(), 20);
    }

    #[test]
    fn test_pagination_custom() {
        let pagination = Pagination::new(3, 50);
        assert_eq!(pagination.page, 3);
        assert_eq!(pagination.per_page, 50);
        assert_eq!(pagination.offset(), 100); // (3-1) * 50
        assert_eq!(pagination.limit(), 50);
    }

    #[test]
    fn test_pagination_bounds() {
        // 페이지는 최소 1
        let pagination = Pagination::new(0, 10);
        assert_eq!(pagination.page, 1);

        // per_page는 1-100 사이로 제한
        let pagination = Pagination::new(1, 0);
        assert_eq!(pagination.per_page, 1);

        let pagination = Pagination::new(1, 200);
        assert_eq!(pagination.per_page, 100);
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod dto_conversion_tests {
    use crate::domains::users::dto::UserResponse;
    use crate::tests::fixtures::*;
    use validator::Validate;

    #[test]
    fn user_model_to_user_response_conversion() {
        let model = user_model();
        let response: UserResponse = model.clone().into();
        assert_eq!(response.id, model.id);
        assert_eq!(response.email, "test@example.com");
        assert_eq!(response.username, "testuser");
        assert_eq!(response.display_name, Some("Test User".to_string()));
        assert_eq!(response.rank, "user");
        assert_eq!(response.total_points, 100);
        assert!(!response.is_admin);
        // From impl sets these to 0 (no DB query for counts)
        assert_eq!(response.followers_count, 0);
        assert_eq!(response.following_count, 0);
    }

    #[test]
    fn admin_user_model_to_response() {
        let model = admin_user_model();
        let response: UserResponse = model.into();
        assert!(response.is_admin);
        assert_eq!(response.rank, "admin");
    }

    #[test]
    fn user_response_serializes_to_json() {
        let response: UserResponse = user_model().into();
        let v = serde_json::to_value(&response).unwrap();
        assert!(v["id"].is_string());
        assert_eq!(v["username"], "testuser");
        assert_eq!(v["total_points"], 100);
    }

    #[test]
    fn update_user_dto_validation_max_lengths() {
        use super::super::dto::UpdateUserDto;

        // display_name max 200
        let long_name = "a".repeat(201);
        let dto = UpdateUserDto {
            display_name: Some(long_name),
            avatar_url: None,
            bio: None,
        };
        assert!(dto.validate().is_err());

        // avatar_url max 2048
        let long_url = format!("https://example.com/{}", "a".repeat(2040));
        let dto = UpdateUserDto {
            display_name: None,
            avatar_url: Some(long_url),
            bio: None,
        };
        assert!(dto.validate().is_err());

        // bio max 2000
        let long_bio = "b".repeat(2001);
        let dto = UpdateUserDto {
            display_name: None,
            avatar_url: None,
            bio: Some(long_bio),
        };
        assert!(dto.validate().is_err());

        // all within limits
        let dto = UpdateUserDto {
            display_name: Some("OK".to_string()),
            avatar_url: Some("https://example.com/avatar.jpg".to_string()),
            bio: Some("Short bio".to_string()),
        };
        assert!(dto.validate().is_ok());
    }
}
