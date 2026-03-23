//! decoded-ai (inbound) gRPC 호출 메트릭 — `tracing` 기반 구조화 이벤트 (대시보드/로그 수집기에서 집계 가능)

use std::time::Duration;

/// decoded-ai gRPC 한 번의 호출을 기록합니다. (`target = metrics.grpc.decoded_ai` 로 필터링)
pub fn record_decoded_ai_call(method: &'static str, ok: bool, elapsed: Duration) {
    tracing::info!(
        target: "metrics.grpc.decoded_ai",
        grpc_service = "decoded_ai",
        grpc_method = method,
        ok = ok,
        elapsed_ms = elapsed.as_millis() as u64,
        "decoded_ai grpc call"
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn record_decoded_ai_call_is_safe_to_invoke() {
        record_decoded_ai_call("unit_test", false, Duration::from_millis(12));
    }
}
