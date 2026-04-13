//! 메트릭 수집 미들웨어
//!
//! 각 HTTP 요청의 경로, 상태 코드, 응답 시간을 MetricsStore에 기록합니다.

use std::time::Instant;

use axum::{extract::Request, middleware::Next, response::Response};

use crate::config::AppState;

/// 요청 메트릭 수집 미들웨어
///
/// axum::middleware::from_fn_with_state 로 등록해야 AppState에 접근 가능합니다.
pub async fn metrics_middleware(
    axum::extract::State(state): axum::extract::State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let start = Instant::now();
    let path = request.uri().path().to_string();

    let response = next.run(request).await;

    let duration_us = start.elapsed().as_micros() as u64;
    let status = response.status().as_u16();

    state.metrics.record_request(&path, status, duration_us);

    response
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request as HttpRequest, StatusCode},
        middleware, routing, Router,
    };
    use tower::ServiceExt;

    use crate::config::AppState;

    async fn ok_handler() -> StatusCode {
        StatusCode::OK
    }

    async fn error_handler() -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn build_app(state: AppState, handler: axum::routing::MethodRouter<AppState>) -> Router {
        Router::new()
            .route("/test", handler)
            .layer(middleware::from_fn_with_state(
                state.clone(),
                metrics_middleware,
            ))
            .with_state(state)
    }

    #[tokio::test]
    async fn test_metrics_recorded_on_success() {
        let state = AppState::new(crate::config::AppConfig::from_env().unwrap())
            .await
            .unwrap();

        let app = build_app(state.clone(), routing::get(ok_handler));
        let request = HttpRequest::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let _ = app.oneshot(request).await.unwrap();

        let snap = state.metrics.snapshot();
        assert_eq!(snap.total_requests, 1);
        assert_eq!(snap.total_errors, 0);
    }

    #[tokio::test]
    async fn test_metrics_recorded_on_error() {
        let state = AppState::new(crate::config::AppConfig::from_env().unwrap())
            .await
            .unwrap();

        let app = build_app(state.clone(), routing::get(error_handler));
        let request = HttpRequest::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let _ = app.oneshot(request).await.unwrap();

        let snap = state.metrics.snapshot();
        assert_eq!(snap.total_requests, 1);
        assert_eq!(snap.total_errors, 1);
    }
}
