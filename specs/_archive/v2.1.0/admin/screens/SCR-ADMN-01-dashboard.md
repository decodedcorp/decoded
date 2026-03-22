# [SCR-ADMN-01] 관리자 대시보드 (Admin Dashboard)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-ADMN-01 |
| **화면명** | 관리자 대시보드 |
| **경로** | `/admin` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 플랫폼 핵심 지표 모니터링, 콘텐츠/태그/지불 관리 진입점, 실시간 현황 파악
- **선행 조건**: 관리자 권한 인증 (AdminRole 필수)
- **후속 화면**: SCR-ADMN-02 (콘텐츠), SCR-ADMN-03 (지불), 태그 관리
- **관련 기능 ID**: A-01 Tag Management, A-03 Analytics Dashboard

---

## 2. UI 와이어프레임

### 2.1 데스크톱 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                                        │
│  │          │  DECODED Admin                         🔔 (5)  [Admin ▼]            │
│  │  LOGO    │                                                                        │
│  └──────────┘                                                                        │
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│              │                                                                       │
│  📊 Dashboard│  Dashboard                              [Jan 1 - Jan 8, 2026 ▼]     │
│     (active) │                                         [DATE-PICKER]                │
│              │  ─────────────────────────────────────────────────────────────────── │
│  🏷️ Tags     │                                                                       │
│              │  Key Metrics                                                          │
│  📝 Content  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│              │  │ [CARD-DAU]    │ │ [CARD-POSTS]  │ │ [CARD-CTR]    │ │[CARD-REV] ││
│  💰 Payouts  │  │   12,345      │ │    1,234      │ │     5.2%      │ │  ₩1.2M   ││
│              │  │   DAU         │ │   Posts       │ │    CTR        │ │ Revenue  ││
│  📈 Analytics│  │   ↑ 12%       │ │   ↑ 8%        │ │   ↑ 0.3%      │ │  ↑ 15%   ││
│              │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘│
│  ⚙️ Settings │                                                                       │
│              │  ─────────────────────────────────────────────────────────────────── │
│              │                                                                       │
│  ─────────── │  ┌────────────────────────────────────────────────────────────────┐  │
│              │  │  User Activity Trend                                [CHART-01] │  │
│  [SIDEBAR]   │  │                                                                │  │
│              │  │    ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                            │  │
│              │  │                                                                │  │
│              │  │    Jan 1   Jan 2   Jan 3   Jan 4   Jan 5   Jan 6   Jan 7      │  │
│              │  │                                                                │  │
│              │  │    — DAU    — New Users                                        │  │
│              │  └────────────────────────────────────────────────────────────────┘  │
│              │                                                                       │
│              │  ┌──────────────────────────────┐ ┌──────────────────────────────┐   │
│              │  │ Pending Actions              │ │ Top Content (Week)            │   │
│              │  │                              │ │                               │   │
│              │  │ 🏷️ Tag Requests     5      │ │ 1. BLACKPINK Airport         │   │
│              │  │ 📝 Content Review   23     │ │    1,234 views   ↑12%        │   │
│              │  │ 💰 Payout Requests  8      │ │                               │   │
│              │  │ 🚩 Flagged Posts    3      │ │ 2. IVE Music Bank            │   │
│              │  │                              │ │    987 views     ↑8%         │   │
│              │  │ [View All]                  │ │                               │   │
│              │  │ [CARD-PENDING]              │ │ 3. NewJeans Photoshoot       │   │
│              │  └──────────────────────────────┘ │    876 views     ↑5%         │   │
│              │                                   │                               │   │
│              │                                   │ [View More]                   │   │
│              │                                   │ [CARD-TOP-CONTENT]            │   │
│              │                                   └──────────────────────────────┘   │
│              │                                                                       │
│              │  ┌──────────────────────────────┐ ┌──────────────────────────────┐   │
│              │  │ Top Contributors (Week)      │ │ Revenue Breakdown            │   │
│              │  │                              │ │                               │   │
│              │  │ 1. 👤 user123               │ │ By Source:                    │   │
│              │  │    127 posts                 │ │ ████████ Musinsa    45%     │   │
│              │  │                              │ │ ██████ Farfetch     28%     │   │
│              │  │ 2. 👤 fashionista           │ │ ████ 29CM           18%     │   │
│              │  │    89 posts                  │ │ ██ Other            9%      │   │
│              │  │                              │ │                               │   │
│              │  │ 3. 👤 kpop_fan              │ │ [View Details]                │   │
│              │  │    76 posts                  │ │ [CHART-REVENUE]               │   │
│              │  │                              │ │                               │   │
│              │  │ [View All]                  │ └──────────────────────────────┘   │
│              │  │ [CARD-TOP-CONTRIB]          │                                    │
│              │  └──────────────────────────────┘                                    │
│              │                                                                       │
│              │  ┌────────────────────────────────────────────────────────────────┐  │
│              │  │  Recent Activity                                     [TABLE-01]│  │
│              │  ├────────────────────────────────────────────────────────────────┤  │
│              │  │  Time       Type        Description              Admin         │  │
│              │  │  ──────────────────────────────────────────────────────────────│  │
│              │  │  2:34 PM    Post        #4521 approved           @admin1       │  │
│              │  │  2:12 PM    Tag         "LE SSERAFIM" added      @admin2       │  │
│              │  │  1:45 PM    Payout      ₩150,000 processed      @admin1       │  │
│              │  │  1:23 PM    Post        #4519 rejected           @admin1       │  │
│              │  │  1:01 PM    User        user456 banned           @admin2       │  │
│              │  │                                                                │  │
│              │  │                                        [View Full Log]         │  │
│              │  └────────────────────────────────────────────────────────────────┘  │
│              │                                                                       │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.2 모바일 (<768px)

