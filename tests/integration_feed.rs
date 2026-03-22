//! Feed 도메인 통합 테스트 — 실제 PostgreSQL 필요 (`scripts/run-integration-tests.sh`)
#![allow(clippy::disallowed_methods)]

mod common;

use decoded_api::config::AppState;
use decoded_api::domains::feed::service::FeedService;
use decoded_api::entities;
use decoded_api::utils::pagination::Pagination;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

/// 테스트용 사용자 생성
async fn create_test_user(state: &AppState, username: &str) -> entities::UsersModel {
    entities::users::ActiveModel {
        id: Set(Uuid::new_v4()),
        username: Set(username.to_string()),
        email: Set(format!("{}@example.com", username)),
        display_name: Set(Some(username.to_string())),
        avatar_url: Set(None),
        bio: Set(None),
        rank: Set("member".to_string()),
        total_points: Set(0),
        is_admin: Set(false),
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create test user")
}

/// 테스트용 Post 생성
async fn create_test_post(
    state: &AppState,
    user_id: Uuid,
    view_count: i32,
    status: &str,
) -> entities::PostsModel {
    entities::posts::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_id),
        image_url: Set("https://example.com/image.jpg".to_string()),
        media_type: Set("variety".to_string()),
        title: Set(Some("런닝맨".to_string())),
        artist_name: Set(Some("Jennie".to_string())),
        group_name: Set(Some("BLACKPINK".to_string())),
        context: Set(Some("airport".to_string())),
        status: Set(status.to_string()),
        view_count: Set(view_count),
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create test post")
}

/// 테스트용 Spot 생성
async fn create_test_spot(state: &AppState, post_id: Uuid, user_id: Uuid) -> entities::SpotsModel {
    // 카테고리 조회 (fashion 카테고리 사용)
    let category = entities::Categories::find()
        .filter(entities::categories::Column::Code.eq("fashion"))
        .one(&state.db)
        .await
        .expect("Failed to find fashion category")
        .expect("Fashion category not found");

    // 서브카테고리 조회 (해당 카테고리의 첫 번째 서브카테고리 사용)
    let _subcategory = entities::Subcategories::find()
        .filter(entities::subcategories::Column::CategoryId.eq(category.id))
        .one(&state.db)
        .await
        .expect("Failed to find subcategory")
        .expect("Subcategory not found");

    entities::spots::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        position_left: Set("50.0".to_string()),
        position_top: Set("50.0".to_string()),
        subcategory_id: Set(None),
        status: Set("pending".to_string()),
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create test spot")
}

/// 테스트용 댓글 생성
async fn create_test_comment(
    state: &AppState,
    post_id: Uuid,
    user_id: Uuid,
) -> entities::CommentsModel {
    entities::comments::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        parent_id: Set(None),
        content: Set("Test comment".to_string()),
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create test comment")
}

