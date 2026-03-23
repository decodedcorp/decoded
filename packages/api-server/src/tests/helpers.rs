//! 테스트 헬퍼 — **라이브러리 단위 테스트용** (실 DB 연결 없음).
//! 실제 DB가 필요한 시나리오는 `tests/integration_*.rs` + `scripts/run-integration-tests.sh`를 사용하세요.

use axum::Router;

/// 최소한의 라우터 (헬스 등 스모크용)
pub fn create_test_app() -> Router {
    Router::new().route("/health", axum::routing::get(|| async { "OK" }))
}

#[cfg(test)]
mod tests {
    use super::create_test_app;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn create_test_app_health_ok() {
        let app = create_test_app();
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(res.status(), StatusCode::OK);
    }
}