```
┌─────────────────────────────────┐
│  ≡  DECODED Admin      🔔 👤   │
├─────────────────────────────────┤
│                                 │
│  Dashboard                      │
│  [Jan 1 - Jan 8, 2026 ▼]       │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │  12,345   │ │   1,234   │   │
│  │   DAU     │ │   Posts   │   │
│  │  ↑ 12%    │ │   ↑ 8%    │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │   5.2%    │ │   ₩1.2M   │   │
│  │   CTR     │ │  Revenue  │   │
│  │  ↑ 0.3%   │ │   ↑ 15%   │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Pending Actions               │
│  ┌─────────────────────────┐   │
│  │ 🏷️ Tag Requests     5   │   │
│  │ 📝 Content Review   23  │   │
│  │ 💰 Payout Requests  8   │   │
│  │ 🚩 Flagged Posts    3   │   │
│  └─────────────────────────┘   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  User Activity (7 days)        │
│  ┌─────────────────────────┐   │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁       │   │
│  └─────────────────────────┘   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Recent Activity               │
│  ┌─────────────────────────┐   │
│  │ Post #4521 approved     │   │
│  │ 2:34 PM • @admin1       │   │
│  ├─────────────────────────┤   │
│  │ Tag "LE SSERAFIM" added │   │
│  │ 2:12 PM • @admin2       │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘

[📊] [🏷️] [📝] [💰] [⚙️]
  ↑
(Bottom Tab Navigation)
```

---

## 3. UI 요소 정의

### 3.1 헤더/네비게이션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| LOGO | 이미지 | 로고 | DECODED Admin | 클릭 시 대시보드로 이동 |
| BTN-NOTIF | 버튼 | 알림 | Icon: Bell, Badge: 미확인 수 | 알림 패널 열기 |
| MENU-USER | 드롭다운 | 사용자 메뉴 | 현재 관리자 이름 | 프로필, 로그아웃 |
| SIDEBAR | 네비게이션 | 사이드바 | Dashboard, Tags, Content, Payouts, Analytics, Settings | 현재 페이지 강조 |

