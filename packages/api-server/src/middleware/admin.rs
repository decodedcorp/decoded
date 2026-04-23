//! Admin 권한 체크 미들웨어
//!
//! 인증된 사용자가 관리자 권한을 가지고 있는지 확인합니다.
//! auth_middleware 이후에 사용해야 합니다.

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use sea_orm::EntityTrait;

use crate::{config::AppState, entities::users, error::AppError, middleware::auth::User};

/// 관리자 권한 확인 미들웨어 (JWT role 기반)
///
/// Extension에서 User를 추출하고 `is_admin` 필드를 확인합니다.
/// Admin이 아닌 경우 403 Forbidden을 반환합니다.
pub async fn admin_middleware(request: Request, next: Next) -> Result<Response, AppError> {
    // Extension에서 User 추출
    let user = request
        .extensions()
        .get::<User>()
        .ok_or_else(|| AppError::Unauthorized("Authentication required".to_string()))?;

    // 관리자 권한 확인
    if !user.is_admin {
        return Err(AppError::Forbidden("Admin privileges required".to_string()));
    }

    Ok(next.run(request).await)
}

/// 관리자 권한 확인 미들웨어 (DB users.is_admin 기반)
///
/// auth_middleware 이후에 사용. JWT role 대신 DB의 users.is_admin을 조회하여
/// Next.js checkIsAdmin과 동일한 방식으로 검증합니다.
pub async fn admin_db_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let user = request
        .extensions()
        .get::<User>()
        .ok_or_else(|| AppError::Unauthorized("Authentication required".to_string()))?;

    let db_user = users::Entity::find_by_id(user.id)
        .one(state.db.as_ref())
        .await
        .map_err(|e| AppError::InternalError(format!("Database error: {}", e)))?;

    let is_admin = db_user.map(|u| u.is_admin).unwrap_or(false);
    if !is_admin {
        return Err(AppError::Forbidden("Admin privileges required".to_string()));
    }

    Ok(next.run(request).await)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use axum::{
        body::Body,
        http::{Request as HttpRequest, StatusCode},
        middleware, routing, Router,
    };
    use tower::ServiceExt;

    use crate::middleware::auth::User;
    use uuid::Uuid;

    async fn ok_handler() -> StatusCode {
        StatusCode::OK
    }

    fn admin_app() -> Router {
        Router::new()
            .route("/admin", routing::get(ok_handler))
            .layer(middleware::from_fn(super::admin_middleware))
    }

    fn admin_db_app(state: crate::config::AppState) -> Router {
        Router::new()
            .route("/admin", routing::get(ok_handler))
            .with_state(state.clone())
            .layer(middleware::from_fn_with_state(
                state,
                super::admin_db_middleware,
            ))
    }

    /// User 구조체의 is_admin 필드 검증 테스트
    #[test]
    fn test_user_is_admin_field() {
        let admin_user = User {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            username: Some("admin".to_string()),
            rank: "admin".to_string(),
            is_admin: true,
        };
        assert!(admin_user.is_admin);

        let regular_user = User {
            id: Uuid::new_v4(),
            email: "user@example.com".to_string(),
            username: Some("user".to_string()),
            rank: "member".to_string(),
            is_admin: false,
        };
        assert!(!regular_user.is_admin);
    }

    #[tokio::test]
    async fn admin_middleware_allows_admin_user() {
        let app = admin_app();
        let mut request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();
        request
            .extensions_mut()
            .insert(crate::tests::helpers::mock_admin_user());

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn admin_middleware_rejects_missing_user() {
        let app = admin_app();
        let request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn admin_middleware_rejects_non_admin_user() {
        let app = admin_app();
        let mut request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();
        request
            .extensions_mut()
            .insert(crate::tests::helpers::mock_user());

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn admin_db_middleware_allows_database_admin() {
        let db = crate::tests::helpers::mock_db_with_query_results(vec![vec![
            crate::tests::fixtures::admin_user_model(),
        ]]);
        let app = admin_db_app(crate::tests::helpers::test_app_state(db));
        let mut request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();
        request
            .extensions_mut()
            .insert(crate::tests::helpers::mock_admin_user());

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn admin_db_middleware_rejects_missing_user() {
        let app = admin_db_app(crate::tests::helpers::test_app_state(
            crate::tests::helpers::empty_mock_db(),
        ));
        let request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn admin_db_middleware_rejects_non_admin_database_user() {
        let db = crate::tests::helpers::mock_db_with_query_results(vec![vec![
            crate::tests::fixtures::user_model(),
        ]]);
        let app = admin_db_app(crate::tests::helpers::test_app_state(db));
        let mut request = HttpRequest::builder()
            .uri("/admin")
            .body(Body::empty())
            .unwrap();
        request
            .extensions_mut()
            .insert(crate::tests::helpers::mock_user());

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
}
