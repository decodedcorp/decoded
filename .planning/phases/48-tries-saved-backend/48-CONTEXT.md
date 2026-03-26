# Phase 48: Tries & Saved Backend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tries/Saved list API 엔드포인트 구현 + OpenAPI spec 반영 + Orval 재생성. 프론트엔드 연결은 Phase 49, 50에서 처리.

</domain>

<decisions>
## Implementation Decisions

### Tries Endpoint
- `GET /api/v1/users/me/tries` — 인증 필요 (내 VTON 히스토리)
- `user_tryon_history` 테이블 기반 — Supabase에 테이블 존재 여부 확인 필요, 없으면 마이그레이션 생성
- 응답: PaginatedResponse<TryItem> with `page`, `per_page`, `total_pages`, `total_count`
- TryItem 필드: id, image_url, created_at (최소한의 필드 — 실제 테이블 스키마에 맞춤)

### Saved Endpoint
- `GET /api/v1/users/me/saved` — 인증 필요 (내 저장 포스트)
- 기존 `saved_posts` 엔티티/서비스 활용 — save/unsave 서비스 위에 list 기능 추가
- 응답: PaginatedResponse<SavedItem> — saved_posts JOIN posts로 포스트 기본 정보 포함
- SavedItem 필드: id, post_id, post_title, post_thumbnail_url, saved_at

### Pagination Pattern
- `page` (1-based), `per_page` (기본 20, 최대 50) 쿼리 파라미터
- 기존 활동 API (`getMyActivities`) 페이지네이션 패턴 따름
- `PaginationMeta { current_page, per_page, total_pages, total_count }` 응답 구조

### OpenAPI + Orval
- 두 엔드포인트 구현 후 openapi.json 업데이트
- `bun run generate:api`로 Orval 재생성 — `useGetMyTries`, `useGetMySaved` hook 자동 생성

### Claude's Discretion
- `user_tryon_history` 테이블이 없는 경우 마이그레이션 DDL 구조
- SeaORM 엔티티 생성 vs raw SQL 선택
- TryItem/SavedItem DTO 상세 필드 (실제 테이블 스키마 기준)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Structure
- `packages/api-server/AGENT.md` — Rust API 코딩 규칙
- `packages/api-server/src/domains/saved_posts/service.rs` — 기존 save/unsave 서비스
- `packages/api-server/src/entities/saved_posts.rs` — saved_posts SeaORM 엔티티
- `packages/api-server/src/domains/users/handlers.rs` — 사용자 핸들러 패턴 참조
- `packages/api-server/src/router.rs` — 라우터 등록 패턴

### Requirements
- `.planning/REQUIREMENTS.md` — TRIES-01, TRIES-02, SAVED-01, SAVED-02 정의

### Prior Phase (API gen pipeline)
- `.planning/phases/47-follow-system-frontend/47-01-SUMMARY.md` — OpenAPI + Orval 재생성 프로세스

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `saved_posts` 도메인: 엔티티, 서비스(save/unsave), 테스트 이미 존재
- `getMyActivities` 패턴: 기존 페이지네이션 응답 구조 참조 가능
- Orval 파이프라인: `bun run generate:api` 이미 구축

### Established Patterns
- Domain 구조: `domains/{name}/` 하위 handlers, service, dto
- SeaORM 엔티티 + `#[derive(ToSchema)]` utoipa 통합
- PaginatedResponse 패턴 (activities API 참조)

### Integration Points
- `router.rs`에 새 라우트 등록 (인증 필요)
- `openapi.rs`에 새 DTO 등록 (자동 반영 가능)
- `openapi.json` 업데이트 → Orval 재생성

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard backend pagination endpoints

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 48-tries-saved-backend*
*Context gathered: 2026-03-26*