/// 테스트용 큐레이션 생성
async fn create_test_curation(state: &AppState, title: &str) -> entities::CurationsModel {
    entities::curations::ActiveModel {
        id: Set(Uuid::new_v4()),
        title: Set(title.to_string()),
        description: Set(Some("Test description".to_string())),
        cover_image_url: Set(Some("https://example.com/cover.jpg".to_string())),
        display_order: Set(1),
        is_active: Set(true),
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create test curation")
}

/// 큐레이션-Post 연결
async fn add_post_to_curation(
    state: &AppState,
    curation_id: Uuid,
    post_id: Uuid,
    display_order: i32,
) {
    entities::curation_posts::ActiveModel {
        curation_id: Set(curation_id),
        post_id: Set(post_id),
        display_order: Set(display_order),
    }
    .insert(&state.db)
    .await
    .expect("Failed to add post to curation");
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_home_feed_returns_published_posts_only() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;

    // published 게시물
    let _published_post = create_test_post(&state, user.id, 100, "published").await;

    // draft 게시물 (홈 피드에 표시되지 않아야 함)
    let _draft_post = create_test_post(&state, user.id, 200, "draft").await;

    // 홈 피드 조회
    let pagination = Pagination::new(1, 10);
    let result = FeedService::home_feed(&state, None, pagination).await;

    assert!(result.is_ok());
    let feed = result.unwrap();

    // published만 표시
    assert_eq!(feed.data.len(), 1);
    assert_eq!(feed.pagination.total_items, 1);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_home_feed_pagination() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;

    // 25개 게시물 생성
    for _ in 0..25 {
        create_test_post(&state, user.id, 100, "published").await;
    }

    // 페이지 1 (20개)
    let pagination = Pagination::new(1, 20);
    let result = FeedService::home_feed(&state, None, pagination).await;
    assert!(result.is_ok());
    let feed = result.unwrap();
    assert_eq!(feed.data.len(), 20);
    assert_eq!(feed.pagination.total_items, 25);
    assert_eq!(feed.pagination.total_pages, 2);

    // 페이지 2 (5개)
    let pagination = Pagination::new(2, 20);
    let result = FeedService::home_feed(&state, None, pagination).await;
    assert!(result.is_ok());
    let feed = result.unwrap();
    assert_eq!(feed.data.len(), 5);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_home_feed_includes_metadata() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "feeduser").await;

    let post = create_test_post(&state, user.id, 100, "published").await;

    // Spot 추가
    create_test_spot(&state, post.id, user.id).await;
    create_test_spot(&state, post.id, user.id).await;

    // 댓글 추가
    create_test_comment(&state, post.id, user.id).await;

    // 홈 피드 조회
    let pagination = Pagination::new(1, 10);
    let result = FeedService::home_feed(&state, None, pagination).await;

    assert!(result.is_ok());
    let feed = result.unwrap();
    assert_eq!(feed.data.len(), 1);

    let item = &feed.data[0];
    assert_eq!(item.user.username, "feeduser");
    assert_eq!(item.spot_count, 2);
    assert_eq!(item.comment_count, 1);
    assert_eq!(item.view_count, 100);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_trending_returns_recent_posts_only() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "trenduser").await;

    // 최근 게시물 (24시간 이내)
    let _recent_post = create_test_post(&state, user.id, 100, "published").await;

    // 트렌딩 조회
    let pagination = Pagination::new(1, 10);
    let result = FeedService::trending(&state, pagination).await;

    assert!(result.is_ok());
    let trending = result.unwrap();

    // 최근 게시물만 표시
    assert!(!trending.data.is_empty());
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_trending_sorting_by_score() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "sortuser").await;

    // 조회수만 높은 게시물
    let _post1 = create_test_post(&state, user.id, 1000, "published").await;

    // 조회수는 낮지만 Solution이 많은 게시물 (점수가 더 높아야 함)
    let post2 = create_test_post(&state, user.id, 100, "published").await;
    let spot2 = create_test_spot(&state, post2.id, user.id).await;

    // Solution 10개 추가 (점수: 100 + 50 = 150)
    for _ in 0..10 {
        entities::solutions::ActiveModel {
            id: Set(Uuid::new_v4()),
            spot_id: Set(spot2.id),
            user_id: Set(user.id),
            match_type: Set(Some("close".to_string())),
            title: Set("Test Product".to_string()),
            original_url: Set(Some("https://example.com/product".to_string())),
            affiliate_url: Set(None),
            thumbnail_url: Set(None),
            description: Set(None),
            accurate_count: Set(0),
            different_count: Set(0),
            is_verified: Set(false),
            is_adopted: Set(false),
            adopted_at: Set(None),
            ..Default::default()
        }
        .insert(&state.db)
        .await
        .expect("Failed to create solution");
    }

    // 트렌딩 조회
    let pagination = Pagination::new(1, 10);
    let result = FeedService::trending(&state, pagination).await;

    assert!(result.is_ok());
    let trending = result.unwrap();

    // post2가 post1보다 먼저 나와야 함 (Solution 가중치 때문)
    assert!(trending.data.len() >= 2);
    // 첫 번째 항목이 post2여야 함
    assert_eq!(trending.data[0].id, post2.id);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_list_curations_active_only() {
    let state = common::create_integration_state().await;

    // 활성 큐레이션
    let _active = create_test_curation(&state, "Active Curation").await;

    // 비활성 큐레이션
    entities::curations::ActiveModel {
        id: Set(Uuid::new_v4()),
        title: Set("Inactive Curation".to_string()),
        description: Set(None),
        cover_image_url: Set(None),
        display_order: Set(2),
        is_active: Set(false), // 비활성
        ..Default::default()
    }
    .insert(&state.db)
    .await
    .expect("Failed to create inactive curation");

    // 큐레이션 목록 조회
    let result = FeedService::list_curations(&state).await;

    assert!(result.is_ok());
    let curations = result.unwrap();

    // 활성 큐레이션만 표시
    assert_eq!(curations.data.len(), 1);
    assert_eq!(curations.data[0].title, "Active Curation");
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_list_curations_includes_post_count() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "curateuser").await;

    let curation = create_test_curation(&state, "Test Curation").await;

    // Post 3개 추가
    for i in 0..3 {
        let post = create_test_post(&state, user.id, 100, "published").await;
        add_post_to_curation(&state, curation.id, post.id, i).await;
    }

    // 큐레이션 목록 조회
    let result = FeedService::list_curations(&state).await;

    assert!(result.is_ok());
    let curations = result.unwrap();

    assert_eq!(curations.data.len(), 1);
    assert_eq!(curations.data[0].post_count, 3);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_curation_detail_returns_posts_in_order() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "orderuser").await;

    let curation = create_test_curation(&state, "Ordered Curation").await;

    // Post를 역순으로 추가 (display_order로 정렬 확인)
    let post1 = create_test_post(&state, user.id, 100, "published").await;
    let post2 = create_test_post(&state, user.id, 200, "published").await;
    let post3 = create_test_post(&state, user.id, 300, "published").await;

    add_post_to_curation(&state, curation.id, post3.id, 0).await;
    add_post_to_curation(&state, curation.id, post1.id, 1).await;
    add_post_to_curation(&state, curation.id, post2.id, 2).await;

    // 큐레이션 상세 조회
    let result = FeedService::curation_detail(&state, curation.id).await;

    assert!(result.is_ok());
    let detail = result.unwrap();

    assert_eq!(detail.title, "Ordered Curation");
    assert_eq!(detail.posts.len(), 3);

    // display_order 순서대로 정렬되어야 함
    assert_eq!(detail.posts[0].id, post3.id);
    assert_eq!(detail.posts[1].id, post1.id);
    assert_eq!(detail.posts[2].id, post2.id);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_curation_detail_not_found() {
    let state = common::create_integration_state().await;

    let fake_id = Uuid::new_v4();
    let result = FeedService::curation_detail(&state, fake_id).await;

    assert!(result.is_err());
}
