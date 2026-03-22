# Plan: decoded.pen 100% UI 구현

## Context

현재 사용자 페이지들이 decoded.pen 대비 65-90% 구현 상태. 전체 사용자 대상 페이지를 100% UI 완성해야 함.
백엔드 API 없는 기능(댓글, 좋아요, 팔로우 등)은 mock data로 UI만 구현.
Admin 페이지는 제외.

## 현재 상태

| 페이지 | 현재 | 목표 | 핵심 갭 |
|--------|------|------|---------|
| Home | 100% | 100% | - |
| Post Detail | 100% | 100% | - |
| Login | 90% | 100% | 미미한 갭 |
| Search | 85% | 100% | 트렌딩, 자동완성, 히스토리 관리 |
| Image Detail | 85% | 100% | 댓글, 투표, 소셜버튼 |
| Upload | 80% | 100% | 스텝 인디케이터, 모바일 옵션 |
| Explore | 75% | 100% | 필터바, 정렬, 카드 인터랙션 |
| Detect | 75% | 100% | 툴바, 감지카드, 바운딩박스 |
| Feed | 70% | 100% | 탭, 팔로우, 새 포스트 인디케이터 |
| Profile | 65% | 100% | 탭 콘텐츠, 바이오, 팔로워 |

## 10개 Quick Task 계획

### Quick-025: 공유 UI 기반 컴포넌트
**파일:** `lib/components/shared/` (신규 디렉토리)

생성:
- `ReportModal.tsx` — 신고 사유 라디오 + 상세 textarea + 제출
- `ShareModal.tsx` — 소셜 공유 버튼 (카카오, 트위터, 페이스북, 링크복사)
- `ConfirmDialog.tsx` — 범용 확인 다이얼로그 (위험 동작용)
- `CommentSection.tsx` — 댓글 목록 + 입력 + 중첩 답글 (mock data)
- `VotingButtons.tsx` — 정확도 투표 (👍/👎) + 퍼센티지 바
- `SocialActions.tsx` — 좋아요/저장/공유 버튼 그룹
- `FollowButton.tsx` — 팔로우/팔로잉 토글
- `AccountAvatar.tsx` — 원형 아바타 (이니셜 fallback)

수정:
- `app/providers.tsx` — `<Toaster />` 마운트 추가

---

### Quick-026: Explore 페이지 필터 시스템 (SCR-DISC-02)
**파일:** `lib/components/explore/`

생성:
- `ExploreFilterBar.tsx` — 4단계 캐스케이딩 드롭다운 (Category > Media > Cast > Context)
- `ExploreFilterSheet.tsx` — 모바일 BottomSheet 필터 (칩 선택)
- `ExploreSortControls.tsx` — 정렬 (Trending/Recent/Popular)
- `FilterChip.tsx` — 활성 필터 칩 (제거 가능)

수정:
- `app/explore/ExploreClient.tsx` — 필터바/시트/정렬 통합
- `lib/stores/filterStore.ts` — 계층적 필터 상태 추가

---

### Quick-027: Feed 페이지 완성
**파일:** `lib/components/feed/`

생성:
- `FeedTabs.tsx` — Following / For You / Trending 탭
- `NewPostsIndicator.tsx` — "새 포스트" 플로팅 배너

수정:
- `FeedCard.tsx` — 상단에 AccountAvatar + FollowButton 추가
- `app/feed/FeedClient.tsx` — 탭 통합, 탭별 mock 필터링

참고: FeedCard에 이미 좋아요/댓글/공유 버튼 존재 (engagement state 구현됨)

---

### Quick-028: Search 페이지 완성 (SCR-DISC-03)
**파일:** `lib/components/search/`

생성:
- `TrendingSearches.tsx` — 인기 검색어 칩 그리드 (쿼리 없을 때 표시)
- `SearchSuggestions.tsx` — 자동완성 드롭다운

수정:
- `SearchPageClient.tsx` — 트렌딩 섹션 통합, 결과 카운트 배지
- `RecentSearches.tsx` — 개별 삭제 + 전체 삭제 버튼

---

### Quick-029: Image Detail 소셜 & 댓글 (SCR-VIEW-03/04)
**파일:** `lib/components/detail/`

