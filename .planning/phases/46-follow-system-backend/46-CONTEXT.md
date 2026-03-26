# Phase 46: Follow System Backend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`user_follows` 테이블과 Follow count를 `UserResponse`에 포함하여 팔로워/팔로잉 수를 조회할 수 있다. Follow/unfollow write API는 v10.1 scope (FLLW-W01).

</domain>

<decisions>
## Implementation Decisions

### Table Schema
- `user_follows` 테이블: `follower_id UUID REFERENCES auth.users(id)`, `following_id UUID REFERENCES auth.users(id)`, `created_at TIMESTAMPTZ DEFAULT now()`
- Primary key: `(follower_id, following_id)` — 복합 PK로 중복 팔로우 방지
- 인덱스: `follower_id`와 `following_id` 각각 별도 인덱스 (count 쿼리 성능)
- RLS: `SELECT` 전체 공개 (모든 유저가 count 조회 가능)

### API Response Structure
- 별도 count endpoint(`/followers/count`) 생성하지 않음
- `UserResponse`에 `followers_count: i64`와 `following_count: i64` 필드 추가
- count는 SQL COUNT 서브쿼리로 실시간 계산 (캐싱 불필요)
- `get_user_profile`과 `get_my_profile` 서비스 함수에서 count 포함

### OpenAPI Spec
- `UserResponse` 스키마에 새 필드 반영
- utoipa `#[schema]` 어노테이션 업데이트

### Claude's Discretion
- SQL 마이그레이션 파일 번호/위치
- SeaORM entity 생성 여부 (단순 count 쿼리면 raw SQL 충분)
- 서비스 레이어 함수 시그니처

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Structure
- `packages/api-server/AGENT.md` — Rust API 코딩 규칙, 마이그레이션 UUID 명시, utoipa 규칙
- `packages/api-server/src/domains/users/dto.rs` — UserResponse 구조체 정의
- `packages/api-server/src/domains/users/service.rs` — 사용자 서비스 로직
- `packages/api-server/src/domains/users/handlers.rs` — 사용자 핸들러
- `packages/api-server/src/router.rs` — 라우터 설정

### Migrations
- `packages/api-server/migration/sql/` — 기존 SQL 마이그레이션 패턴 참조

### Requirements
- `.planning/REQUIREMENTS.md` — FLLW-01, FLLW-02, FLLW-03 정의

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `domains/users/` 모듈: handlers.rs, service.rs, dto.rs, tests.rs — 기존 사용자 도메인 패턴 따름
- `migration/sql/` 디렉토리: SQL 마이그레이션 파일 패턴 (번호 접두사)
- `openapi.rs`: utoipa 기반 OpenAPI 스키마 생성

### Established Patterns
- Domain 기반 구조: `domains/{name}/` 하위에 handlers, service, dto, tests
- `UserResponse` struct with `#[derive(Serialize, Deserialize, ToSchema)]`
- `#[serde(skip_serializing_if = "Option::is_none")]` 패턴 사용
- Axum v0.7 경로 파라미터 `{param}` 형식

### Integration Points
- `UserResponse` 확장 → 기존 모든 user 관련 API 응답에 count 포함
- `openapi.json` 자동 생성 → Phase 47에서 Orval 재생성 시 프론트엔드 반영

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Follow/unfollow write API (POST/DELETE) — v10.1 FLLW-W01
- 팔로워/팔로잉 목록 페이지 — 별도 마일스톤

</deferred>

---

*Phase: 46-follow-system-backend*
*Context gathered: 2026-03-26*
