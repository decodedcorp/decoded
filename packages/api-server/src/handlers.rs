//! 공통 HTTP 핸들러 (헬스 등)

use std::time::Duration;

use axum::extract::State;
use axum::Json;
use sea_orm::ConnectionTrait;
use serde::Serialize;
use utoipa::ToSchema;

use crate::app_state::AppState;
use crate::services::search::MeilisearchClient;

/// 의존성 한 항목 상태
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct DependencyHealth {
    /// `up` | `down` | `skipped` | `degraded`
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

/// `/health` JSON 응답
#[derive(Debug, Serialize, ToSchema)]
pub struct HealthResponse {
    /// 전체 요약: 주요 의존성이 모두 정상이면 `ok`, 일부만 문제면 `degraded`
    pub status: String,
    pub database: DependencyHealth,
    pub meilisearch: DependencyHealth,
    pub storage: DependencyHealth,
    pub decoded_ai_grpc: DependencyHealth,
}

async fn check_database(db: &sea_orm::DatabaseConnection) -> DependencyHealth {
    match db.execute_unprepared("SELECT 1").await {
        Ok(_) => DependencyHealth {
            status: "up".to_string(),
            detail: None,
        },
        Err(e) => DependencyHealth {
            status: "down".to_string(),
            detail: Some(e.to_string()),
        },
    }
}

async fn check_meilisearch(state: &AppState) -> DependencyHealth {
    let Some(_ms) = state
        .search_client
        .as_any()
        .downcast_ref::<MeilisearchClient>()
    else {
        return DependencyHealth {
            status: "skipped".to_string(),
            detail: Some("Meilisearch 클라이언트가 아님".to_string()),
        };
    };
    let base = state.config.search.url.trim_end_matches('/');
    let url = format!("{}/health", base);
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return DependencyHealth {
                status: "down".to_string(),
                detail: Some(e.to_string()),
            };
        }
    };
    let mut req = client.get(&url);
    let key = state.config.search.api_key.trim();
    if !key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", key));
    }
    match req.send().await {
        Ok(resp) if resp.status().is_success() => DependencyHealth {
            status: "up".to_string(),
            detail: None,
        },
        Ok(resp) => DependencyHealth {
            status: "degraded".to_string(),
            detail: Some(format!("HTTP {}", resp.status())),
        },
        Err(e) => DependencyHealth {
            status: "down".to_string(),
            detail: Some(e.to_string()),
        },
    }
}

fn check_storage_config(state: &AppState) -> DependencyHealth {
    if state.config.storage.account_id.is_empty() {
        DependencyHealth {
            status: "skipped".to_string(),
            detail: Some("R2 미설정".to_string()),
        }
    } else {
        DependencyHealth {
            status: "up".to_string(),
            detail: None,
        }
    }
}

fn check_decoded_ai_config(state: &AppState) -> DependencyHealth {
    let url = state.config.ai_service.url.trim();
    if url.is_empty() {
        DependencyHealth {
            status: "skipped".to_string(),
            detail: None,
        }
    } else {
        DependencyHealth {
            status: "up".to_string(),
            detail: None,
        }
    }
}

/// 헬스체크 — DB·Meilisearch·스토리지 설정·decoded-ai gRPC URL 요약
#[utoipa::path(
    get,
    path = "/health",
    tag = "health",
    responses(
        (status = 200, description = "상태 요약", body = HealthResponse)
    )
)]
pub async fn health_check(State(state): State<AppState>) -> Json<HealthResponse> {
    let database = check_database(state.db.as_ref()).await;
    let meilisearch = check_meilisearch(&state).await;
    let storage = check_storage_config(&state);
    let decoded_ai_grpc = check_decoded_ai_config(&state);

    let critical_ok = database.status == "up";
    let overall = if critical_ok { "ok" } else { "degraded" };

    Json(HealthResponse {
        status: overall.to_string(),
        database,
        meilisearch,
        storage,
        decoded_ai_grpc,
    })
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;

    #[test]
    fn dependency_health_skips_detail_when_none() {
        let h = DependencyHealth {
            status: "up".into(),
            detail: None,
        };
        let v = serde_json::to_value(&h).unwrap();
        assert!(v.get("detail").is_none());
    }

    #[test]
    fn dependency_health_includes_detail_when_some() {
        let h = DependencyHealth {
            status: "down".into(),
            detail: Some("connection refused".into()),
        };
        let v = serde_json::to_value(&h).unwrap();
        assert_eq!(
            v.get("detail").and_then(|x| x.as_str()),
            Some("connection refused")
        );
    }

    #[tokio::test]
    async fn health_check_returns_ok_when_db_up() {
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let state = test_app_state(db);
        let Json(body) = health_check(axum::extract::State(state)).await;
        assert_eq!(body.database.status, "up");
        // storage account_id is non-empty in test_config, so storage status = up
        assert_eq!(body.storage.status, "up");
        // search_client is DummySearchClient → downcast fails → skipped
        assert_eq!(body.meilisearch.status, "skipped");
        // ai_service url in test_config is non-empty → up
        assert_eq!(body.decoded_ai_grpc.status, "up");
        assert_eq!(body.status, "ok");
    }

    #[tokio::test]
    async fn health_check_degraded_when_db_down() {
        use crate::tests::helpers::test_app_state;
        use sea_orm::{DatabaseBackend, MockDatabase};

        // No exec results → will error with "No mock result found"
        let db = MockDatabase::new(DatabaseBackend::Postgres).into_connection();
        let state = test_app_state(db);
        let Json(body) = health_check(axum::extract::State(state)).await;
        assert_eq!(body.database.status, "down");
        assert_eq!(body.status, "degraded");
        assert!(body.database.detail.is_some());
    }

    #[tokio::test]
    async fn health_check_skipped_storage_when_account_id_empty() {
        use crate::app_state::AppState;
        use crate::tests::helpers::{test_app_state, test_config};
        use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};

        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_exec_results([MockExecResult {
                last_insert_id: 0,
                rows_affected: 1,
            }])
            .into_connection();
        let base = test_app_state(db);
        let mut cfg = test_config();
        cfg.storage.account_id = String::new();
        cfg.ai_service.url = String::new();
        let state = AppState {
            config: cfg,
            ..base
        };
        let Json(body) = health_check(axum::extract::State(state)).await;
        assert_eq!(body.storage.status, "skipped");
        assert_eq!(body.decoded_ai_grpc.status, "skipped");
    }

    #[test]
    fn health_response_serializes_expected_shape() {
        let body = HealthResponse {
            status: "ok".into(),
            database: DependencyHealth {
                status: "up".into(),
                detail: None,
            },
            meilisearch: DependencyHealth {
                status: "skipped".into(),
                detail: Some("no client".into()),
            },
            storage: DependencyHealth {
                status: "up".into(),
                detail: None,
            },
            decoded_ai_grpc: DependencyHealth {
                status: "skipped".into(),
                detail: None,
            },
        };
        let v = serde_json::to_value(&body).unwrap();
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert!(v.get("database").is_some());
        assert!(v.get("meilisearch").is_some());
    }
}
