# [CMN-01] 헤더 (Global Header)

| 항목 | 내용 |
|------|------|
| **문서 ID** | CMN-01 |
| **컴포넌트명** | 글로벌 헤더 |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 컴포넌트 개요

- **목적**: 전역 네비게이션, 검색, 사용자 메뉴 제공
- **사용 위치**: 모든 페이지 상단 (관리자 페이지 제외)
- **반응형**: 데스크톱/모바일 별도 레이아웃

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px) - 로그아웃 상태

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌────────┐                                                                         │
│  │ DECODED│   [Home]  [Discover]  [Create]          🔍 Search...        [Login]    │
│  │  LOGO  │   [NAV-HOME] [NAV-DISCOVER] [NAV-CREATE]  [SEARCH-BAR]     [BTN-LOGIN] │
│  └────────┘                                                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 데스크톱 (≥768px) - 로그인 상태

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌────────┐                                                                         │
│  │ DECODED│   [Home]  [Discover]  [Create]    🔍 Search...    🔔(3)  [Avatar ▼]   │
│  │  LOGO  │                                   [SEARCH-BAR]  [NOTIF] [USER-MENU]   │
│  └────────┘                                                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 검색바 확장 상태

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌────────┐   ┌─────────────────────────────────────────────────────────────────┐  │
│  │ DECODED│   │ 🔍 blackpink jennie                                         [✕] │  │
│  │  LOGO  │   └─────────────────────────────────────────────────────────────────┘  │
│  └────────┘                                                                         │
│             ┌─────────────────────────────────────────────────────────────────────┐ │
│             │ Recent Searches                                                      │ │
│             │ [blackpink] [airport fashion] [gucci]                               │ │
│             │                                                                      │ │
│             │ Popular                                                              │ │
│             │ [NewJeans] [IVE Wonyoung] [Airport] [Gucci]                        │ │
│             │                                                                      │ │
│             │ Suggested                                                            │ │
│             │ ┌────────────────────────────────────────────────────────────────┐  │ │
│             │ │ 🎵 BLACKPINK                                          Group   │  │ │
│             │ │ 👤 Jennie (BLACKPINK)                                 Cast    │  │ │
│             │ │ 📸 BLACKPINK Jennie Airport                           Post    │  │ │
│             │ └────────────────────────────────────────────────────────────────┘  │ │
│             └─────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 사용자 드롭다운 메뉴

```
                                                      ┌─────────────────────────────┐
                                                      │ [Avatar]                    │
                                                      │ username                    │
                                                      │ user@email.com              │
                                                      ├─────────────────────────────┤
                                                      │ 👤 My Profile               │
                                                      │ 📊 My Activity              │
                                                      │ 💰 Earnings                 │
                                                      │ ⚙️ Settings                 │
                                                      ├─────────────────────────────┤
                                                      │ 🚪 Log Out                  │
                                                      └─────────────────────────────┘
```

### 2.5 알림 패널

```
                                                   ┌────────────────────────────────┐
                                                   │ Notifications              [✕] │
                                                   ├────────────────────────────────┤
                                                   │ ┌──────────────────────────┐  │
                                                   │ │ • Your post was approved │  │
                                                   │ │   2 minutes ago          │  │
                                                   │ └──────────────────────────┘  │
                                                   │ ┌──────────────────────────┐  │
                                                   │ │ • New comment on your    │  │
                                                   │ │   post                   │  │
                                                   │ │   15 minutes ago         │  │
                                                   │ └──────────────────────────┘  │
                                                   │ ┌──────────────────────────┐  │
                                                   │ │ • Withdrawal processed   │  │
                                                   │ │   1 hour ago             │  │
                                                   │ └──────────────────────────┘  │
                                                   │                               │
                                                   │ [View All Notifications]      │
                                                   └────────────────────────────────┘
```

### 2.6 모바일 (<768px)

> **Note**: 모바일에서는 간소화된 상단 헤더만 표시합니다.
> 주요 네비게이션은 하단의 MobileNavBar로 이동했습니다. ([CMN-03 참조](./CMN-03-mobile-nav.md))

```
┌─────────────────────────────────┐
│ [LOGO]              [Theme] [⋮]│  ← 간소화된 헤더
│                    [THEME][MORE]│
└─────────────────────────────────┘
```

**모바일에서 숨겨지는 요소:**
- 네비게이션 링크 (Home, Explore) → MobileNavBar로 이동
- 검색 입력 (SearchInput)
- 필터 (HierarchicalFilter)
- 스폰서 배너 (SponsorBanner)

