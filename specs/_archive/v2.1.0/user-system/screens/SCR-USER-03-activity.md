# [SCR-USER-03] 활동 내역 (Activity History)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-USER-03 |
| **경로** | `/profile/activity` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 사용자가 작성한 글, 답변, 즐겨찾기 목록 관리
- **선행 조건**: 로그인 상태
- **후속 화면**: 게시글 상세, 아이템 상세
- **관련 기능 ID**: [U-04](../spec.md#u-04-activity-history)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [ Header - CMN-01 참조 ]                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [ICON-BACK] Activity History                                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                ││
│  │ │   [TAB-01]     │ │   [TAB-02]     │ │   [TAB-03]     │                ││
│  │ │   My Posts     │ │   My Answers   │ │   Favorites    │                ││
│  │ │   (Active)     │ │                │ │                │                ││
│  │ └────────────────┘ └────────────────┘ └────────────────┘                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐  ││
│  │  │ [LIST-ITEM-01]                                                     │  ││
│  │  │ ┌──────────┐                                                       │  ││
│  │  │ │ [THUMB]  │  [TXT-TITLE] Post Title Here                          │  ││
│  │  │ │          │  [TXT-META] Jan 5, 2026 • 15 views • 💬 3             │  ││
│  │  │ │          │  [TAG-STATUS] Published                               │  ││
│  │  │ └──────────┘                                                       │  ││
│  │  └────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐  ││
│  │  │ [LIST-ITEM-02]                                                     │  ││
│  │  │ ┌──────────┐                                                       │  ││
│  │  │ │ [THUMB]  │  [TXT-TITLE] Another Post Title                       │  ││
│  │  │ │          │  [TXT-META] Jan 3, 2026 • Draft                       │  ││
│  │  │ │          │  [BTN-EDIT] Edit  [BTN-DELETE] Delete                 │  ││
│  │  │ └──────────┘                                                       │  ││
│  │  └────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐  ││
│  │  │ [LIST-ITEM-03]                                                     │  ││
│  │  │ ...                                                                │  ││
│  │  └────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐  ││
│  │  │                    [BTN-LOADMORE] Load More                        │  ││
│  │  └────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌────────────────────────────────┐
│  [←] Activity History          │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │[TAB-01][TAB-02][TAB-03]  │  │
│  │My Posts│Answers│Favorites│  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [THUMB] Post Title       │  │
│  │         Jan 5 • Published│  │
│  │         15 views • 💬 3  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [THUMB] Another Title    │  │
│  │         Jan 3 • Draft    │  │
│  │         [Edit] [Delete]  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [THUMB] ...              │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │     [Load More]          │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **ICON-BACK** | 아이콘 | 뒤로가기 | - Icon: Arrow Left (←)<br>- Size: 24×24px | **Click**: `/profile`로 이동 |
| **TAB-01** | 탭 | My Posts | - Active: Bold, Underline<br>- Inactive: Normal | **Click**: 작성한 게시글 리스트 로드<br>URL: `?tab=posts` |
| **TAB-02** | 탭 | My Answers | - Same as TAB-01 | **Click**: 작성한 답변 리스트 로드<br>URL: `?tab=answers` |
| **TAB-03** | 탭 | Favorites | - Same as TAB-01 | **Click**: 즐겨찾기 아이템 리스트 로드<br>URL: `?tab=favorites` |
| **LIST-ITEM** | 리스트 | 게시글 항목 | - BG: `surface-primary`<br>- Border-bottom: 1px `border-muted` | **Click**: 해당 게시글 상세 페이지로 이동<br>`/post/:id` |
| **THUMB** | 이미지 | 썸네일 | - Size: 80×80px (Desktop), 60×60px (Mobile)<br>- Border-radius: 8px | - |
| **TXT-TITLE** | 텍스트 | 게시글 제목 | - Font: Body Bold (16px)<br>- Color: `text-primary`<br>- Max: 1줄, ellipsis | - |
| **TXT-META** | 텍스트 | 메타 정보 | - Font: Caption (12px)<br>- Color: `text-muted` | 날짜, 조회수, 댓글수 표시 |
| **TAG-STATUS** | 태그 | 상태 표시 | - Published: Green<br>- Draft: Gray<br>- Pending: Yellow | - |
| **BTN-EDIT** | 버튼 | 수정 | - Style: Text Button<br>- Color: `text-link` | **Click**: 게시글 수정 페이지로 이동<br>Draft 상태에서만 표시 |
| **BTN-DELETE** | 버튼 | 삭제 | - Style: Text Button<br>- Color: `text-danger` | **Click**: 삭제 확인 모달 호출<br>확인 시 DELETE API → 리스트 갱신 |
| **BTN-LOADMORE** | 버튼 | 더보기 | - Style: Secondary<br>- Hidden: 데이터 없을 때 | **Click**: 페이지네이션 (`page + 1`)<br>데이터 추가 로드 |

### 탭별 리스트 아이템 차이

#### TAB-01: My Posts
```
┌──────────────────────────────────────────────────────────────┐
│ [THUMB] Post Title                                           │
│         Jan 5, 2026 • 15 views • 💬 3                        │
│         [Published] or [Draft] + [Edit] [Delete]             │
└──────────────────────────────────────────────────────────────┘
```

#### TAB-02: My Answers
```
┌──────────────────────────────────────────────────────────────┐
│ [THUMB] "이 재킷은 어떤 브랜드인가요?"                        │
│         Jan 5, 2026 • ✅ Accepted                             │
│         👍 12 votes                                           │
└──────────────────────────────────────────────────────────────┘
```

#### TAB-03: Favorites
```
┌──────────────────────────────────────────────────────────────┐
│ [THUMB] Item / Post Name                                     │
│         Added Jan 5, 2026                                    │
│         [🗑️ Remove from Favorites]                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 데이터 로딩 완료 | 리스트 정상 표시 |
| **로딩** | API 요청 중 | 스켈레톤 리스트 아이템 표시 |
| **빈 상태** | 데이터 0개 | Empty State 컴포넌트 표시 |
| **추가 로딩** | Load More 클릭 | 버튼에 스피너, 기존 리스트 유지 |
| **에러** | API 실패 | 에러 메시지 + 재시도 버튼 |

### 빈 상태 메시지

| 탭 | 메시지 | CTA |
|:---|:---|:---|
| My Posts | "아직 작성한 게시글이 없습니다" | [첫 게시글 작성하기] |
| My Answers | "아직 답변한 내역이 없습니다" | [질문에 답변하기] |
| Favorites | "즐겨찾기한 항목이 없습니다" | [탐색하러 가기] |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 게시글 목록 | GET | `/api/profile/posts?page=1&limit=20` | TAB-01 선택 시 | `{ posts: Post[], hasMore: boolean }` |
| 답변 목록 | GET | `/api/profile/answers?page=1&limit=20` | TAB-02 선택 시 | `{ answers: Answer[], hasMore: boolean }` |
| 즐겨찾기 목록 | GET | `/api/profile/favorites?page=1&limit=20` | TAB-03 선택 시 | `{ favorites: Favorite[], hasMore: boolean }` |
| 게시글 삭제 | DELETE | `/api/profile/posts/:id` | 삭제 확인 시 | `{ success: boolean }` |
| 즐겨찾기 해제 | DELETE | `/api/profile/favorites/:id` | 해제 클릭 시 | `{ success: boolean }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| React Query | `["profile", "posts", page]` | `QueryKey` | 게시글 캐시 |
| React Query | `["profile", "answers", page]` | `QueryKey` | 답변 캐시 |
| React Query | `["profile", "favorites", page]` | `QueryKey` | 즐겨찾기 캐시 |
| URL State | `tab` | `'posts' \| 'answers' \| 'favorites'` | 현재 활성 탭 |

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 401 | 인증 만료 | "세션이 만료되었습니다" | 로그인 페이지로 이동 |
| 404 | 삭제할 항목 없음 | "이미 삭제된 항목입니다" | 리스트 새로고침 |
| 500 | 서버 오류 | "일시적인 오류가 발생했습니다" | 재시도 버튼 표시 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**:
  - Tab으로 탭 간 이동
  - Arrow Left/Right로 탭 전환
  - Tab으로 리스트 아이템 간 이동
- **스크린 리더**:
  - 탭에 `role="tablist"`, `role="tab"` 적용
  - 리스트 아이템에 `aria-label` 제공
- **포커스 관리**: 탭 변경 시 리스트 첫 항목으로 포커스 이동

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | ActivityPage | `packages/web/app/profile/activity/page.tsx` |
| 탭 컴포넌트 | ActivityTabs | `packages/web/lib/components/profile/ActivityTabs.tsx` |
| 게시글 리스트 | PostList | `packages/web/lib/components/profile/PostList.tsx` |
| 답변 리스트 | AnswerList | `packages/web/lib/components/profile/AnswerList.tsx` |
| 즐겨찾기 리스트 | FavoriteList | `packages/web/lib/components/profile/FavoriteList.tsx` |
| 삭제 확인 모달 | DeleteConfirmModal | `packages/web/lib/components/modals/DeleteConfirmModal.tsx` |

---

## 9. 구현 체크리스트

- [ ] UI 레이아웃 구현
- [ ] 탭 네비게이션 구현
- [ ] My Posts API 연동
- [ ] My Answers API 연동
- [ ] Favorites API 연동
- [ ] 삭제 기능 구현
- [ ] 즐겨찾기 해제 구현
- [ ] 무한 스크롤 / Load More
- [ ] 빈 상태 처리
- [ ] 에러 처리
- [ ] 반응형 대응
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
