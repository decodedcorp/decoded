//! Admin API handlers
//!
//! 관리자 기능 HTTP 엔드포인트

use axum::Router;

use crate::config::{AppConfig, AppState};

use super::{
    badges, categories, curations, dashboard, editorial_candidates, magazine_sessions, posts,
    solutions, spots, synonyms,
};
use crate::domains::reports;

/// Admin 라우터
pub fn router(state: AppState, app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .nest(
            "/editorial-candidates",
            editorial_candidates::router(state.clone(), app_config.clone()),
        )
        .nest("/posts", posts::router(app_config.clone()))
        .nest("/spots", spots::router(app_config.clone()))
        .nest("/solutions", solutions::router(app_config.clone()))
        .nest("/categories", categories::router(app_config.clone()))
        .nest("/synonyms", synonyms::router(app_config.clone()))
        .nest("/curations", curations::router(app_config.clone()))
        .nest(
            "/dashboard",
            dashboard::router(state.clone(), app_config.clone()),
        )
        .nest("/badges", badges::router(app_config.clone()))
        .nest(
            "/reports",
            reports::admin_router(app_config.clone()),
        )
        .nest(
            "/magazine-sessions",
            magazine_sessions::router(state, app_config),
        )
}
