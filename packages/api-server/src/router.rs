//! API Router 구성
//!
//! 모든 도메인 라우터를 조합하여 최종 API 라우터를 생성합니다.

use axum::Router;

use crate::config::AppState;
use crate::domains;

/// API v1 라우터 구성
///
/// 모든 도메인 라우터를 조합하여 `/api/v1` 하위의 라우터를 생성합니다.
pub fn build_api_router(state: AppState) -> Router<AppState> {
    let config = state.config.clone();
    Router::new()
        // Config가 필요한 라우터들
        .nest("/users", domains::users::router(config.clone()))
        .nest("/posts", domains::posts::router(config.clone()))
        .nest("/spots", domains::spots::router(config.clone()))
        .nest("/search", domains::search::router(config.clone()))
        .nest("/feed", domains::feed::router(config.clone()))
        .nest("/events", domains::events::router(config.clone()))
        .nest("/rankings", domains::rankings::router(config.clone()))
        .nest("/badges", domains::badges::router(config.clone()))
        .nest("/earnings", domains::earnings::router(config.clone()))
        .nest("/reports", domains::reports::public_router(config.clone()))
        .nest(
            "/admin",
            domains::admin::router(state.clone(), config.clone()),
        )
        .nest("/raw-posts", domains::raw_posts::router(config.clone()))
        // Config가 필요 없는 라우터들
        .nest("/post-magazines", domains::post_magazines::router())
        .nest("/categories", domains::categories::router())
        .nest("/subcategories", domains::subcategories::handlers::router())
        .nest("/warehouse", domains::warehouse::router())
        // merge를 사용하는 라우터들 (solutions, votes, comments는 자체 경로를 가지고 있음)
        .merge(domains::solutions::router(config.clone()))
        .merge(domains::votes::handlers::router(config.clone()))
        .merge(domains::post_likes::handlers::router(config.clone()))
        .merge(domains::saved_posts::handlers::router(config.clone()))
        .merge(domains::comments::handlers::router(config))
}
