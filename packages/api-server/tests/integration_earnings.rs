//! Earnings 도메인 통합 테스트 — 실제 PostgreSQL 필요
#![allow(clippy::disallowed_methods)]

mod common;

use decoded_api::domains::earnings::service;
use decoded_api::{config::AppState, entities};
use sea_orm::ColumnTrait;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

/// 테스트용 사용자 생성
async fn create_test_user(state: &AppState, username: &str) -> entities::UsersModel {
    entities::users::ActiveModel {
        id: Set(Uuid::new_v4()),
        username: Set(username.to_string()),
        email: Set(format!("{}@test.com", username)),
        total_points: Set(0),
        rank: Set("Member".to_string()),
        is_admin: Set(false),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 테스트용 Post 생성
async fn create_test_post(state: &AppState, user_id: Uuid) -> entities::PostsModel {
    entities::posts::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_id),
        image_url: Set("https://example.com/test.jpg".to_string()),
        media_type: Set("variety".to_string()),
        title: Set(Some("테스트".to_string())),
        artist_name: Set(None),
        group_name: Set(None),
        context: Set(None),
        status: Set("active".to_string()),
        view_count: Set(0),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 테스트용 Spot 생성
async fn create_test_spot(state: &AppState, post_id: Uuid, user_id: Uuid) -> entities::SpotsModel {
    // 카테고리 조회 (fashion 카테고리 사용)
    let category = entities::Categories::find()
        .filter(entities::categories::Column::Code.eq("fashion"))
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();

    // 서브카테고리 조회 (해당 카테고리의 첫 번째 서브카테고리 사용)
    let subcategory = entities::Subcategories::find()
        .filter(entities::subcategories::Column::CategoryId.eq(category.id))
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();

    entities::spots::ActiveModel {
        id: Set(Uuid::new_v4()),
        post_id: Set(post_id),
        user_id: Set(user_id),
        position_left: Set("50.0".to_string()),
        position_top: Set("50.0".to_string()),
        subcategory_id: Set(Some(subcategory.id)),
        status: Set("open".to_string()),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 테스트용 Solution 생성
async fn create_test_solution(
    state: &AppState,
    spot_id: Uuid,
    user_id: Uuid,
) -> entities::SolutionsModel {
    entities::solutions::ActiveModel {
        id: Set(Uuid::new_v4()),
        spot_id: Set(spot_id),
        user_id: Set(user_id),
        title: Set("Test Product".to_string()),
        accurate_count: Set(0),
        different_count: Set(0),
        is_verified: Set(false),
        is_adopted: Set(false),
        click_count: Set(0),
        purchase_count: Set(0),
        status: Set("active".to_string()),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 클릭 로그 저장 테스트
#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_create_click_log() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;
    let post = create_test_post(&state, user.id).await;
    let spot = create_test_spot(&state, post.id, user.id).await;
    let solution = create_test_solution(&state, spot.id, user.id).await;

    // 클릭 로그 저장
    let result = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        Some("Mozilla/5.0".to_string()),
        Some("https://example.com".to_string()),
    )
    .await;

    assert!(result.is_ok());
}

/// 부정 클릭 방지: 중복 클릭 테스트
#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_duplicate_click_prevention() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;
    let post = create_test_post(&state, user.id).await;
    let spot = create_test_spot(&state, post.id, user.id).await;
    let solution = create_test_solution(&state, spot.id, user.id).await;

    // 첫 번째 클릭 저장
    let result1 = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        Some("Mozilla/5.0".to_string()),
        None,
    )
    .await;
    assert!(result1.is_ok());

    // 두 번째 클릭 (24시간 내 중복) - 조용히 무시되어야 함
    let result2 = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        Some("Mozilla/5.0".to_string()),
        None,
    )
    .await;
    assert!(result2.is_ok()); // 중복 클릭은 조용히 무시되므로 에러가 아님
}

/// 부정 클릭 방지: IP Rate Limiting 테스트
#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_ip_rate_limiting() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;
    let post = create_test_post(&state, user.id).await;
    let spot = create_test_spot(&state, post.id, user.id).await;
    let solution = create_test_solution(&state, spot.id, user.id).await;

    // 1분당 최대 10회까지는 성공해야 함
    for i in 0..10 {
        let result = service::create_click_log(
            state.db.as_ref(),
            Some(user.id),
            solution.id,
            "192.168.1.1".to_string(),
            Some("Mozilla/5.0".to_string()),
            None,
        )
        .await;

        if i < 10 {
            assert!(result.is_ok(), "클릭 {}번째는 성공해야 함", i + 1);
        }
    }

    // 11번째 클릭은 Rate Limit에 걸려야 함
    let result = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "192.168.1.1".to_string(),
        Some("Mozilla/5.0".to_string()),
        None,
    )
    .await;

    assert!(result.is_err());
    assert!(matches!(
        result.unwrap_err(),
        decoded_api::error::AppError::BadRequest(_)
    ));
}

/// User Agent 검증 테스트
#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_user_agent_validation() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "testuser").await;
    let post = create_test_post(&state, user.id).await;
    let spot = create_test_spot(&state, post.id, user.id).await;
    let solution = create_test_solution(&state, spot.id, user.id).await;

    // 유효한 User Agent
    let result1 = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        Some("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36".to_string()),
        None,
    )
    .await;
    assert!(result1.is_ok());

    // 유효하지 않은 User Agent (없음)
    let result2 = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        None,
        None,
    )
    .await;
    assert!(result2.is_err());
    assert!(matches!(
        result2.unwrap_err(),
        decoded_api::error::AppError::BadRequest(_)
    ));

    // 유효하지 않은 User Agent (일반적인 브라우저 패턴 없음)
    let result3 = service::create_click_log(
        state.db.as_ref(),
        Some(user.id),
        solution.id,
        "127.0.0.1".to_string(),
        Some("CustomBot/1.0".to_string()),
        None,
    )
    .await;
    assert!(result3.is_err());
    assert!(matches!(
        result3.unwrap_err(),
        decoded_api::error::AppError::BadRequest(_)
    ));
}

/// 클릭 통계 집계 테스트
#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_click_stats_aggregation() {
    let state = common::create_integration_state().await;
    let user1 = create_test_user(&state, "user1").await;
    let user2 = create_test_user(&state, "user2").await;
    let post = create_test_post(&state, user1.id).await;
    let spot = create_test_spot(&state, post.id, user1.id).await;
    let solution = create_test_solution(&state, spot.id, user1.id).await;

    // 여러 클릭 로그 생성
    for i in 0..5 {
        service::create_click_log(
            state.db.as_ref(),
            Some(user1.id),
            solution.id,
            format!("127.0.0.{}", i + 1),
            Some("Mozilla/5.0".to_string()),
            None,
        )
        .await
        .unwrap();

        service::create_click_log(
            state.db.as_ref(),
            Some(user2.id),
            solution.id,
            format!("127.0.0.{}", i + 1),
            Some("Mozilla/5.0".to_string()),
            None,
        )
        .await
        .unwrap();
    }

    // 통계 조회
    let stats = service::get_click_stats_by_user(state.db.as_ref(), user1.id)
        .await
        .unwrap();

    assert!(stats.total_clicks >= 5); // 최소 5개 이상의 클릭
    assert!(stats.unique_clicks >= 1); // 최소 1명 이상의 고유 사용자
}
