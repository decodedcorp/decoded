//! Rankings 도메인 통합 테스트 — 실제 PostgreSQL 필요 (`scripts/run-integration-tests.sh`)
#![allow(clippy::disallowed_methods)]

mod common;

use decoded_api::{
    config::AppState,
    domains::rankings::service::{ActivityPoints, RankingsService},
    entities,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

/// 테스트용 Category ID 조회 (fashion)
async fn get_test_category_id(state: &AppState) -> Uuid {
    entities::Categories::find()
        .filter(entities::categories::Column::Code.eq("fashion"))
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap()
        .id
}

/// 테스트용 사용자 생성
async fn create_test_user(
    state: &AppState,
    username: &str,
    total_points: i32,
) -> entities::UsersModel {
    entities::users::ActiveModel {
        id: Set(Uuid::new_v4()),
        username: Set(username.to_string()),
        email: Set(format!("{}@test.com", username)),
        total_points: Set(total_points),
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
        status: Set("published".to_string()),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 테스트용 Spot 생성
async fn create_test_spot(
    state: &AppState,
    post_id: Uuid,
    user_id: Uuid,
    category_id: Uuid,
) -> entities::SpotsModel {
    // 서브카테고리 조회 (해당 카테고리의 첫 번째 서브카테고리 사용)
    let subcategory = entities::Subcategories::find()
        .filter(entities::subcategories::Column::CategoryId.eq(category_id))
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
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

/// 테스트용 Solution 생성
async fn create_test_solution(
    state: &AppState,
    user_id: Uuid,
    spot_id: Uuid,
    is_adopted: bool,
    is_verified: bool,
) -> entities::SolutionsModel {
    entities::solutions::ActiveModel {
        id: Set(Uuid::new_v4()),
        spot_id: Set(spot_id),
        user_id: Set(user_id),
        original_url: Set(Some("https://example.com/product".to_string())),
        affiliate_url: Set(Some("https://affiliate.com/link".to_string())),
        match_type: Set(Some("exact".to_string())),
        title: Set("Test Product".to_string()),
        is_adopted: Set(is_adopted),
        is_verified: Set(is_verified),
        status: Set("active".to_string()),
        ..Default::default()
    }
    .insert(state.db.as_ref())
    .await
    .unwrap()
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_add_points_creates_log_and_updates_user() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "point_tester", 0).await;

    // 포인트 적립
    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "PostCreated",
        ActivityPoints::PostCreated as i32,
        None,
        None,
        Some("Test post created"),
    )
    .await
    .unwrap();

    // PointLog 생성 확인
    let logs = entities::PointLogs::find()
        .filter(entities::point_logs::Column::UserId.eq(user.id))
        .all(state.db.as_ref())
        .await
        .unwrap();

    assert_eq!(logs.len(), 1);
    assert_eq!(logs[0].activity_type, "PostCreated");
    assert_eq!(logs[0].points, 5);

    // User total_points 업데이트 확인
    let updated_user = entities::Users::find_by_id(user.id)
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();

    assert_eq!(updated_user.total_points, 5);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_add_points_accumulates_correctly() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "accumulator", 0).await;

    // 여러 번 포인트 적립
    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "PostCreated",
        ActivityPoints::PostCreated as i32,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SpotCreated",
        ActivityPoints::SpotCreated as i32,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionRegistered",
        ActivityPoints::SolutionRegistered as i32,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    // 총 포인트 확인 (5 + 3 + 10 = 18)
    let updated_user = entities::Users::find_by_id(user.id)
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();

    assert_eq!(updated_user.total_points, 18);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_rankings_orders_by_total_points() {
    let state = common::create_integration_state().await;

    // 다양한 포인트를 가진 사용자들 생성
    let _user1 = create_test_user(&state, "rank_user_1", 1000).await;
    let _user2 = create_test_user(&state, "rank_user_2", 500).await;
    let _user3 = create_test_user(&state, "rank_user_3", 1500).await;

    // 랭킹 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_rankings(&state, "all_time", pagination, None)
        .await
        .unwrap();

    // 순위 확인 (total_points DESC)
    assert!(response.data.len() >= 3);
    assert_eq!(response.data[0].user.username, "rank_user_3"); // 1500점
    assert_eq!(response.data[0].rank, 1);
    assert_eq!(response.data[0].total_points, 1500);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_rankings_with_period_filter() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "period_user", 100).await;

    // 최근 포인트 적립
    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "VoteAccurate",
        ActivityPoints::VoteAccurate as i32,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    // 주간 랭킹 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_rankings(&state, "weekly", pagination, None)
        .await
        .unwrap();

    // weekly_points가 계산되어야 함
    let user_item = response
        .data
        .iter()
        .find(|item| item.user.id == user.id)
        .unwrap();

    assert_eq!(user_item.weekly_points, 2); // 방금 적립한 2점
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_rankings_includes_my_ranking_when_authenticated() {
    let state = common::create_integration_state().await;

    // 여러 사용자 생성
    create_test_user(&state, "rank_a", 2000).await;
    create_test_user(&state, "rank_b", 1500).await;
    let my_user = create_test_user(&state, "rank_me", 1000).await;
    create_test_user(&state, "rank_c", 500).await;

    // 내 랭킹 포함 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_rankings(&state, "all_time", pagination, Some(my_user.id))
        .await
        .unwrap();

    // my_ranking 확인
    assert!(response.my_ranking.is_some());
    let my_ranking = response.my_ranking.unwrap();
    assert_eq!(my_ranking.rank, 3); // 2000, 1500 다음이므로 3위
    assert_eq!(my_ranking.total_points, 1000);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_rankings_calculates_solution_stats() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "solution_user", 500).await;

    // Post와 Spot 생성
    let post = create_test_post(&state, user.id).await;
    let category_id = get_test_category_id(&state).await;
    let spot = create_test_spot(&state, post.id, user.id, category_id).await;

    // Solution 생성 (adopted, verified 각각)
    create_test_solution(&state, user.id, spot.id, true, false).await;
    create_test_solution(&state, user.id, spot.id, false, true).await;
    create_test_solution(&state, user.id, spot.id, false, false).await;

    // 랭킹 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_rankings(&state, "all_time", pagination, None)
        .await
        .unwrap();

    let user_item = response
        .data
        .iter()
        .find(|item| item.user.id == user.id)
        .unwrap();

    assert_eq!(user_item.solution_count, 3);
    assert_eq!(user_item.adopted_count, 1);
    assert_eq!(user_item.verified_count, 1);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_category_rankings_validates_category() {
    let state = common::create_integration_state().await;

    // 존재하지 않는 카테고리 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let result = RankingsService::get_category_rankings(&state, "invalid_code", pagination).await;

    assert!(result.is_err());
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_category_rankings_returns_users() {
    let state = common::create_integration_state().await;

    // 사용자 생성
    create_test_user(&state, "cat_user_1", 800).await;
    create_test_user(&state, "cat_user_2", 1200).await;

    // 카테고리별 랭킹 조회 (fashion 카테고리 사용)
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_category_rankings(&state, "fashion", pagination)
        .await
        .unwrap();

    assert_eq!(response.category_code, "fashion");
    assert!(response.data.len() >= 2);
    // total_points DESC 순서 확인
    assert_eq!(response.data[0].user.username, "cat_user_2");
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_category_rankings_calculates_category_points() {
    let state = common::create_integration_state().await;

    // 사용자 생성
    let user1 = create_test_user(&state, "fashion_expert", 0).await;
    let user2 = create_test_user(&state, "beauty_expert", 0).await;

    // 카테고리 ID 조회
    let fashion_id = get_test_category_id(&state).await;

    // beauty 카테고리 조회
    let beauty = entities::Categories::find()
        .filter(entities::categories::Column::Code.eq("beauty"))
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();
    let beauty_id = beauty.id;

    // User1: fashion 카테고리에 3개의 Solution 등록
    let post1 = create_test_post(&state, user1.id).await;
    let spot1 = create_test_spot(&state, post1.id, user1.id, fashion_id).await;
    let sol1 = create_test_solution(&state, user1.id, spot1.id, true, false).await; // adopted
    let sol2 = create_test_solution(&state, user1.id, spot1.id, false, true).await; // verified
    let sol3 = create_test_solution(&state, user1.id, spot1.id, false, false).await;

    // User2: beauty 카테고리에 2개의 Solution 등록
    let post2 = create_test_post(&state, user2.id).await;
    let spot2 = create_test_spot(&state, post2.id, user2.id, beauty_id).await;
    let sol4 = create_test_solution(&state, user2.id, spot2.id, true, true).await;
    let _sol5 = create_test_solution(&state, user2.id, spot2.id, false, false).await;

    // 포인트 적립 (각 Solution에 대해)
    // User1 fashion 포인트: 10 + 30 + 10 + 20 + 10 = 80점
    RankingsService::add_points(
        state.db.as_ref(),
        user1.id,
        "SolutionRegistered",
        10,
        Some(sol1.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user1.id,
        "SolutionAdopted",
        30,
        Some(sol1.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user1.id,
        "SolutionRegistered",
        10,
        Some(sol2.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user1.id,
        "SolutionVerified",
        20,
        Some(sol2.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user1.id,
        "SolutionRegistered",
        10,
        Some(sol3.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    // User2 beauty 포인트: 10 + 30 + 20 + 10 = 70점
    RankingsService::add_points(
        state.db.as_ref(),
        user2.id,
        "SolutionRegistered",
        10,
        Some(sol4.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user2.id,
        "SolutionAdopted",
        30,
        Some(sol4.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user2.id,
        "SolutionVerified",
        20,
        Some(sol4.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user2.id,
        "SolutionRegistered",
        10,
        Some(sol4.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    // fashion 카테고리 랭킹 조회
    let pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let response = RankingsService::get_category_rankings(&state, "fashion", pagination)
        .await
        .unwrap();

    // User1이 fashion 카테고리에서 1위여야 함
    let user1_item = response
        .data
        .iter()
        .find(|item| item.user.id == user1.id)
        .unwrap();

    // 카테고리별 포인트가 정확히 계산되어야 함
    assert_eq!(user1_item.category_points, 80);
    assert_eq!(user1_item.solution_count, 3);
    assert_eq!(user1_item.adopted_count, 1);

    // User2는 fashion 랭킹에 나타나지 않거나 0점이어야 함
    let user2_item = response.data.iter().find(|item| item.user.id == user2.id);
    if let Some(item) = user2_item {
        assert_eq!(item.category_points, 0);
    }
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_my_ranking_detail_calculates_periods() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "detail_user", 500).await;

    // 최근 포인트 적립 (주간, 월간에 포함됨)
    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionAdopted",
        ActivityPoints::SolutionAdopted as i32,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    // 내 랭킹 상세 조회
    let response = RankingsService::get_my_ranking_detail(&state, user.id)
        .await
        .unwrap();

    assert_eq!(response.total_points, 530); // 500 + 30
    assert_eq!(response.weekly_points, 30);
    assert_eq!(response.monthly_points, 30);
    assert!(response.overall_rank >= 1);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_my_ranking_detail_includes_solution_stats() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "stats_user", 300).await;

    // Post와 Spot 생성
    let post = create_test_post(&state, user.id).await;
    let category_id = get_test_category_id(&state).await;
    let spot = create_test_spot(&state, post.id, user.id, category_id).await;

    // Solution 생성 (다양한 상태)
    create_test_solution(&state, user.id, spot.id, true, true).await; // adopted & verified
    create_test_solution(&state, user.id, spot.id, true, false).await; // adopted only
    create_test_solution(&state, user.id, spot.id, false, true).await; // verified only

    // 내 랭킹 상세 조회
    let response = RankingsService::get_my_ranking_detail(&state, user.id)
        .await
        .unwrap();

    assert_eq!(response.solution_stats.total_count, 3);
    assert_eq!(response.solution_stats.adopted_count, 2);
    assert_eq!(response.solution_stats.verified_count, 2);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_get_my_ranking_detail_includes_category_rankings() {
    let state = common::create_integration_state().await;
    let user = create_test_user(&state, "category_user", 100).await;

    // fashion 카테고리 활동
    let fashion_id = get_test_category_id(&state).await;
    let post1 = create_test_post(&state, user.id).await;
    let spot1 = create_test_spot(&state, post1.id, user.id, fashion_id).await;
    let sol1 = create_test_solution(&state, user.id, spot1.id, true, false).await;

    // beauty 카테고리 활동
    let beauty = entities::Categories::find()
        .filter(entities::categories::Column::Code.eq("beauty"))
        .one(state.db.as_ref())
        .await
        .unwrap()
        .unwrap();
    let beauty_id = beauty.id;

    let post2 = create_test_post(&state, user.id).await;
    let spot2 = create_test_spot(&state, post2.id, user.id, beauty_id).await;
    let sol2 = create_test_solution(&state, user.id, spot2.id, false, true).await;

    // 포인트 적립 (fashion: 40점, beauty: 30점)
    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionRegistered",
        10,
        Some(sol1.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionAdopted",
        30,
        Some(sol1.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionRegistered",
        10,
        Some(sol2.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    RankingsService::add_points(
        state.db.as_ref(),
        user.id,
        "SolutionVerified",
        20,
        Some(sol2.id),
        Some("solution"),
        None,
    )
    .await
    .unwrap();

    // 내 랭킹 상세 조회
    let response = RankingsService::get_my_ranking_detail(&state, user.id)
        .await
        .unwrap();

    // 카테고리별 순위가 포함되어야 함
    assert!(!response.category_rankings.is_empty());

    // fashion 카테고리 순위 확인
    let fashion_rank = response
        .category_rankings
        .iter()
        .find(|r| r.category_code == "fashion");
    assert!(fashion_rank.is_some());
    let fashion = fashion_rank.unwrap();
    assert_eq!(fashion.points, 40);
    assert!(fashion.rank >= 1);

    // beauty 카테고리 순위 확인
    let beauty_rank = response
        .category_rankings
        .iter()
        .find(|r| r.category_code == "beauty");
    assert!(beauty_rank.is_some());
    let beauty = beauty_rank.unwrap();
    assert_eq!(beauty.points, 30);
    assert!(beauty.rank >= 1);
}

#[ignore = "integration DB — scripts/run-integration-tests.sh"]
#[tokio::test]
async fn test_pagination_works_correctly() {
    let state = common::create_integration_state().await;

    // 여러 사용자 생성
    for i in 0..15 {
        create_test_user(&state, &format!("page_user_{}", i), i * 100).await;
    }

    // 첫 페이지 조회 (per_page: 10)
    let page1_pagination = decoded_api::utils::pagination::Pagination::new(1, 10);
    let page1_response = RankingsService::get_rankings(&state, "all_time", page1_pagination, None)
        .await
        .unwrap();

    assert!(page1_response.data.len() <= 10);
    assert_eq!(page1_response.pagination.current_page, 1);
    assert_eq!(page1_response.pagination.per_page, 10);

    // 두 번째 페이지 조회
    let page2_pagination = decoded_api::utils::pagination::Pagination::new(2, 10);
    let page2_response = RankingsService::get_rankings(&state, "all_time", page2_pagination, None)
        .await
        .unwrap();

    assert_eq!(page2_response.pagination.current_page, 2);
    // 첫 페이지와 두 번째 페이지의 사용자가 달라야 함
    if !page1_response.data.is_empty() && !page2_response.data.is_empty() {
        assert_ne!(
            page1_response.data[0].user.id,
            page2_response.data[0].user.id
        );
    }
}
