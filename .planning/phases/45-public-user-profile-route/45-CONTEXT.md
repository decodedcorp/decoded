# Phase 45: Public User Profile Route - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`/profile/[userId]`에서 다른 유저의 공개 프로필을 조회할 수 있고, 비공개 항목은 숨김 처리된다. 팔로우 버튼, 활동 탭 구현은 별도 phase.

</domain>

<decisions>
## Implementation Decisions

### Profile Content Visibility
- 타인 프로필: 프로필 헤더(아바타, 닉네임) + ProfileBio + FollowStats(숫자만) + BadgeGrid + RankingList 공개
- 타인 프로필 숨김: Saved 탭, Ink 크레딧(InkEconomyCard), 프로필 수정 버튼(Settings), ActivityTabs 전체
- StatsCards와 ArchiveStats는 공개 (포스트/스팟/솔루션 개수)
- StyleDNACard는 공개 (읽기 전용)

### Error & Edge Cases
- 존재하지 않는 userId: 전용 NotFound UI (일러스트 + 홈 이동 버튼)
- 자신의 userId로 접근 시: `/profile`로 리디렉트 (중복 페이지 방지)
- 현재 비공개 프로필 개념 없음 — 모든 유저 프로필은 공개

### Route Structure
- `app/profile/[userId]/page.tsx` — Server Component (메타데이터 + PublicProfileClient 렌더)
- `PublicProfileClient.tsx` — 기존 ProfileClient를 참조하되, isOwner=false 분기로 비공개 항목 숨김
- 기존 `/profile` (내 프로필)은 변경하지 않음

### Claude's Discretion
- PublicProfileClient를 새로 만들지 vs ProfileClient에 userId prop 추가하여 공용화할지
- 404 일러스트 디자인
- 로딩 스켈레톤 구성

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Profile System
- `.planning/REQUIREMENTS.md` — ROUTE-01, ROUTE-02 요구사항 정의
- `packages/web/app/profile/ProfileClient.tsx` — 현재 프로필 클라이언트 구현 (비공개/공개 분기 기준)
- `packages/web/lib/hooks/useProfile.ts` — useUser(userId) hook 이미 구현됨, useGetUserProfile 활용

### Auth Guard (Phase 44)
- `packages/web/proxy.ts` — /profile 라우트 보호 패턴 (Phase 45는 auth 불필요 — 공개 라우트)
- `.planning/phases/44-auth-guard/44-01-SUMMARY.md` — auth guard 구현 요약

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useUser(userId)` hook: `useGetUserProfile` 생성 API 사용, 이미 구현됨
- `ProfileHeader`, `ProfileBio`, `FollowStats`, `StatsCards`, `BadgeGrid`, `RankingList`: 기존 컴포넌트 재사용 가능
- `StyleDNACard`, `ArchiveStats`: 공개 프로필에서도 사용 가능
- `ProfileSkeleton`: 로딩 상태 재사용 가능

### Established Patterns
- ProfileClient는 `useMe()` hook으로 현재 사용자 데이터 로드
- 공개 프로필은 `useUser(userId)`로 타 사용자 데이터 로드
- React Query 기반 데이터 페칭 + Zustand profileStore 동기화

### Integration Points
- `app/profile/[userId]/page.tsx` — Next.js dynamic route 추가
- proxy.ts — /profile/[userId]는 공개 라우트이므로 auth guard 불필요
- NavBar — 프로필 링크 패턴 (/profile → 내 프로필, /profile/{id} → 타인)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 45-public-user-profile-route*
*Context gathered: 2026-03-26*
