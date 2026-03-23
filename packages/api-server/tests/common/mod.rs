//! 통합 테스트 공통 — `tests/integration_*.rs` 전용 (실제 `DATABASE_URL` 필요)
//!
//! 라이브러리 단위 테스트(`src/**/tests.rs`)에서는 사용하지 마세요.

use decoded_api::{AppConfig, AppState};

/// Supabase 관련 변수 기본값 (미설정일 때만). `AppConfig::from_env()`가 `.env.dev` 후 `.env`를 로드합니다.
pub fn ensure_integration_env() {
    if std::env::var("SUPABASE_URL").is_err() {
        std::env::set_var("SUPABASE_URL", "http://localhost:54321");
    }
    if std::env::var("SUPABASE_ANON_KEY").is_err() {
        std::env::set_var("SUPABASE_ANON_KEY", "test-anon-key");
    }
    if std::env::var("SUPABASE_SERVICE_ROLE_KEY").is_err() {
        std::env::set_var("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    }
    if std::env::var("SUPABASE_JWT_SECRET").is_err() {
        std::env::set_var("SUPABASE_JWT_SECRET", "test-jwt-secret");
    }
}

/// `DATABASE_URL` 등이 설정된 환경에서만 사용. 스크립트 `scripts/run-integration-tests.sh` 참고.
pub async fn create_integration_state() -> AppState {
    ensure_integration_env();
    let config = AppConfig::from_env().expect(
        "통합 테스트: DATABASE_URL, SUPABASE_* 등이 필요합니다. scripts/run-integration-tests.sh 실행 또는 .env 설정",
    );
    AppState::new(config)
        .await
        .expect("DB 연결 실패 — PostgreSQL이 떠 있고 마이그레이션이 적용되었는지 확인하세요")
}