생성:
- `ImageCommentSection.tsx` — 댓글 섹션 (CommentSection 래핑, mock data)
- `ItemVoting.tsx` — 아이템별 정확도 투표
- `SmartTagsBreadcrumb.tsx` — Media > Cast > Context 경로
- `AddVibeModal.tsx` — URL 입력 + 상품 프리뷰 + 제출

수정:
- `ImageDetailContent.tsx` — SocialActions, CommentSection, SmartTags, Voting 통합
- `ImageDetailPage.tsx` — SocialActions 버튼 추가 (like/save)

---

### Quick-030: Post Detail 소셜 & 댓글
**파일:** `lib/components/detail/`

수정:
- `PostDetailContent.tsx` — SocialActions, FollowButton, 댓글 섹션, engagement 카운트 추가
- `PostDetailPage.tsx` — Report 버튼을 ReportModal과 연결

---

### Quick-031: Profile 페이지 완성 (SCR-USER-02)
**파일:** `lib/components/profile/`

생성:
- `ProfileBio.tsx` — 바이오 텍스트 + 소셜 링크 (인스타, 트위터 등)
- `FollowStats.tsx` — 팔로워/팔로잉 카운트
- `PostsGrid.tsx` — 내 포스트 masonry 그리드 (mock data)
- `SpotsList.tsx` — 내 스팟 리스트 (썸네일 + 메타)
- `SolutionsList.tsx` — 내 솔루션 리스트
- `SavedGrid.tsx` — 저장한 이미지/포스트 그리드 (mock data)

수정:
- `ProfileClient.tsx` — 바이오, 팔로우 통계, 탭 콘텐츠 통합
- `ProfileHeader.tsx` — 공유 프로필 버튼

---

### Quick-032: Request Flow 완성 (SCR-CREA-01/02)
**파일:** `lib/components/request/`, `app/request/`

생성:
- `StepProgress.tsx` — 4단계 프로그레스 도트
- `DetectionToolbar.tsx` — 선택/그리기/확대 도구
- `MobileUploadOptions.tsx` — 카메라/갤러리/URL 버튼 그리드

수정:
- `app/request/upload/page.tsx` — StepProgress, MobileUploadOptions 통합
- `app/request/detect/page.tsx` — 감지 카드에 카테고리 드롭다운 + 신뢰도 배지

---

### Quick-033: Header & Navigation 강화
**파일:** `lib/design-system/`, `lib/components/`

수정:
- `desktop-header.tsx` — 유저 드롭다운 메뉴 (프로필, 활동, 설정, 로그아웃), 알림 벨 + 배지
- `mobile-header.tsx` — 알림 벨 추가

---

### Quick-034: 최종 폴리시
- 전 페이지 빈 상태(Empty State) 점검 및 통일
- 스켈레톤 로딩 완성도 확인
- 반응형 테스트 (375px, 768px, 1280px, 1440px)
- 접근성 (ARIA, 키보드 네비게이션, 포커스 관리)

## 실행 순서 & 의존성

```
Quick-025 (공유 기반) ← 먼저 실행 (다른 태스크들이 의존)
    ↓
Quick-026~033 (페이지별) ← 병렬 가능하나 순차 실행 권장
    ↓
Quick-034 (폴리시) ← 마지막
```

의존 관계:
- Quick-026~033 모두 Quick-025의 공유 컴포넌트에 의존
- Quick-027 (Feed)은 Quick-025의 FollowButton/AccountAvatar에 의존
- Quick-029/030 (Detail)은 Quick-025의 CommentSection/SocialActions에 의존
- Quick-031 (Profile)은 Quick-025의 FollowButton에 의존

## 검증 방법

각 Quick Task 완료 시:
1. `yarn build` — 빌드 성공 확인
2. `yarn lint` — 린트 통과
3. 해당 페이지 브라우저 확인 (반응형 3개 뷰포트)
4. decoded.pen 스크린샷과 시각 대조

전체 완료 후:
- Playwright visual QA 재실행 (기존 v2-09-03 인프라 활용)
- 4개 브레이크포인트 전체 스크린샷