### 3.2 핵심 지표 카드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CARD-DAU | 카드 | DAU 카드 | 숫자 + 전일 대비 변화율 | 클릭 시 사용자 분석 |
| CARD-POSTS | 카드 | 게시물 카드 | 기간 내 신규 포스트 수 | 클릭 시 콘텐츠 관리 |
| CARD-CTR | 카드 | CTR 카드 | 클릭률 + 변화율 | 클릭 시 전환 분석 |
| CARD-REV | 카드 | 수익 카드 | 기간 내 총 수익 | 클릭 시 수익 분석 |
| ICON-TREND | 아이콘 | 변화 방향 | ↑ green / ↓ red | - |

### 3.3 차트 영역

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CHART-01 | 차트 | 사용자 활동 추이 | LineChart, 7일 기본 | 호버 시 툴팁, 범례 클릭 토글 |
| CHART-REVENUE | 차트 | 수익 분포 | PieChart 또는 BarChart | 섹터 클릭 시 필터링 |
| DATE-PICKER | 선택 | 기간 선택 | 7D, 30D, 90D, Custom | 차트 데이터 갱신 |

### 3.4 대기 중 작업

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CARD-PENDING | 카드 | 대기 작업 | 태그/콘텐츠/지불/신고 카운트 | 각 항목 클릭 시 해당 페이지 |
| BADGE-COUNT | 뱃지 | 카운트 | bg-red, text-white | 0이면 숨김 |

### 3.5 목록/테이블

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CARD-TOP-CONTENT | 목록 | 인기 콘텐츠 | 상위 3-5개 | 클릭 시 상세 보기 |
| CARD-TOP-CONTRIB | 목록 | 상위 기여자 | 상위 3-5명 | 클릭 시 사용자 상세 |
| TABLE-01 | 테이블 | 최근 활동 | 시간, 타입, 설명, 관리자 | 행 클릭 시 상세 |
| BTN-VIEW-ALL | 링크 | 전체 보기 | variant: ghost | 해당 전체 목록으로 이동 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로딩 | 데이터 패칭 중 | 스켈레톤 UI 표시 |
| 데이터 없음 | 기간 내 데이터 0 | 빈 상태 메시지 |
| 실시간 업데이트 | 새 알림 수신 | 알림 뱃지 업데이트, 토스트 |
| 에러 | API 실패 | 에러 카드 + 재시도 버튼 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 대시보드 개요 | GET | `/api/admin/analytics/overview?period={days}` | 페이지 로드, 기간 변경 |
| 사용자 활동 | GET | `/api/admin/analytics/users?period={days}` | 차트 데이터용 |
| 수익 분석 | GET | `/api/admin/analytics/revenue?period={days}` | 수익 차트용 |
| 인기 콘텐츠 | GET | `/api/admin/analytics/top-content?period={days}&limit=5` | 목록용 |
| 상위 기여자 | GET | `/api/admin/analytics/top-contributors?period={days}&limit=5` | 목록용 |
| 대기 작업 수 | GET | `/api/admin/pending-counts` | 카운트 배지용 |
| 최근 활동 | GET | `/api/admin/activity-log?limit=10` | 활동 테이블용 |

### 5.2 응답 스키마

