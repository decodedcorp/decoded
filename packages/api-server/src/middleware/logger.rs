//! 로깅 미들웨어
//!
//! 구조화된 로깅 및 요청/응답 추적

use std::time::Instant;

use axum::{extract::Request, middleware::Next, response::Response};
use tracing::{info, warn};
use uuid::Uuid;

use super::auth::User;

/// 요청 로깅 미들웨어
///
/// 각 요청에 대해 메서드, 경로, 응답 시간, 상태 코드를 로깅합니다.
/// 인증된 사용자의 경우 user_id도 함께 로깅합니다.
pub async fn request_logger_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();

    // 요청 ID 생성 (요청 추적용)
    let request_id = Uuid::new_v4();

    // 환경 변수에서 환경 정보 가져오기 (기본값: development)
    let environment = std::env::var("ENV").unwrap_or_else(|_| "development".to_string());
    let service = "decoded-api".to_string();

    // Extension에서 User 추출 시도 (인증된 경우)
    let user_id = request
        .extensions()
        .get::<User>()
        .map(|user| user.id.to_string());

    // 요청 처리
    let response = next.run(request).await;

    // 응답 시간 계산
    let duration = start.elapsed();
    let status = response.status();

    // 로깅 (구조화된 필드 포함)
    if status.is_client_error() || status.is_server_error() {
        warn!(
            request_id = %request_id,
            service = %service,
            environment = %environment,
            method = %method,
            uri = %uri,
            status = %status.as_u16(),
            duration_ms = duration.as_millis(),
            user_id = ?user_id,
            "Request completed with error"
        );
    } else {
        info!(
            request_id = %request_id,
            service = %service,
            environment = %environment,
            method = %method,
            uri = %uri,
            status = %status.as_u16(),
            duration_ms = duration.as_millis(),
            user_id = ?user_id,
            "Request completed"
        );
    }

    response
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request as HttpRequest, StatusCode},
        middleware,
        response::IntoResponse,
        Router,
    };
    use tower::ServiceExt;
    use uuid::Uuid;

    async fn test_handler() -> impl IntoResponse {
        StatusCode::OK
    }

    async fn error_handler() -> impl IntoResponse {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    #[tokio::test]
    async fn test_request_logger_middleware_success() {
        let app = Router::new()
            .route("/test", axum::routing::get(test_handler))
            .layer(middleware::from_fn(request_logger_middleware));

        let request = HttpRequest::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_request_logger_middleware_error() {
        let app = Router::new()
            .route("/error", axum::routing::get(error_handler))
            .layer(middleware::from_fn(request_logger_middleware));

        let request = HttpRequest::builder()
            .uri("/error")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[tokio::test]
    async fn test_request_logger_with_user() {
        async fn handler_with_user(request: HttpRequest<Body>) -> impl IntoResponse {
            // User가 Extension에 있는지 확인
            let has_user = request.extensions().get::<User>().is_some();
            if has_user {
                StatusCode::OK
            } else {
                StatusCode::UNAUTHORIZED
            }
        }

        let app = Router::new()
            .route("/protected", axum::routing::get(handler_with_user))
            .layer(middleware::from_fn(request_logger_middleware));

        let mut request = HttpRequest::builder()
            .uri("/protected")
            .body(Body::empty())
            .unwrap();

        // User Extension 추가
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            username: Some("testuser".to_string()),
            rank: "user".to_string(),
            is_admin: false,
        };
        request.extensions_mut().insert(user);

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
