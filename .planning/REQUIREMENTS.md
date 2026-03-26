# Requirements: decoded-monorepo v10.0 Profile Page Completion

**Defined:** 2026-03-26
**Core Value:** 완전한 사용자 경험 — 프로필 페이지의 모든 기능이 실제 데이터로 동작

## v10.0 Requirements

### Auth & Routing

- [ ] **AUTH-01**: `/profile` 라우트를 `proxy.ts` matcher에 추가하여 미로그인 시 `/login?redirect=/profile`로 리다이렉트
- [ ] **AUTH-02**: `ProfileClient.tsx`에서 401 에러 시 로그인 페이지로 리다이렉트 (현재: 에러 UI만 표시)
- [ ] **ROUTE-01**: `app/profile/[userId]/page.tsx` 생성 — 기존 `useUser(userId)` hook + API proxy 활용
- [ ] **ROUTE-02**: 공개 프로필에서 비공개 항목(Saved, Ink 크레딧, 프로필 수정) 숨김

### Follow System

- [ ] **FLLW-01**: Supabase `user_follows` 테이블 생성 (마이그레이션 SQL)
- [ ] **FLLW-02**: Rust 백엔드 Follow API 구현 (`GET /users/{id}/followers/count`, `GET /users/{id}/following/count`)
- [ ] **FLLW-03**: `UserResponse`에 `followers_count`/`following_count` 필드 추가
- [ ] **FLLW-04**: OpenAPI spec 업데이트 + Orval 재생성
- [ ] **FLLW-05**: `FollowStats.tsx` 하드코딩(`1234`/`567`) 제거, 실제 데이터 연결

### Activity Tabs — Tries

- [ ] **TRIES-01**: Rust 백엔드 `GET /api/v1/users/me/tries` 엔드포인트 구현 (페이지네이션)
- [ ] **TRIES-02**: OpenAPI spec 반영 + Orval hook 생성
- [ ] **TRIES-03**: `TriesGrid.tsx` 타입 수정 (`result_image_url` → `image_url`, `item_count` 제거)
- [ ] **TRIES-04**: 무한스크롤 연결 (useInfiniteQuery 패턴)
- [ ] **TRIES-05**: 스텁 코드(`fetchMyTries → []`) 완전 제거

### Activity Tabs — Saved

- [ ] **SAVED-01**: Rust 백엔드 `GET /api/v1/users/me/saved` 엔드포인트 구현 (기존 `saved_posts` 테이블 활용, 페이지네이션)
- [ ] **SAVED-02**: OpenAPI spec 반영 + Orval hook 생성
- [ ] **SAVED-03**: `SavedGrid.tsx`를 실제 데이터 기반으로 재구현
- [ ] **SAVED-04**: `collectionStore.ts` MOCK_PINS/MOCK_BOARDS 완전 제거
- [ ] **SAVED-05**: 무한스크롤 연결

## Future Requirements (v10.1+)

### Follow Write System

- **FLLW-W01**: 팔로우/언팔로우 API 엔드포인트 (`POST/DELETE /users/{id}/follow`)
- **FLLW-W02**: 팔로우 버튼 동작 연결 (optimistic update)
- **FLLW-W03**: 팔로워/팔로잉 목록 페이지

### Profile Enhancements

- **PROF-E01**: 프로필 사진 파일 업로드 (현재 URL 입력)
- **PROF-E02**: 소셜 계정 연동 관리 UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| 팔로우/언팔로우 write 액션 | v10.1 — read count 우선 |
| 팔로워/팔로잉 목록 페이지 | 별도 마일스톤 |
| Pins & Boards 컨셉 | mock 제거 후 단순 saved posts 그리드로 대체 |
| 프로필 사진 파일 업로드 | 현재 URL 입력 방식 유지 |
| DM / 메시지 시스템 | 별도 마일스톤 |
| 실시간 알림 | 별도 마일스톤 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 44 | Pending |
| AUTH-02 | Phase 44 | Pending |
| ROUTE-01 | Phase 45 | Pending |
| ROUTE-02 | Phase 45 | Pending |
| FLLW-01 | Phase 46 | Pending |
| FLLW-02 | Phase 46 | Pending |
| FLLW-03 | Phase 46 | Pending |
| FLLW-04 | Phase 47 | Pending |
| FLLW-05 | Phase 47 | Pending |
| TRIES-01 | Phase 48 | Pending |
| TRIES-02 | Phase 48 | Pending |
| TRIES-03 | Phase 49 | Pending |
| TRIES-04 | Phase 49 | Pending |
| TRIES-05 | Phase 49 | Pending |
| SAVED-01 | Phase 48 | Pending |
| SAVED-02 | Phase 48 | Pending |
| SAVED-03 | Phase 50 | Pending |
| SAVED-04 | Phase 50 | Pending |
| SAVED-05 | Phase 50 | Pending |

**Coverage:**
- v10.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation (7 phases, 44-50)*
