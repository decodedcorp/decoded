# 기술 부채 추적

> 상세 템플릿은 [QUALITY_SCORE.md](../QUALITY_SCORE.md)와 연동합니다.

| ID | 영역 | 설명 | 심각도 | 상태 |
|----|------|------|--------|------|
| TD-001 | 예시 | 레거시 핸들러 분리 | 낮음 | 열림 |
| TD-002 | Clippy | `pre-push`에 `cargo clippy --all-targets -- -D warnings` 반영 | 중간 | 완료 |
| TD-003 | cargo-deny | `cargo deny check` (라이선스·advisory); `deny.toml`에 예외·`private.ignore` 반영 | 낮음 | 완료 |
| TD-004 | Clippy `disallowed_methods` | `pre-push`에서 `-A` 제거; SeaORM 엔티티·`json!` 등은 모듈 단위 allow | 중간 | 완료 |