```typescript
interface DashboardOverview {
  metrics: {
    dau: { value: number; change: number };
    posts: { value: number; change: number };
    ctr: { value: number; change: number };
    revenue: { value: number; change: number };
  };
  pendingCounts: {
    tagRequests: number;
    contentReview: number;
    payoutRequests: number;
    flaggedPosts: number;
  };
}

interface UserActivityTrend {
  data: Array<{
    date: string;
    dau: number;
    newUsers: number;
  }>;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'post' | 'tag' | 'payout' | 'user';
  action: string;
  description: string;
  adminId: string;
  adminName: string;
}
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| 인증 만료 | "Session expired. Please log in again." | 로그인 페이지로 리다이렉트 |
| 권한 없음 | "You don't have permission to view this page." | 403 에러 페이지 |
| 데이터 로드 실패 | "Failed to load dashboard data." | 개별 섹션 에러 UI + 재시도 |
| 실시간 연결 끊김 | "Real-time updates paused." | 자동 재연결 시도 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 사이드바 메뉴 → 기간 선택 → 카드들 → 테이블 순서
- `Enter`: 메뉴 항목 선택, 링크 활성화
- `Arrow Up/Down`: 사이드바 메뉴 탐색
- `Escape`: 드롭다운 닫기

### 7.2 스크린 리더
- 지표 카드: `role="status"`, `aria-label="Daily Active Users: 12,345, up 12%"`
- 차트: `aria-label="User activity chart for the last 7 days"`, 데이터 테이블 대안 제공
- 테이블: 적절한 `th` scope, `aria-sort` (정렬 시)

### 7.3 색상/대비
- 변화율: 색상 외에 아이콘(↑/↓)으로도 방향 표시
- 최소 대비율 4.5:1 준수

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | AdminDashboardPage | `app/admin/page.tsx` |
| 레이아웃 | AdminLayout | `app/admin/layout.tsx` |
| 사이드바 | AdminSidebar | `lib/components/admin/AdminSidebar.tsx` |
| 헤더 | AdminHeader | `lib/components/admin/AdminHeader.tsx` |
| 지표 카드 | MetricCard | `lib/components/admin/MetricCard.tsx` |
| 활동 차트 | ActivityChart | `lib/components/admin/ActivityChart.tsx` |
| 수익 차트 | RevenueChart | `lib/components/admin/RevenueChart.tsx` |
| 대기 작업 | PendingActionsCard | `lib/components/admin/PendingActionsCard.tsx` |
| 인기 콘텐츠 | TopContentList | `lib/components/admin/TopContentList.tsx` |
| 상위 기여자 | TopContributorsList | `lib/components/admin/TopContributorsList.tsx` |
| 활동 로그 | ActivityLogTable | `lib/components/admin/ActivityLogTable.tsx` |
| 기간 선택 | DateRangePicker | `lib/components/admin/DateRangePicker.tsx` |
| 훅: 분석 | useAdminAnalytics | `lib/hooks/useAdminAnalytics.ts` |

---

## 9. 구현 체크리스트

- [ ] AdminLayout (사이드바 + 헤더)
- [ ] AdminSidebar (메뉴 항목, 활성 상태)
- [ ] MetricCard (숫자 + 변화율 + 아이콘)
- [ ] DateRangePicker (프리셋 + 커스텀)
- [ ] ActivityChart (Recharts/Chart.js)
- [ ] RevenueChart (Pie/Bar)
- [ ] PendingActionsCard (카운트 + 링크)
- [ ] TopContentList (축소 목록)
- [ ] TopContributorsList (아바타 + 통계)
- [ ] ActivityLogTable (시간순 정렬)
- [ ] 실시간 업데이트 (SSE/WebSocket)
- [ ] 반응형 레이아웃 (모바일 탭 네비게이션)
- [ ] 접근성 테스트
- [ ] 관리자 권한 미들웨어

---

## 10. 참고 사항

### 10.1 차트 라이브러리
```typescript
// Recharts 사용 예시
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function ActivityChart({ data }: { data: UserActivityTrend['data'] }) {
  return (
    <LineChart data={data} width={800} height={300}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="dau" stroke="#8884d8" name="DAU" />
      <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" name="New Users" />
    </LineChart>
  );
}
```

### 10.2 관리자 역할 권한
```typescript
type AdminRole = 'super_admin' | 'content_moderator' | 'payout_manager' | 'viewer';

const rolePermissions: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  content_moderator: ['tags.*', 'content.*', 'analytics.view'],
  payout_manager: ['payouts.*', 'analytics.view'],
  viewer: ['*.view'],
};
```

### 10.3 실시간 알림
```typescript
// SSE 연결
const eventSource = new EventSource('/api/admin/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 알림 카운트 업데이트, 토스트 표시 등
};
```
