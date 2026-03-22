# [SCR-USER-02] 프로필 대시보드 (Profile Dashboard)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-USER-02 |
| **경로** | `/profile` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 사용자의 활동 요약, 뱃지, 랭킹 확인 및 설정 진입
- **선행 조건**: 로그인 상태
- **후속 화면**: 활동 내역, 수익/출금, 설정
- **관련 기능 ID**: [U-03](../spec.md#u-03-profile-dashboard)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [ Header - CMN-01 참조 ]                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ┌──────────┐                                                          │  │
│  │  │ [IMG-01] │  [TXT-01] Display Name              [ICON-01] ⚙️         │  │
│  │  │  Avatar  │  [TXT-02] @username                                      │  │
│  │  │ (80x80)  │  [TXT-03] "K-Pop Fashion Lover..."                       │  │
│  │  └──────────┘                                                          │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  │      [CARD-01]        │ │      [CARD-02]        │ │      [CARD-03]        │
│  │                       │ │                       │ │                       │
│  │         127           │ │         89%           │ │       ₩45,000         │
│  │        Posts          │ │       Accepted        │ │       Earnings        │
│  │                       │ │                       │ │                       │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  [SEC-01] 🏆 My Badges                              [LINK-01] View All │  │
│  │                                                                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │ [BADGE-01] │  │ [BADGE-02] │  │ [BADGE-03] │  │ [BADGE-04] │       │  │
│  │  │    IVE     │  │    BTS     │  │  NewJeans  │  │    +3      │       │  │
│  │  │   Expert   │  │    Fan     │  │   Expert   │  │   more     │       │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  [SEC-02] 📊 Rankings                                                  │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │ [LIST-01]                                                        │ │  │
│  │  │  • Global: #42 overall                                           │ │  │
│  │  │  • IVE: #3 this week (▲2)                                        │ │  │
│  │  │  • BLACKPINK: #12 this month                                     │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────┐                                             │
│  │ [BTN-01] View All Activity  │                                             │
│  └─────────────────────────────┘                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌────────────────────────────────┐
│  [ Header - 모바일 ]           │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │   ┌──────┐               │  │
│  │   │[IMG] │  Display Name │  │
│  │   │Avatar│  @username    │  │
│  │   └──────┘  [ICON-01] ⚙️ │  │
│  │                          │  │
│  │   "K-Pop Fashion..."     │  │
│  └──────────────────────────┘  │
│                                │
│  ┌────────┐┌────────┐┌────────┐│
│  │  127   ││  89%   ││₩45,000 ││
│  │ Posts  ││Accepted││Earnings││
│  └────────┘└────────┘└────────┘│
│                                │
│  [SEC-01] 🏆 My Badges         │
│  ┌────────────────────────────┐│
│  │ [BADGE] [BADGE] [BADGE]    ││
│  │  IVE     BTS    +3 more    ││
│  └────────────────────────────┘│
│                                │
│  [SEC-02] 📊 Rankings          │
│  ┌────────────────────────────┐│
│  │ • Global: #42              ││
│  │ • IVE: #3 (▲2)             ││
│  │ • BLACKPINK: #12           ││
│  └────────────────────────────┘│
│                                │
│  ┌────────────────────────────┐│
│  │ [BTN-01] View All Activity ││
│  └────────────────────────────┘│
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **IMG-01** | 이미지 | 프로필 아바타 | - Size: 80×80px (Desktop), 60×60px (Mobile)<br>- Shape: Circle<br>- Fallback: 이니셜 표시 | 소셜 로그인 프로필 이미지 표시<br>로드 실패 시 이니셜(Display Name 첫 글자) |
| **TXT-01** | 텍스트 | Display Name | - Font: H2 (20px Bold)<br>- Color: `text-primary` | - |
| **TXT-02** | 텍스트 | Username | - Font: Body (14px)<br>- Color: `text-secondary` | - |
| **TXT-03** | 텍스트 | Bio | - Font: Body (14px)<br>- Color: `text-muted`<br>- Max: 2줄, ellipsis | - |
| **ICON-01** | 아이콘 | 설정 버튼 | - Icon: Gear (⚙️)<br>- Size: 24×24px | **Click**: `/profile/settings`로 이동 |
| **CARD-01** | 카드 | 게시물 수 | - BG: `surface-secondary`<br>- Data: `totalContributions` | **Click**: `/profile/activity?tab=posts`로 이동 |
| **CARD-02** | 카드 | 채택률 | - BG: `surface-secondary`<br>- Data: `totalAccepted / totalAnswers * 100` | 클릭 이벤트 없음 (정보 표시용) |
| **CARD-03** | 카드 | 수익금 | - BG: `surface-secondary`<br>- Data: `totalEarnings`<br>- Format: Currency (₩) | **Click**: `/profile/earnings`로 이동 |
| **SEC-01** | 섹션 | My Badges | - Title: "🏆 My Badges" | - |
| **BADGE-01~04** | 뱃지 | 보유 뱃지 | - Shape: Rounded Square<br>- Max Display: 4개<br>- 4번째: "+N more" | **Click**: 뱃지 상세 모달 팝업<br>마지막 "+N more": 전체 뱃지 목록 모달 |
| **LINK-01** | 링크 | View All | - Color: `text-link` | **Click**: 전체 뱃지 목록 모달 팝업 |
| **SEC-02** | 섹션 | Rankings | - Title: "📊 Rankings" | - |
| **LIST-01** | 리스트 | 랭킹 목록 | - 최대 3개 표시<br>- 순위 변동 표시 (▲▼) | - |
| **BTN-01** | 버튼 | View All Activity | - Style: Secondary/Outline<br>- Width: Auto (Desktop), Full (Mobile) | **Click**: `/profile/activity`로 이동 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 데이터 로딩 완료 | 모든 정보 정상 표시 |
| **로딩** | API 요청 중 | 스켈레톤 UI 표시 (카드, 뱃지, 랭킹 영역) |
| **빈 상태 (뱃지)** | 뱃지 0개 | "아직 획득한 뱃지가 없습니다" 메시지 |
| **빈 상태 (랭킹)** | 랭킹 없음 | "활동을 시작하면 랭킹이 표시됩니다" 메시지 |
| **에러** | API 실패 | 에러 메시지 + 재시도 버튼 |

### 스켈레톤 레이아웃
```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────┐  ████████████████                                    │
│  │ ░░░░ │  ████████████                                        │
│  │ ░░░░ │  ████████████████████                                │
│  └──────┘                                                      │
│                                                                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                    │
│  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │                    │
│  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │                    │
│  └───────────┘ └───────────┘ └───────────┘                    │
│                                                                │
│  ████████████████████                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 프로필 조회 | GET | `/api/profile` | 페이지 진입 시 | `{ user: User, stats: Stats }` |
| 뱃지 조회 | GET | `/api/profile/badges` | 페이지 진입 시 | `{ badges: Badge[] }` |
| 랭킹 조회 | GET | `/api/profile/rankings` | 페이지 진입 시 | `{ rankings: Ranking[] }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| React Query | `["profile"]` | `QueryKey` | 프로필 데이터 캐시 |
| React Query | `["profile", "badges"]` | `QueryKey` | 뱃지 데이터 캐시 |
| React Query | `["profile", "rankings"]` | `QueryKey` | 랭킹 데이터 캐시 |

### 5.3 데이터 타입

```typescript
interface ProfileData {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
  };
  stats: {
    totalContributions: number;
    totalAnswers: number;
    totalAccepted: number;
    totalEarnings: number;
  };
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  category: string;
  earnedAt: Date;
}

interface Ranking {
  scope: 'global' | string; // string = fandom name
  rank: number;
  change: number; // +N or -N
  period: 'week' | 'month' | 'all';
}
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 401 | 인증 만료 | "세션이 만료되었습니다" | 로그인 페이지로 이동 |
| 404 | 프로필 없음 | "프로필을 찾을 수 없습니다" | 프로필 생성 유도 |
| 500 | 서버 오류 | "일시적인 오류가 발생했습니다" | 재시도 버튼 표시 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**: Tab으로 모든 클릭 가능 요소 접근
- **스크린 리더**: 통계 카드에 aria-label 제공 ("127개의 게시물")
- **포커스 관리**: 모달 오픈 시 포커스 트랩
- **색상 대비**: 순위 변동 표시 색상 + 아이콘으로 구분 (▲▼)

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | ProfilePage | `packages/web/app/profile/page.tsx` |
| 프로필 헤더 | ProfileHeader | `packages/web/lib/components/profile/ProfileHeader.tsx` |
| 통계 카드 | StatsCards | `packages/web/lib/components/profile/StatsCards.tsx` |
| 뱃지 그리드 | BadgeGrid | `packages/web/lib/components/profile/BadgeGrid.tsx` |
| 랭킹 리스트 | RankingList | `packages/web/lib/components/profile/RankingList.tsx` |
| 뱃지 모달 | BadgeModal | `packages/web/lib/components/profile/BadgeModal.tsx` |

---

## 9. 구현 체크리스트

- [ ] UI 레이아웃 구현
- [ ] 프로필 API 연동
- [ ] 뱃지 표시 및 모달
- [ ] 랭킹 표시
- [ ] 통계 카드 클릭 네비게이션
- [ ] 스켈레톤 로딩 UI
- [ ] 빈 상태 처리
- [ ] 에러 처리
- [ ] 반응형 대응
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
