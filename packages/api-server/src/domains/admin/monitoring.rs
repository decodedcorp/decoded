//! Admin Monitoring
//!
//! 백엔드 실시간 메트릭 API (HTTP 요청 latency, throughput, error rate)

use axum::{extract::State, routing::get, Json, Router};

use crate::{config::AppState, error::AppResult, metrics::MetricsSnapshot};

/// GET /api/v1/admin/monitoring/metrics
///
/// 현재 서버 메트릭 스냅샷 반환 (admin 전용)
async fn get_metrics(State(state): State<AppState>) -> AppResult<Json<MetricsSnapshot>> {
    Ok(Json(state.metrics.snapshot()))
}

pub fn router() -> Router<AppState> {
    Router::new().route("/metrics", get(get_metrics))
}
