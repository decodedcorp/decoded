//! Posts 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::posts::dto::*;
    use crate::domains::posts::service::{compute_search_fields, PostRelatedData};
    use crate::tests::fixtures::*;
    use serde_json::json;
    use std::collections::HashMap;
    use validator::Validate;

    // ── MediaSourceDto ──

    #[test]
    fn media_source_dto_serializes_type_alias() {
        let m = MediaSourceDto {
            media_type: "drama".to_string(),
            description: Some("설명".to_string()),
        };
        let v = serde_json::to_value(&m).unwrap();
        assert_eq!(v["type"], "drama");
    }

    #[test]
    fn media_source_dto_roundtrips() {
        let v = json!({"type": "movie", "description": null});
        let m: MediaSourceDto = serde_json::from_value(v).unwrap();
        assert_eq!(m.media_type, "movie");
        assert!(m.description.is_none());
    }

    #[test]
    fn media_source_dto_helper_methods() {
        let m = MediaSourceDto {
            media_type: "mv".to_string(),
            description: Some("desc".to_string()),
        };
        assert_eq!(m.media_type(), "mv");
        assert_eq!(m.description(), Some("desc"));

        let m2 = MediaSourceDto {
            media_type: "drama".to_string(),
            description: None,
        };
        assert_eq!(m2.description(), None);
    }

    // ── extract_media_source_from_model ──

    #[test]
    fn extract_media_source_from_model_uses_media_type() {
        let post = post_model();
        let ms = extract_media_source_from_model(&post);
        assert_eq!(ms.media_type(), "drama");
        assert!(ms.description().is_none());
    }

    // ── PostModel → PostResponse ──

    #[test]
    fn post_model_to_post_response_conversion() {
        let model = post_model();
        let response: PostResponse = model.clone().into();
        assert_eq!(response.id, model.id);
        assert_eq!(response.user_id, model.user_id);
        assert_eq!(response.image_url, model.image_url);
        assert_eq!(response.view_count, 42);
        assert_eq!(response.status, "active");
        assert_eq!(response.image_width, Some(1080));
        assert_eq!(response.image_height, Some(1920));
        assert!(response.parent_post_id.is_none());
        assert!(response.post_type.is_none());
    }

    #[test]
    fn post_model_to_response_preserves_optional_fields() {
        let mut model = post_model();
        model.title = None;
        model.group_name = None;
        model.artist_name = None;
        model.context = None;
        let response: PostResponse = model.into();
        assert!(response.title.is_none());
        assert!(response.group_name.is_none());
        assert!(response.artist_name.is_none());
        assert!(response.context.is_none());
    }

    // ── PostDetailResponse::from_post_model ──

    #[test]
    fn post_detail_response_from_models() {
        let post = post_model();
        let user = user_model();
        let ms = MediaSourceDto {
            media_type: "drama".to_string(),
            description: None,
        };
        let detail = PostDetailResponse::from_post_model(
            post.clone(),
            user.clone(),
            ms,
            Some(vec![]),
            5,
            10,
            Some(true),
            Some(false),
        );
        assert_eq!(detail.id, post.id);
        assert_eq!(detail.user.id, user.id);
        assert_eq!(detail.user.username, "testuser");
        assert_eq!(detail.comment_count, 5);
        assert_eq!(detail.like_count, 10);
        assert_eq!(detail.user_has_liked, Some(true));
        assert_eq!(detail.user_has_saved, Some(false));
        assert!(detail.spots.is_empty());
        assert!(
            detail.artist_profile_image_url.is_none(),
            "from_post_model sets profile images to None by default"
        );
        assert!(detail.group_profile_image_url.is_none());
    }

    #[test]
    fn post_detail_response_profile_images_can_be_set_after_construction() {
        let mut detail = PostDetailResponse::from_post_model(
            post_model(),
            user_model(),
            MediaSourceDto {
                media_type: "mv".to_string(),
                description: None,
            },
            None,
            0,
            0,
            None,
            None,
        );
        detail.artist_profile_image_url = Some("https://img/artist.jpg".into());
        detail.group_profile_image_url = Some("https://img/group.jpg".into());
        assert_eq!(
            detail.artist_profile_image_url.as_deref(),
            Some("https://img/artist.jpg")
        );
        assert_eq!(
            detail.group_profile_image_url.as_deref(),
            Some("https://img/group.jpg")
        );
    }

    #[test]
    fn post_detail_response_none_spots_becomes_empty_vec() {
        let detail = PostDetailResponse::from_post_model(
            post_model(),
            user_model(),
            MediaSourceDto {
                media_type: "mv".to_string(),
                description: None,
            },
            None,
            0,
            0,
            None,
            None,
        );
        assert!(detail.spots.is_empty());
        assert!(detail.user_has_liked.is_none());
        assert!(detail.user_has_saved.is_none());
    }

    // ── compute_search_fields ──

    #[test]
    fn compute_search_fields_empty_data() {
        let data = PostRelatedData {
            spots: vec![],
            solutions: vec![],
            subcategories: vec![],
            categories: vec![],
            brand_logos: HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert!(fields.category_codes.is_empty());
        assert!(!fields.has_adopted_solution);
        assert_eq!(fields.solution_count, 0);
        assert_eq!(fields.spot_count, 0);
    }

    #[test]
    fn compute_search_fields_with_spots_and_categories() {
        let data = PostRelatedData {
            spots: vec![spot_model()],
            solutions: vec![solution_model()],
            subcategories: vec![subcategory_model()],
            categories: vec![category_model()],
            brand_logos: HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert_eq!(fields.spot_count, 1);
        assert_eq!(fields.solution_count, 1);
        assert!(!fields.has_adopted_solution);
        assert!(fields.category_codes.contains(&"fashion".to_string()));
    }

    #[test]
    fn compute_search_fields_adopted_solution() {
        let mut sol = solution_model();
        sol.is_adopted = true;
        let data = PostRelatedData {
            spots: vec![spot_model()],
            solutions: vec![sol],
            subcategories: vec![],
            categories: vec![],
            brand_logos: HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert!(fields.has_adopted_solution);
    }

    #[test]
    fn compute_search_fields_spot_without_subcategory() {
        let mut spot = spot_model();
        spot.subcategory_id = None;
        let data = PostRelatedData {
            spots: vec![spot],
            solutions: vec![],
            subcategories: vec![subcategory_model()],
            categories: vec![category_model()],
            brand_logos: HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert!(fields.category_codes.is_empty());
    }

    #[test]
    fn compute_search_fields_multiple_spots_distinct_categories() {
        let mut spot2 = spot_model();
        spot2.id = test_uuid(22);
        // same subcategory_id → should still yield one category code
        let data = PostRelatedData {
            spots: vec![spot_model(), spot2],
            solutions: vec![],
            subcategories: vec![subcategory_model()],
            categories: vec![category_model()],
            brand_logos: HashMap::new(),
        };
        let fields = compute_search_fields(&data);
        assert_eq!(fields.category_codes.len(), 1);
        assert_eq!(fields.spot_count, 2);
    }

    // ── CreatePostDto validation ──

    #[test]
    fn create_post_dto_validates_spots_required() {
        let dto = CreatePostDto {
            image_url: "https://cdn.test.com/img.webp".to_string(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![],
        };
        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_post_dto_validates_media_type_required() {
        let dto = CreatePostDto {
            image_url: "https://cdn.test.com/img.webp".to_string(),
            media_source: MediaSourceDto {
                media_type: "".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        assert!(dto.validate().is_err());
    }

    #[test]
    fn create_post_dto_image_dimensions_validation() {
        let make_dto = |w: Option<i32>, h: Option<i32>| CreatePostDto {
            image_url: "https://cdn.test.com/img.webp".to_string(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: w,
            image_height: h,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        assert!(make_dto(Some(1080), Some(1920)).validate().is_ok());
        assert!(make_dto(Some(0), Some(100)).validate().is_err());
        assert!(make_dto(Some(20001), Some(100)).validate().is_err());
        assert!(make_dto(None, None).validate().is_ok());
    }

    // ── PostResponse serialization ──

    #[test]
    fn post_response_serializes_to_json() {
        let response: PostResponse = post_model().into();
        let v = serde_json::to_value(&response).unwrap();
        assert!(v["id"].is_string());
        assert!(v["created_at"].is_string());
        assert_eq!(v["view_count"], 42);
    }

    #[test]
    fn post_response_skips_none_optional_fields() {
        let mut model = post_model();
        model.title = None;
        model.parent_post_id = None;
        let response: PostResponse = model.into();
        let v = serde_json::to_value(&response).unwrap();
        assert!(v.get("title").is_none() || v["title"].is_null());
    }

    // ── Handler tests (Path/Query/State extractors) ──

    #[tokio::test]
    async fn get_post_handler_not_found_when_db_empty() {
        use crate::domains::posts::handlers::get_post;
        use crate::error::AppError;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // increment_view_count → get_post_by_id → empty (its error is ignored via `let _`)
        // Then get_post_detail → get_post_by_id → empty → NotFound
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let result = get_post(State(state), Path(test_uuid(99)), None).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn list_posts_handler_returns_empty_paginated() {
        use crate::domains::posts::dto::PostListQuery;
        use crate::domains::posts::handlers::list_posts;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // list_posts query chain:
        // 1) total count (paginator)
        // 2) posts list (empty)
        // 3) users batch
        // 4) spot counts (group by)
        // 5) comment counts (group by)
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "recent".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
        };

        let response = list_posts(State(state), Query(query))
            .await
            .expect("list_posts ok");
        let body = response.0;
        assert!(body.data.is_empty());
        assert_eq!(body.pagination.total_items, 0);
    }

    #[tokio::test]
    async fn count_tries_handler_returns_zero() {
        use crate::domains::posts::handlers::count_tries;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .into_connection();
        let state = test_app_state(db);

        let response = count_tries(State(state), Path(test_uuid(1)))
            .await
            .expect("count_tries ok");
        assert_eq!(response.0.count, 0);
    }

    #[tokio::test]
    async fn count_tries_handler_returns_actual_count() {
        use crate::domains::posts::handlers::count_tries;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(7)]])
            .into_connection();
        let state = test_app_state(db);

        let response = count_tries(State(state), Path(test_uuid(1)))
            .await
            .expect("count_tries ok");
        assert_eq!(response.0.count, 7);
    }

    #[tokio::test]
    async fn list_tries_handler_empty_returns_empty_response() {
        use crate::domains::posts::dto::TryListQuery;
        use crate::domains::posts::handlers::list_tries;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let q = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let response = list_tries(State(state), Path(test_uuid(1)), Query(q))
            .await
            .expect("list_tries ok");
        assert!(response.0.tries.is_empty());
        assert_eq!(response.0.total, 0);
    }

    #[tokio::test]
    async fn list_tries_by_spot_handler_no_tags_returns_empty() {
        use crate::domains::posts::dto::TryListQuery;
        use crate::domains::posts::handlers::list_tries_by_spot;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::try_spot_tags::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let q = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let response = list_tries_by_spot(State(state), Path(test_uuid(2)), Query(q))
            .await
            .expect("list_tries_by_spot ok");
        assert!(response.0.tries.is_empty());
        assert_eq!(response.0.total, 0);
    }

    #[tokio::test]
    async fn update_post_handler_forbidden_when_not_owner() {
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::domains::posts::handlers::update_post;
        use crate::error::AppError;
        use crate::tests::helpers::{mock_user_with_id, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]])
            .into_connection();
        let state = test_app_state(db);

        let other = mock_user_with_id(test_uuid(50));
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };

        let result = update_post(
            State(state),
            Extension(other),
            Path(post_model().id),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn update_post_handler_not_found_when_post_missing() {
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::domains::posts::handlers::update_post;
        use crate::error::AppError;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };

        let result = update_post(
            State(state),
            Extension(mock_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn delete_post_handler_forbidden_when_not_owner() {
        use crate::domains::posts::handlers::delete_post;
        use crate::error::AppError;
        use crate::tests::helpers::{mock_user_with_id, test_app_state};
        use axum::extract::{Path, State};
        use axum::Extension;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]])
            .into_connection();
        let state = test_app_state(db);

        let other = mock_user_with_id(test_uuid(50));
        let result = delete_post(State(state), Extension(other), Path(post_model().id)).await;
        assert!(matches!(result, Err(AppError::Forbidden(_))));
    }

    #[tokio::test]
    async fn delete_post_handler_not_found_when_missing() {
        use crate::domains::posts::handlers::delete_post;
        use crate::error::AppError;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::Extension;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let result = delete_post(State(state), Extension(mock_user()), Path(test_uuid(1))).await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    // ── ImageUploadResponse ──

    #[test]
    fn image_upload_response_serialization() {
        let r = ImageUploadResponse {
            image_url: "https://cdn.test.com/posts/uuid/img.webp".to_string(),
            image_width: None,
            image_height: None,
        };
        let v = serde_json::to_value(&r).unwrap();
        assert_eq!(v["image_url"], "https://cdn.test.com/posts/uuid/img.webp");
    }

    // ── Additional handler coverage (MockDatabase) ──

    #[tokio::test]
    async fn get_post_handler_success_no_user() {
        use crate::domains::posts::handlers::get_post;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // increment_view_count + view_log are now in tokio::spawn (background, not awaited).
        // Handler only awaits get_post_detail. With a shared MockDatabase, the spawned
        // task may consume mock rows unpredictably, so we provide enough results for both
        // the background task and the main path.
        //
        // get_post_detail (parallelized, empty spots, no user):
        //   1) get_post_by_id
        //   2a) get_user_by_id
        //   2b) spots (empty)
        //   2c) count_likes_by_post_id
        //   3) count_tries
        //
        // Background task (may or may not consume from same mock):
        //   - increment_view_count: get_post_by_id + update
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // detail: get_post_by_id
            .append_query_results([vec![user_model()]]) // detail: get_user_by_id
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots
            .append_query_results([vec![count_row(0)]]) // count_likes_by_post_id
            .append_query_results([vec![count_row(0)]]) // count_tries
            // Extra rows for background increment_view_count (best-effort)
            .append_query_results([vec![post_model()]]) // inc: find
            .append_query_results([vec![post_model()]]) // inc: update
            .into_connection();
        let state = test_app_state(db);

        let result = get_post(State(state), Path(test_uuid(1)), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let body = result.unwrap().0;
        assert_eq!(body.id, test_uuid(1));
    }

    #[tokio::test]
    async fn list_posts_handler_with_filters_popular_sort() {
        use crate::domains::posts::dto::PostListQuery;
        use crate::domains::posts::handlers::list_posts;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let query = PostListQuery {
            artist_name: Some("Jennie".to_string()),
            group_name: Some("BP".to_string()),
            context: Some("airport".to_string()),
            category: None,
            user_id: Some(test_uuid(10)),
            artist_id: Some(test_uuid(20)),
            group_id: Some(test_uuid(30)),
            sort: "popular".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: Some(true),
        };

        let response = list_posts(State(state), Query(query))
            .await
            .expect("list_posts ok");
        assert!(response.0.data.is_empty());
    }

    #[tokio::test]
    async fn list_posts_handler_trending_sort() {
        use crate::domains::posts::dto::PostListQuery;
        use crate::domains::posts::handlers::list_posts;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let state = test_app_state(db);

        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "trending".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
        };

        let response = list_posts(State(state), Query(query))
            .await
            .expect("list_posts ok");
        assert!(response.0.data.is_empty());
    }

    #[tokio::test]
    async fn update_post_handler_success_owner() {
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::domains::posts::handlers::update_post;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = post_model();
        updated.artist_name = Some("NewArtist".to_string());
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // get_post_by_id
            .append_query_results([vec![updated.clone()]]) // update returns
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // related data spots
            .into_connection();
        let state = test_app_state(db);

        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: Some("NewArtist".to_string()),
            context: None,
            status: None,
        };

        let result = update_post(
            State(state),
            Extension(mock_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert_eq!(result.unwrap().0.artist_name.as_deref(), Some("NewArtist"));
    }

    #[tokio::test]
    async fn delete_post_handler_success_owner() {
        use crate::domains::posts::handlers::delete_post;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::Extension;
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // get_post_by_id
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }]) // delete
            .into_connection();
        let state = test_app_state(db);

        let result = delete_post(State(state), Extension(mock_user()), Path(post_model().id)).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), axum::http::StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn list_tries_handler_with_populated_posts() {
        use crate::domains::posts::dto::TryListQuery;
        use crate::domains::posts::handlers::list_tries;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        // list_tries: count → posts.all → users → try_spot_tags
        let mut try_post = post_model();
        try_post.id = test_uuid(50);
        try_post.post_type = Some("try".to_string());
        try_post.parent_post_id = Some(test_uuid(1));

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(1)]]) // count
            .append_query_results([vec![try_post.clone()]]) // posts
            .append_query_results([vec![user_model()]]) // users
            .append_query_results([Vec::<crate::entities::try_spot_tags::Model>::new()]) // tags
            .into_connection();
        let state = test_app_state(db);

        let q = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let response = list_tries(State(state), Path(test_uuid(1)), Query(q))
            .await
            .expect("list_tries ok");
        assert_eq!(response.0.total, 1);
        assert_eq!(response.0.tries.len(), 1);
        assert_eq!(response.0.tries[0].id, test_uuid(50));
    }

    #[tokio::test]
    async fn count_tries_handler_db_error_propagates() {
        use crate::domains::posts::handlers::count_tries;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("boom".into())])
            .into_connection();
        let state = test_app_state(db);

        let result = count_tries(State(state), Path(test_uuid(1))).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_tries_by_spot_handler_with_tagged_posts() {
        use crate::domains::posts::dto::TryListQuery;
        use crate::domains::posts::handlers::list_tries_by_spot;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut try_post = post_model();
        try_post.id = test_uuid(50);
        try_post.post_type = Some("try".to_string());

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![uuid_row("try_post_id", test_uuid(50))]]) // tag query (into_tuple<Uuid>)
            .append_query_results([vec![count_row(1)]]) // count
            .append_query_results([vec![try_post]]) // posts
            .append_query_results([vec![user_model()]]) // users
            .append_query_results([Vec::<crate::entities::try_spot_tags::Model>::new()]) // all_tags
            .into_connection();
        let state = test_app_state(db);

        let q = TryListQuery {
            page: 1,
            per_page: 20,
        };
        let response = list_tries_by_spot(State(state), Path(test_uuid(2)), Query(q))
            .await
            .expect("list_tries_by_spot ok");
        assert_eq!(response.0.total, 1);
        assert_eq!(response.0.tries.len(), 1);
    }

    #[tokio::test]
    async fn update_post_handler_db_error_propagates() {
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::domains::posts::handlers::update_post;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_errors(vec![sea_orm::DbErr::Custom("db down".into())])
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };
        let result = update_post(
            State(state),
            Extension(mock_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(result.is_err());
    }

    // ── create_post_without_solutions / create_post_with_solutions service tests ──

    #[tokio::test]
    async fn create_post_without_solutions_upload_fails_on_bad_content_type() {
        use crate::domains::posts::service::create_post_without_solutions;
        use crate::error::AppError;
        use crate::tests::helpers::{empty_mock_db, test_app_state};

        let state = test_app_state(empty_mock_db());
        let dto = CreatePostDto {
            image_url: String::new(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        let result = create_post_without_solutions(
            &state,
            test_uuid(10),
            vec![1, 2, 3],
            "image/bmp", // unsupported
            dto,
        )
        .await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_post_with_solutions_upload_fails_on_bad_content_type() {
        use crate::domains::posts::service::create_post_with_solutions;
        use crate::error::AppError;
        use crate::tests::helpers::{empty_mock_db, test_app_state};

        let state = test_app_state(empty_mock_db());
        let dto = CreatePostDto {
            image_url: String::new(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        let result = create_post_with_solutions(
            &state,
            test_uuid(10),
            vec![1, 2, 3],
            "application/octet-stream",
            dto,
        )
        .await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn create_post_without_solutions_fails_when_system_category_missing() {
        // Upload succeeds. Then resolve_uncategorized_subcategory_id:
        //   query 1: system category → empty → InternalError
        use crate::domains::posts::service::create_post_without_solutions;
        use crate::error::AppError;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::categories::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let dto = CreatePostDto {
            image_url: String::new(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        let result =
            create_post_without_solutions(&state, test_uuid(10), vec![0u8; 4], "image/png", dto)
                .await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    #[tokio::test]
    async fn create_post_with_solutions_fails_when_system_category_missing() {
        use crate::domains::posts::dto::CreateSolutionInlineDto;
        use crate::domains::posts::service::create_post_with_solutions;
        use crate::error::AppError;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::categories::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let dto = CreatePostDto {
            image_url: String::new(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![CreateSolutionInlineDto {
                    original_url: "https://example.com/p".to_string(),
                    title: Some("t".to_string()),
                    description: None,
                    metadata: None,
                    comment: None,
                    thumbnail_url: None,
                    brand_id: None,
                }],
            }],
        };
        let result =
            create_post_with_solutions(&state, test_uuid(10), vec![0u8; 4], "image/webp", dto)
                .await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    #[tokio::test]
    async fn create_post_without_solutions_fails_when_uncategorized_subcategory_missing() {
        // System category found, but uncategorized subcategory missing → InternalError.
        use crate::domains::posts::service::create_post_without_solutions;
        use crate::error::AppError;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::category_model()]]) // system category
            .append_query_results([Vec::<crate::entities::subcategories::Model>::new()]) // uncategorized subcategory
            .into_connection();
        let state = test_app_state(db);
        let dto = CreatePostDto {
            image_url: String::new(),
            media_source: MediaSourceDto {
                media_type: "drama".to_string(),
                description: None,
            },
            metadata: None,
            group_name: None,
            group_id: None,
            artist_name: None,
            artist_id: None,
            context: None,
            image_width: None,
            image_height: None,
            spots: vec![CreateSpotDto {
                position_left: "10".to_string(),
                position_top: "20".to_string(),
                subcategory_id: None,
                solutions: vec![],
            }],
        };
        let result =
            create_post_without_solutions(&state, test_uuid(10), vec![0u8; 4], "image/jpeg", dto)
                .await;
        assert!(matches!(result, Err(AppError::InternalError(_))));
    }

    // ── create_try_post: upload fails before parent lookup? No — parent lookup first ──

    #[tokio::test]
    async fn create_try_post_upload_fails_when_unsupported_content_type() {
        use crate::domains::posts::dto::CreateTryPostDto;
        use crate::domains::posts::service::create_try_post;
        use crate::error::AppError;
        use crate::tests::fixtures;
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Parent lookup succeeds (non-try), no spot_ids → skip count, then upload (bad content).
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![fixtures::post_model()]]) // parent
            .into_connection();
        let state = test_app_state(db);
        let dto = CreateTryPostDto {
            parent_post_id: test_uuid(1),
            media_title: None,
            spot_ids: vec![],
        };
        let result = create_try_post(&state, test_uuid(10), vec![1, 2, 3], "video/mp4", dto).await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    // ── get_post handler with logged-in user (Some(Extension(user))) branch ──

    #[tokio::test]
    async fn get_post_handler_success_with_logged_in_user() {
        use crate::domains::posts::handlers::get_post;
        use crate::tests::helpers::{mock_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::Extension;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // Background tasks (tokio::spawn): increment_view_count + create_view_log
        // Main path: get_post_detail (parallelized, empty spots, with user_id):
        //   1) get_post_by_id
        //   2a) get_user_by_id
        //   2b) spots (empty)
        //   2c) count_likes_by_post_id
        //   2d) user_has_liked
        //   2e) user_has_saved
        //   3) count_tries
        let existing_view_log = crate::entities::view_logs::Model {
            id: test_uuid(111),
            user_id: Some(test_uuid(10)),
            reference_type: "post".to_string(),
            reference_id: test_uuid(1),
            created_at: crate::tests::fixtures::test_timestamp(),
        };
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // detail: get_post_by_id
            .append_query_results([vec![user_model()]]) // detail: get_user_by_id
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots
            .append_query_results([vec![count_row(0)]]) // count_likes_by_post_id
            .append_query_results([Vec::<crate::entities::post_likes::Model>::new()]) // user_has_liked
            .append_query_results([Vec::<crate::entities::saved_posts::Model>::new()]) // user_has_saved
            .append_query_results([vec![count_row(0)]]) // count_tries
            // Extra rows for background tasks (best-effort)
            .append_query_results([vec![post_model()]]) // inc: find
            .append_query_results([vec![post_model()]]) // inc: update
            .append_query_results([vec![existing_view_log]]) // view_logs find → skip insert
            .into_connection();
        let state = test_app_state(db);
        let result = get_post(
            State(state),
            Path(test_uuid(1)),
            Some(Extension(mock_user())),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    // ── admin posts handler tests ──

    #[tokio::test]
    async fn admin_list_posts_handler_empty() {
        use crate::domains::admin::posts::{
            list_posts as admin_list_posts_handler, AdminPostListQuery,
        };
        use crate::domains::posts::dto::PostListQuery;
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Query, State};
        use axum::Extension;
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]]) // count
            .append_query_results([Vec::<crate::entities::posts::Model>::new()]) // posts
            .append_query_results([Vec::<crate::entities::users::Model>::new()]) // users
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spot_counts
            .append_query_results([Vec::<crate::entities::comments::Model>::new()]) // comment_counts
            .into_connection();
        let state = test_app_state(db);
        let query = AdminPostListQuery {
            status: Some("active".to_string()),
            base_query: PostListQuery {
                artist_name: None,
                group_name: None,
                context: None,
                category: None,
                user_id: None,
                artist_id: None,
                group_id: None,
                sort: "recent".to_string(),
                page: 1,
                per_page: 20,
                has_solutions: None,
                has_magazine: None,
            },
        };
        let result =
            admin_list_posts_handler(State(state), Extension(mock_admin_user()), Query(query))
                .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert!(result.unwrap().0.data.is_empty());
    }

    #[tokio::test]
    async fn admin_update_post_status_handler_invalid_status_rejected() {
        use crate::domains::admin::posts::{update_post_status, PostStatusUpdate};
        use crate::error::AppError;
        use crate::tests::helpers::{empty_mock_db, mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};

        let state = test_app_state(empty_mock_db());
        let dto = PostStatusUpdate {
            status: "bogus".to_string(),
        };
        let result = update_post_status(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn admin_update_post_status_handler_success_active() {
        use crate::domains::admin::posts::{update_post_status, PostStatusUpdate};
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = post_model();
        updated.status = "active".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // get_post_by_id
            .append_query_results([vec![updated]]) // update
            .into_connection();
        let state = test_app_state(db);
        let dto = PostStatusUpdate {
            status: "active".to_string(),
        };
        let result = update_post_status(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        assert_eq!(result.unwrap().0.status, "active");
    }

    #[tokio::test]
    async fn admin_update_post_status_handler_success_hidden() {
        use crate::domains::admin::posts::{update_post_status, PostStatusUpdate};
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = post_model();
        updated.status = "hidden".to_string();
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // get_post_by_id
            .append_query_results([vec![updated]]) // update
            .into_connection();
        let state = test_app_state(db);
        let dto = PostStatusUpdate {
            status: "hidden".to_string(),
        };
        let result = update_post_status(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().0.status, "hidden");
    }

    #[tokio::test]
    async fn admin_update_post_status_handler_not_found() {
        use crate::domains::admin::posts::{update_post_status, PostStatusUpdate};
        use crate::error::AppError;
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()]) // get_post_by_id
            .into_connection();
        let state = test_app_state(db);
        let dto = PostStatusUpdate {
            status: "hidden".to_string(),
        };
        let result = update_post_status(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[tokio::test]
    async fn admin_update_post_handler_success() {
        use crate::domains::admin::posts::admin_update_post;
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut updated = post_model();
        updated.artist_name = Some("NewArtist".to_string());
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post_model()]]) // get_post_by_id
            .append_query_results([vec![updated]]) // update
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots load
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: Some("NewGroup".to_string()),
            artist_name: Some("NewArtist".to_string()),
            context: Some("new context".to_string()),
            status: None,
        };
        let result = admin_update_post(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
    }

    #[tokio::test]
    async fn admin_update_post_handler_not_found() {
        use crate::domains::admin::posts::admin_update_post;
        use crate::domains::posts::dto::UpdatePostDto;
        use crate::error::AppError;
        use crate::tests::helpers::{mock_admin_user, test_app_state};
        use axum::extract::{Path, State};
        use axum::{Extension, Json};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let dto = UpdatePostDto {
            media_source: None,
            group_name: None,
            artist_name: None,
            context: None,
            status: None,
        };
        let result = admin_update_post(
            State(state),
            Extension(mock_admin_user()),
            Path(test_uuid(1)),
            Json(dto),
        )
        .await;
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    // ── list_posts handler: recent sort branch covered already, add oldest-fallback ──

    #[tokio::test]
    async fn list_posts_handler_unknown_sort_falls_back_to_recent() {
        use crate::domains::posts::dto::PostListQuery;
        use crate::domains::posts::handlers::list_posts;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Query, State};
        use sea_orm::{DatabaseBackend, MockDatabase};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![count_row(0)]])
            .append_query_results([Vec::<crate::entities::posts::Model>::new()])
            .append_query_results([Vec::<crate::entities::users::Model>::new()])
            .append_query_results([Vec::<crate::entities::spots::Model>::new()])
            .append_query_results([Vec::<crate::entities::comments::Model>::new()])
            .into_connection();
        let state = test_app_state(db);
        let query = PostListQuery {
            artist_name: None,
            group_name: None,
            context: None,
            category: None,
            user_id: None,
            artist_id: None,
            group_id: None,
            sort: "xxx-unknown".to_string(),
            page: 1,
            per_page: 20,
            has_solutions: None,
            has_magazine: None,
        };
        let response = list_posts(State(state), Query(query))
            .await
            .expect("list_posts ok");
        assert!(response.0.data.is_empty());
    }

    // ── Warehouse-sourced artist/group name (English-first fallback) ──
    //
    // get_post_detail은 posts.artist_name/group_name (비정규화 레거시 문자열)을 직접 내려주는
    // 대신, artist_id/group_id로 warehouse 테이블을 조회해 name_en → name_ko → legacy 순
    // fallback을 적용해야 한다. 아래 3개 테스트는 각 fallback 단계를 검증한다.

    fn post_model_with_warehouse_ids() -> crate::entities::posts::Model {
        let mut p = post_model();
        p.artist_id = Some(test_uuid(200));
        p.group_id = Some(test_uuid(201));
        p.artist_name = Some("Legacy Artist".to_string());
        p.group_name = Some("Legacy Group".to_string());
        p
    }

    /// 주어진 warehouse 옵션으로 get_post_handler_success_no_user 스타일의 mock DB를 구성.
    /// query 순서: post → user → spots(empty) → likes → warehouse_artists → warehouse_groups → count_tries
    ///             + background task(post find + update)
    fn build_get_post_mock_db_with_warehouse(
        post: crate::entities::posts::Model,
        warehouse_artist: Option<crate::entities::warehouse_artists::Model>,
        warehouse_group: Option<crate::entities::warehouse_groups::Model>,
    ) -> sea_orm::DatabaseConnection {
        use sea_orm::{DatabaseBackend, MockDatabase};

        let mut db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results([vec![post.clone()]]) // detail: get_post_by_id
            .append_query_results([vec![user_model()]]) // detail: get_user_by_id
            .append_query_results([Vec::<crate::entities::spots::Model>::new()]) // spots
            .append_query_results([vec![count_row(0)]]); // count_likes_by_post_id

        db = match warehouse_artist {
            Some(m) => db.append_query_results([vec![m]]),
            None => {
                db.append_query_results([Vec::<crate::entities::warehouse_artists::Model>::new()])
            }
        };
        db = match warehouse_group {
            Some(m) => db.append_query_results([vec![m]]),
            None => {
                db.append_query_results([Vec::<crate::entities::warehouse_groups::Model>::new()])
            }
        };

        db.append_query_results([vec![count_row(0)]]) // count_tries
            // Background task extras (best-effort)
            .append_query_results([vec![post.clone()]])
            .append_query_results([vec![post]])
            .into_connection()
    }

    #[tokio::test]
    async fn get_post_detail_prefers_warehouse_name_en() {
        use crate::domains::posts::handlers::get_post;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};

        let post = post_model_with_warehouse_ids();
        let db = build_get_post_mock_db_with_warehouse(
            post,
            Some(warehouse_artist_model()), // name_en=Danielle, name_ko=다니엘
            Some(warehouse_group_model()),  // name_en=NewJeans, name_ko=뉴진스
        );
        let state = test_app_state(db);

        let result = get_post(State(state), Path(test_uuid(1)), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let body = result.unwrap().0;
        assert_eq!(
            body.artist_name.as_deref(),
            Some("Danielle"),
            "warehouse name_en must override legacy posts.artist_name"
        );
        assert_eq!(
            body.group_name.as_deref(),
            Some("NewJeans"),
            "warehouse name_en must override legacy posts.group_name"
        );
    }

    #[tokio::test]
    async fn get_post_detail_falls_back_to_name_ko_when_en_null() {
        use crate::domains::posts::handlers::get_post;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};

        let post = post_model_with_warehouse_ids();
        let mut wa = warehouse_artist_model();
        wa.name_en = None; // only name_ko present
        let mut wg = warehouse_group_model();
        wg.name_en = None;
        let db = build_get_post_mock_db_with_warehouse(post, Some(wa), Some(wg));
        let state = test_app_state(db);

        let result = get_post(State(state), Path(test_uuid(1)), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let body = result.unwrap().0;
        assert_eq!(
            body.artist_name.as_deref(),
            Some("다니엘"),
            "when warehouse name_en is null, fall back to name_ko"
        );
        assert_eq!(body.group_name.as_deref(), Some("뉴진스"));
    }

    #[tokio::test]
    async fn get_post_detail_falls_back_to_legacy_when_warehouse_missing() {
        use crate::domains::posts::handlers::get_post;
        use crate::tests::helpers::test_app_state;
        use axum::extract::{Path, State};

        let post = post_model_with_warehouse_ids();
        // warehouse queries return empty rows (artist_id set but no matching warehouse row)
        let db = build_get_post_mock_db_with_warehouse(post, None, None);
        let state = test_app_state(db);

        let result = get_post(State(state), Path(test_uuid(1)), None).await;
        assert!(result.is_ok(), "unexpected err: {:?}", result.err());
        let body = result.unwrap().0;
        assert_eq!(
            body.artist_name.as_deref(),
            Some("Legacy Artist"),
            "when warehouse row missing, fall back to posts.artist_name"
        );
        assert_eq!(body.group_name.as_deref(), Some("Legacy Group"));
    }
}