**모바일에서 표시되는 요소:**
- 로고 (DECODED)
- 테마 토글 (Sun/Moon)
- 더보기 메뉴 (MoreMenu)

**하단 네비게이션 바 (별도 컴포넌트):**
```
┌─────────────────────────────────────────┐
│   [Home]  [Search]  [Plus]  [User]      │  ← MobileNavBar
│   (active)          (disabled)(disabled)│     (CMN-03 참조)
└─────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 로고/브랜딩

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| LOGO | 이미지 | 로고 | height: 32px, clickable | 클릭 시 홈으로 이동 |

### 3.2 네비게이션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| NAV-HOME | 링크 | Home | 현재 페이지 시 active 스타일 | `/` 이동 |
| NAV-DISCOVER | 링크 | Discover | 현재 페이지 시 active 스타일 | `/discover` 이동 |
| NAV-CREATE | 링크 | Create | 로그인 필요, 미로그인 시 로그인 유도 | `/create/upload` 이동 |

### 3.3 검색

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| SEARCH-BAR | 입력 | 검색바 | placeholder: "Search...", width: 300px | 포커스 시 확장 |
| SEARCH-INPUT | 입력 | 검색 입력 | autofocus when expanded | 입력 시 자동완성 |
| BTN-SEARCH-CLEAR | 버튼 | 지우기 | Icon: X, 입력 있을 때만 표시 | 검색어 초기화 |
| SEARCH-DROPDOWN | 드롭다운 | 검색 드롭다운 | 최근/인기/제안 섹션 | - |
| CHIP-RECENT | 칩 | 최근 검색 | 삭제 가능 | 클릭 시 검색 |
| CHIP-POPULAR | 칩 | 인기 검색 | - | 클릭 시 검색 |
| SEARCH-RESULT | 목록 | 검색 제안 | Media/Cast/Post 타입별 아이콘 | 클릭 시 해당 페이지 |

### 3.4 사용자 영역

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-LOGIN | 버튼 | 로그인 | variant: outline, 미로그인 시 표시 | 로그인 모달 열기 |
| BTN-NOTIF | 버튼 | 알림 | Icon: Bell, Badge: 미확인 수 | 알림 패널 토글 |
| USER-MENU | 드롭다운 | 사용자 메뉴 | Avatar + 화살표 | 클릭 시 메뉴 열기 |
| AVATAR | 이미지 | 아바타 | 32x32px, rounded-full | - |
| MENU-PROFILE | 메뉴 | 프로필 | - | `/profile` 이동 |
| MENU-ACTIVITY | 메뉴 | 활동 | - | `/profile/activity` 이동 |
| MENU-EARNINGS | 메뉴 | 수익 | - | `/profile/earnings` 이동 |
| MENU-SETTINGS | 메뉴 | 설정 | - | `/settings` 이동 |
| MENU-LOGOUT | 메뉴 | 로그아웃 | color: destructive | 로그아웃 처리 |

### 3.5 모바일 전용

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-MENU | 버튼 | 햄버거 메뉴 | Icon: Menu | 사이드 메뉴 열기 |
| MOBILE-MENU | 사이드바 | 모바일 메뉴 | 좌측에서 슬라이드 | - |
| BTN-CLOSE-MENU | 버튼 | 메뉴 닫기 | Icon: X | 메뉴 닫기 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로그아웃 | user === null | Login 버튼 표시, 알림/아바타 숨김 |
| 로그인 | user !== null | 알림 + 아바타 메뉴 표시 |
| 검색 포커스 | searchFocused | 검색바 확장 + 드롭다운 표시 |
| 검색 중 | searchQuery.length > 0 | 검색 결과 표시, 지우기 버튼 |
| 알림 있음 | unreadCount > 0 | 빨간 뱃지 표시 |
| 모바일 메뉴 열림 | menuOpen (mobile) | 사이드바 + 오버레이 |
| 스크롤 다운 | scrollY > 100 | 헤더 축소 (옵션) |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 사용자 정보 | GET | `/api/auth/me` | 앱 로드 시 |
| 알림 목록 | GET | `/api/notifications?unread=true&limit=5` | 헤더 로드 시 |
| 미확인 수 | GET | `/api/notifications/unread-count` | 헤더 로드, 폴링 |
| 검색 자동완성 | GET | `/api/search/suggest?q={query}` | 검색어 입력 시 (debounce) |
| 최근 검색 | GET | `/api/search/recent` | 검색바 포커스 시 |
| 인기 검색 | GET | `/api/search/popular` | 검색바 포커스 시 |

### 5.2 상태 관리

```typescript
// useAuthStore
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
}

