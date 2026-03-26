# Phase 47: Follow System Frontend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

프론트엔드에서 실제 팔로워/팔로잉 수가 표시되고 하드코딩이 제거된다. OpenAPI spec 업데이트 + Orval 재생성 + FollowStats 실데이터 연결.

</domain>

<decisions>
## Implementation Decisions

### OpenAPI Spec Update
- 백엔드에서 `cargo run`으로 서버 실행 → `/api-docs/openapi.json` 엔드포인트에서 최신 spec 다운로드
- `packages/api-server/openapi.json`에 복사
- `cd packages/web && bun run generate:api`로 Orval 재생성
- 재생성된 `UserResponse` 타입에 `followers_count`/`following_count` 필드 자동 포함

### FollowStats Data Connection
- 내 프로필 (`ProfileClient.tsx`): `useMe()` 반환값의 `followers_count`/`following_count`를 FollowStats props로 전달
- 공개 프로필 (`PublicProfileClient.tsx`): `useUser(userId)` 반환값에서 동일 필드 전달 (Phase 45에서 이미 FollowStats 포함)
- FollowStats.tsx: default parameter를 `1234`/`567` → `0`으로 변경

### Claude's Discretion
- openapi.json 생성 시 서버 실행 없이 cargo utoipa 직접 생성 가능 여부 판단
- FollowStats 렌더링 시 로딩 상태 처리 방식

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Frontend Components
- `packages/web/lib/components/profile/FollowStats.tsx` — 현재 하드코딩 (1234/567) 포함
- `packages/web/app/profile/ProfileClient.tsx` — 내 프로필 클라이언트
- `packages/web/app/profile/[userId]/PublicProfileClient.tsx` — 공개 프로필 클라이언트

### API Generation Pipeline
- `packages/web/orval.config.ts` — Orval 설정
- `packages/api-server/openapi.json` — OpenAPI spec source of truth
- `packages/web/lib/api/generated/` — 자동 생성 코드 (수동 편집 금지)

### Requirements
- `.planning/REQUIREMENTS.md` — FLLW-04, FLLW-05 정의

### Prior Phase
- `.planning/phases/46-follow-system-backend/46-01-SUMMARY.md` — Backend 구현 요약 (UserResponse에 follow count 추가됨)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FollowStats` 컴포넌트: 이미 `followers`/`following` props 수용 — default 값만 변경 필요
- Orval 파이프라인: `bun run generate:api` — 이미 구축됨
- `useMe()`, `useUser(userId)` hooks: UserResponse 반환 — 새 필드 자동 포함

### Established Patterns
- Orval 코드 생성 후 import 경로: `@/lib/api/generated/{tag}/{operationId}`
- UserResponse 타입은 생성 코드에서 자동 export

### Integration Points
- `ProfileClient.tsx`: useMe() → data.followers_count/following_count → FollowStats props
- `PublicProfileClient.tsx`: useUser(userId) → data.followers_count/following_count → FollowStats props (Phase 45 구현에서 이미 FollowStats 포함)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward data connection

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 47-follow-system-frontend*
*Context gathered: 2026-03-26*
