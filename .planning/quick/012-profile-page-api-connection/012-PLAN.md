# Quick Task 012: Profile Page API Connection

## Task Description
프로필 페이지를 REST API와 연결하여 실제 데이터를 표시

## Current State
- `useProfile.ts` 훅이 존재: `useMe()`, `useUserStats()`, `useUserActivities()`, `useUpdateProfile()`
- `profileStore.ts`에 `setUserFromApi()`, `setStatsFromApi()` 액션 존재
- Profile 페이지는 Mock 데이터(`MOCK_USER`, `MOCK_STATS`)만 사용 중
- API 엔드포인트: `/api/v1/users/me`, `/api/v1/users/me/stats`

## Implementation Plan

### Task 1: Create ProfileClient Component
**File:** `packages/web/app/profile/ProfileClient.tsx`

새 Client 컴포넌트 생성:
- `useMe()` 훅으로 사용자 정보 가져오기
- `useUserStats()` 훅으로 통계 가져오기
- 데이터 로드 시 `profileStore.setUserFromApi()`, `setStatsFromApi()` 호출
- Loading/Error 상태 처리
- 기존 레이아웃 및 컴포넌트 유지

### Task 2: Update Profile Page to Use ProfileClient
**File:** `packages/web/app/profile/page.tsx`

- `ProfileClient` import 및 렌더링
- 기존 로직을 `ProfileClient`로 이동
- Page는 서버 컴포넌트로 유지 (메타데이터 등)

### Task 3: Sync Store on Data Load
기존 컴포넌트(`ProfileHeader`, `StatsCards`)는 이미 `profileStore`에서 데이터를 읽으므로
`ProfileClient`에서 API 데이터를 store에 동기화하면 자동으로 UI 업데이트

## Files to Modify
1. **Create:** `packages/web/app/profile/ProfileClient.tsx`
2. **Modify:** `packages/web/app/profile/page.tsx`

## Dependencies
- React Query (already set up)
- `useMe()`, `useUserStats()` hooks (already exist)
- `profileStore` actions (already exist)

## Verification
- [ ] Profile 페이지 로드 시 API 호출 확인 (Network 탭)
- [ ] 로그인된 사용자 정보 표시
- [ ] Stats 카드에 실제 데이터 표시
- [ ] 로딩 상태 표시
- [ ] 에러 상태 처리