// useNotificationStore
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

// useSearchStore
interface SearchState {
  query: string;
  isOpen: boolean;
  recentSearches: string[];
  suggestions: SearchSuggestion[];
  setQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}
```

---

## 6. 접근성 (A11y)

### 6.1 키보드 네비게이션
- `Tab`: 로고 → 네비 링크들 → 검색 → 알림 → 사용자 메뉴
- `/` 또는 `Ctrl+K`: 검색바 포커스 (단축키)
- `Escape`: 검색 드롭다운/메뉴 닫기
- `Arrow Down/Up`: 검색 결과 탐색
- `Enter`: 선택된 검색 결과로 이동

### 6.2 스크린 리더
- 로고: `aria-label="DECODED - Go to homepage"`
- 네비게이션: `role="navigation"`, `aria-label="Main navigation"`
- 검색: `role="search"`, `aria-label="Search posts, media, and users"`
- 알림: `aria-label="Notifications, 3 unread"`
- 사용자 메뉴: `aria-haspopup="true"`, `aria-expanded`

### 6.3 포커스 관리
- 검색 드롭다운 열림 시: 첫 번째 결과로 포커스
- 모바일 메뉴 열림 시: 닫기 버튼으로 포커스
- 메뉴 닫힘 시: 트리거 버튼으로 포커스 복귀

---

## 7. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 전체 | GlobalHeader | `lib/components/layout/GlobalHeader.tsx` |
| 로고 | Logo | `lib/components/ui/Logo.tsx` |
| 네비게이션 | MainNav | `lib/components/layout/MainNav.tsx` |
| 검색바 | SearchBar | `lib/components/search/SearchBar.tsx` |
| 검색 드롭다운 | SearchDropdown | `lib/components/search/SearchDropdown.tsx` |
| 검색 결과 | SearchSuggestionItem | `lib/components/search/SearchSuggestionItem.tsx` |
| 알림 버튼 | NotificationButton | `lib/components/layout/NotificationButton.tsx` |
| 알림 패널 | NotificationPanel | `lib/components/layout/NotificationPanel.tsx` |
| 사용자 메뉴 | UserMenu | `lib/components/layout/UserMenu.tsx` |
| 모바일 메뉴 | MobileMenu | `lib/components/layout/MobileMenu.tsx` |

---

## 8. 구현 체크리스트

- [ ] GlobalHeader 레이아웃
- [ ] Logo 컴포넌트
- [ ] MainNav (데스크톱)
- [ ] SearchBar (확장/축소)
- [ ] SearchDropdown (최근/인기/제안)
- [ ] 검색 자동완성 API 연동
- [ ] NotificationButton + Badge
- [ ] NotificationPanel (알림 목록)
- [ ] UserMenu (드롭다운)
- [ ] 로그인/로그아웃 상태 처리
- [ ] MobileMenu (햄버거 + 사이드바)
- [ ] 검색 단축키 (/, Ctrl+K)
- [ ] 반응형 브레이크포인트 (768px)
- [ ] 스크롤 시 헤더 동작 (옵션)
- [ ] 접근성 테스트

---

## 9. 참고 사항

### 9.1 검색 디바운스
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    if (query.length >= 2) {
      fetchSuggestions(query);
    }
  }, 300),
  []
);
```

### 9.2 알림 폴링
```typescript
// 30초마다 미확인 알림 수 체크
useEffect(() => {
  const interval = setInterval(() => {
    fetchUnreadCount();
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

### 9.3 헤더 높이
```css
:root {
  --header-height-desktop: 64px;
  --header-height-mobile: 56px;
}
```

---

## 10. v2.0 Implementation Notes

**구현 파일:**
- Desktop: `lib/design-system/desktop-header.tsx` (DesktopHeader)
- Mobile: `lib/design-system/mobile-header.tsx` (MobileHeader)

**변경 사항 (v2.0):**
- Sidebar 제거, Top header 패턴 채택
- Desktop: 64px 높이, 검색/네비게이션 통합
- Mobile: 56px 높이, 백 버튼 + 타이틀 + 액션 레이아웃
- 간소화된 모바일 헤더 (로고 + 테마 토글 + 더보기 메뉴)

**토큰 참조:**
- Height: Desktop 64px, Mobile 56px
- z-index: header (30)
- 모바일에서 주요 네비게이션은 MobileNavBar(하단)로 이동

**Last Updated:** 2026-02-05
