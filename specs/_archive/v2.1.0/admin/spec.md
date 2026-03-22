# 관리자 패널

> 기능: A-01 ~ A-03
> 상태: 0% 구현됨
> 의존성: U-01 (관리자 역할 인증)

---

## 개요

관리자 패널은 콘텐츠 모더레이션, 태그 관리, 비즈니스 분석 도구를 제공합니다. 관리자 권한이 있는 사용자만 접근할 수 있는 별도의 인터페이스입니다.

### 관련 화면
- `/admin` - 관리자 대시보드
- `/admin/tags` - 태그/키워드 관리
- `/admin/content` - 콘텐츠 모더레이션
- `/admin/payouts` - 지급 관리
- `/admin/analytics` - 분석 대시보드

### 현재 구현 상태
- 없음 - 관리자 패널 미구축

---

## 기능 목록

### A-01 태그/키워드 관리

- **설명**: Media, Cast, Context 태그 관리를 위한 CMS
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: 데이터베이스 계층 구조 (S-04)

#### 수락 기준
- [ ] 필터링 및 검색이 가능한 모든 태그 목록
- [ ] 새 Media 추가 (그룹, 프로그램, 드라마)
- [ ] 새 Cast 멤버 추가
- [ ] Cast를 Media에 연결
- [ ] 기존 태그 편집
- [ ] 소프트 삭제 (아카이브) 태그
- [ ] 사용자 제출 태그 요청 검토
- [ ] 태그 요청 승인/거부
- [ ] 대량 작업 (병합, 상위 변경)
- [ ] 가져오기/내보내기 기능

#### UI/UX 요구사항

**태그 관리 대시보드**:
```
┌─────────────────────────────────────────────────────────────────┐
│  태그 관리                                        [+ 새로 추가]  │
│                                                                  │
│  [Media] [Cast] [대기 중인 요청 (5)]                            │
├─────────────────────────────────────────────────────────────────┤
│  🔍 태그 검색...                        유형: [전체 ▼]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎵 BLACKPINK                                             │   │
│  │    카테고리: K-POP • 유형: 그룹                          │   │
│  │    출연진: 지수, 제니, 로제, 리사                        │   │
│  │    게시물: 1,234 • 아이템: 3,456                        │   │
│  │    [편집] [게시물 보기] [아카이브]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎬 오징어 게임                                           │   │
│  │    카테고리: K-Drama • 유형: 드라마                      │   │
│  │    출연진: 이정재, 정호연, +12명                        │   │
│  │    게시물: 567 • 아이템: 1,890                          │   │
│  │    [편집] [게시물 보기] [아카이브]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [1] [2] [3] ... [15]                    289개 중 1-20 표시     │
└─────────────────────────────────────────────────────────────────┘
```

**Media 추가/편집 폼**:
```
┌─────────────────────────────────────────────────────────────────┐
│  새 Media 추가                                            [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  이름 (영어) *                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ BLACKPINK                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  이름 (한국어) *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 블랙핑크                                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  카테고리 *                                                     │
│  [K-POP ▼]                                                     │
│                                                                  │
│  유형 *                                                         │
│  [그룹 ▼]  (그룹 / 프로그램 / 드라마 / 영화 / 예능)            │
│                                                                  │
│  이미지                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [이미지 업로드]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  메타데이터 (JSON)                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ {                                                        │   │
│  │   "agency": "YG Entertainment",                         │   │
│  │   "debut": "2016-08-08"                                 │   │
│  │ }                                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                              [취소] [Media 저장]               │
└─────────────────────────────────────────────────────────────────┘
```

**태그 요청 검토**:
```
┌─────────────────────────────────────────────────────────────────┐
│  대기 중인 태그 요청                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 요청 #127                           2026년 1월 8일       │   │
│  │                                                          │   │
│  │ 유형: Cast                                               │   │
│  │ 이름: Kim Chaewon                                        │   │
│  │ 한국어: 김채원                                           │   │
│  │ 관련 Media: 르세라핌                                     │   │
│  │                                                          │   │
│  │ 제출자: user@example.com                                │   │
│  │ 사유: "그룹에 새 멤버 추가됨"                           │   │
│  │                                                          │   │
│  │ [✓ 승인] [✗ 거부] [수정 후 승인]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 대기 중인 제출을 위한 태그 요청 테이블
- 태그 변경에 대한 감사 로그
- 관리자 사용자 권한

#### API 엔드포인트
```
GET /api/admin/tags?type=media&page=1&search=
POST /api/admin/tags/media
PUT /api/admin/tags/media/:id
DELETE /api/admin/tags/media/:id

GET /api/admin/tags/requests
POST /api/admin/tags/requests/:id/approve
POST /api/admin/tags/requests/:id/reject

POST /api/admin/tags/bulk
  body: { action: 'merge' | 'archive', ids: string[] }
```

#### 생성/수정할 파일
- `app/admin/layout.tsx` - 관리자 레이아웃
- `app/admin/tags/page.tsx`
- `lib/components/admin/TagTable.tsx`
- `lib/components/admin/TagForm.tsx`
- `lib/components/admin/TagRequestList.tsx`

---

### A-02 콘텐츠/지급 관리

- **설명**: 사용자 제출 콘텐츠 검토 및 모더레이션; 지급 처리
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: A-01, S-06 (리워드 배치)

#### 수락 기준

**콘텐츠 모더레이션**:
- [ ] 상태 필터가 있는 모든 게시물 목록
- [ ] 모든 아이템이 포함된 게시물 상세 보기
- [ ] 게시물 승인/거부
- [ ] 부적절한 콘텐츠 플래그
- [ ] 게시물 메타데이터 편집
- [ ] 게시물에서 특정 아이템 제거
- [ ] 사용자 차단/정지

**지급 관리**:
- [ ] 대기 중인 출금 요청 목록
- [ ] 사용자 수익 내역 보기
- [ ] 출금 승인/거부
- [ ] 지급 완료로 표시
- [ ] 지급 보고서 생성
- [ ] 분쟁 처리

#### UI/UX 요구사항

**콘텐츠 모더레이션 큐**:
```
┌─────────────────────────────────────────────────────────────────┐
│  콘텐츠 모더레이션                                               │
│                                                                  │
│  [대기 중 (23)] [게시됨] [거부됨] [플래그됨]                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [이미지]  게시물 #4521               1월 8일 오후 2:34   │   │
│  │           작성자: user123                                │   │
│  │           태그: BLACKPINK > 제니 > 공항                 │   │
│  │           아이템: 3                                      │   │
│  │                                                          │   │
│  │ [상세 보기] [✓ 승인] [✗ 거부] [🚩 플래그]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [이미지]  게시물 #4520               1월 8일 오후 2:12   │   │
│  │           작성자: fashionista                            │   │
│  │           태그: IVE > 원영 > 무대                        │   │
│  │           아이템: 5                                      │   │
│  │                                                          │   │
│  │ [상세 보기] [✓ 승인] [✗ 거부] [🚩 플래그]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**지급 관리**:
```
┌─────────────────────────────────────────────────────────────────┐
│  지급 관리                                                       │
│                                                                  │
│  [대기 중 (8)] [처리 중] [완료됨] [거부됨]                      │
│                                                                  │
│  요약:                                                           │
│  대기 중 총액: ₩1,234,500                                       │
│  이번 달 지급: ₩5,678,000                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 요청 #891                           2026년 1월 7일       │   │
│  │ 사용자: top_contributor                                  │   │
│  │ 금액: ₩150,000                                          │   │
│  │ 방법: 은행 이체 (신한 xxx-xxx-123456)                   │   │
│  │                                                          │   │
│  │ 사용자 통계:                                            │   │
│  │ • 총 수익: ₩450,000                                     │   │
│  │ • 이전 지급: 2회 (모두 성공)                            │   │
│  │ • 계정 나이: 8개월                                      │   │
│  │                                                          │   │
│  │ [내역 보기] [✓ 승인] [✗ 거부]                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  대량 작업: [ ] 전체 선택  [선택 항목 처리]                     │
└─────────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 게시물 상태 필드 (pending, published, rejected, flagged)
- 모더레이션 감사 로그
- 출금 요청 테이블
- 지급 내역

#### API 엔드포인트
```
# 콘텐츠
GET /api/admin/posts?status=pending&page=1
GET /api/admin/posts/:id
PUT /api/admin/posts/:id/status
  body: { status: 'published' | 'rejected', reason?: string }
POST /api/admin/posts/:id/flag
POST /api/admin/users/:id/ban

# 지급
GET /api/admin/withdrawals?status=pending
GET /api/admin/withdrawals/:id
PUT /api/admin/withdrawals/:id/approve
PUT /api/admin/withdrawals/:id/reject
PUT /api/admin/withdrawals/:id/complete
GET /api/admin/payouts/report?month=2026-01
```

#### 생성/수정할 파일
- `app/admin/content/page.tsx`
- `app/admin/payouts/page.tsx`
- `lib/components/admin/PostModerationCard.tsx`
- `lib/components/admin/WithdrawalRequestCard.tsx`
- `lib/components/admin/PayoutReport.tsx`

---

### A-03 분석 대시보드

- **설명**: 주요 지표 및 KPI 모니터링
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: 모든 추적 시스템

#### 수락 기준
- [ ] 실시간 방문자 수
- [ ] 일간/주간/월간 활성 사용자
- [ ] 게시물 생성 지표
- [ ] 클릭률
- [ ] 전환율
- [ ] 수익 지표
- [ ] 상위 기여자
- [ ] 인기 콘텐츠
- [ ] 참여 추세
- [ ] 보고서 내보내기

#### UI/UX 요구사항

**분석 대시보드**:
```
┌─────────────────────────────────────────────────────────────────┐
│  분석 대시보드                      [2026년 1월 1일 - 1월 8일 ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  주요 지표                                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ 12,345  │ │  1,234  │ │  5.2%   │ │ ₩1.2M  │              │
│  │  DAU    │ │ 게시물  │ │  CTR    │ │  수익  │              │
│  │ +12%    │ │ +8%     │ │ +0.3%   │ │ +15%   │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  사용자 활동 추세                                        │   │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                       │   │
│  │  1/1    1/2    1/3    1/4    1/5    1/6    1/7    1/8   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────┐ ┌────────────────────────────┐    │
│  │ 인기 콘텐츠 (주간)      │ │ 상위 기여자               │    │
│  │                        │ │                            │    │
│  │ 1. BLACKPINK 공항     │ │ 1. user123 (127 게시물)   │    │
│  │    1,234 조회          │ │ 2. fashionista (89 게시물)│    │
│  │ 2. IVE 뮤직뱅크       │ │ 3. kpop_fan (76 게시물)  │    │
│  │    987 조회            │ │                            │    │
│  │ 3. NewJeans 화보      │ │                            │    │
│  │    876 조회            │ │                            │    │
│  └────────────────────────┘ └────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 수익 분석                                                │   │
│  │                                                          │   │
│  │ 출처별:                  카테고리별:                     │   │
│  │ ████████ 무신사 45%     ████████ K-POP 62%             │   │
│  │ ██████ Farfetch 28%     ████ K-Drama 23%               │   │
│  │ ████ 29CM 18%           ██ 기타 15%                     │   │
│  │ ██ 기타 9%                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [PDF 내보내기] [CSV 내보내기]                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 집계된 지표 테이블 (materialized views)
- 시계열 데이터 저장소
- 실시간 이벤트 스트리밍 (선택)

#### 추적할 지표

**사용자 지표**:
- 일간/주간/월간 활성 사용자 (DAU/WAU/MAU)
- 신규 사용자 가입
- 사용자 리텐션 (D1, D7, D30)
- 세션 지속 시간
- 이탈률

**콘텐츠 지표**:
- 생성된 게시물 (일별/주별)
- 사용자별 게시물
- 식별된 아이템
- 게시물당 평균 아이템
- 콘텐츠 모더레이션 비율

**참여 지표**:
- 페이지 조회수
- 상세 뷰 오픈
- 게시물당 댓글
- 아이템당 투표
- 즐겨찾기 추가

**비즈니스 지표**:
- 클릭률 (CTR)
- 전환율
- 사용자당 수익
- 평균 주문 금액
- 획득 커미션

#### API 엔드포인트
```
GET /api/admin/analytics/overview?period=7d
GET /api/admin/analytics/users?period=30d
GET /api/admin/analytics/content?period=30d
GET /api/admin/analytics/revenue?period=30d
GET /api/admin/analytics/top-content?period=7d&limit=10
GET /api/admin/analytics/top-contributors?period=7d&limit=10
GET /api/admin/analytics/export?type=pdf&period=30d
```

#### 구현 노트

**지표용 Materialized Views**:
```sql
-- 일일 지표 스냅샷
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(DISTINCT CASE WHEN type = 'post' THEN id END) as posts,
  COUNT(DISTINCT CASE WHEN type = 'click' THEN id END) as clicks,
  SUM(CASE WHEN type = 'conversion' THEN amount END) as revenue
FROM events
GROUP BY DATE(created_at);

-- 매일 갱신
SELECT cron.schedule('refresh-daily-metrics', '0 1 * * *', $$
  REFRESH MATERIALIZED VIEW daily_metrics;
$$);
```

**차트 라이브러리**:
```typescript
// Recharts 또는 Chart.js 사용
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from 'recharts';

function UserActivityChart({ data }) {
  return (
    <LineChart data={data}>
      <Line dataKey="dau" stroke="#8884d8" />
      <Line dataKey="newUsers" stroke="#82ca9d" />
    </LineChart>
  );
}
```

#### 생성/수정할 파일
- `app/admin/page.tsx` - 대시보드 홈
- `app/admin/analytics/page.tsx` - 상세 분석
- `lib/components/admin/MetricCard.tsx`
- `lib/components/admin/ActivityChart.tsx`
- `lib/components/admin/RevenueChart.tsx`
- `lib/components/admin/TopContentList.tsx`
- `lib/components/admin/TopContributorsList.tsx`
- `lib/hooks/useAdminAnalytics.ts`

---

## 관리자 인증

### 역할 기반 접근 제어

```typescript
// lib/auth/roles.ts
type AdminRole = 'super_admin' | 'content_moderator' | 'payout_manager' | 'viewer';

const rolePermissions: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  content_moderator: ['tags.view', 'tags.edit', 'content.view', 'content.moderate'],
  payout_manager: ['payouts.view', 'payouts.approve', 'analytics.view'],
  viewer: ['*.view'],
};

// 미들웨어
export function requireAdmin(permission: string) {
  return async (req: Request) => {
    const user = await getUser(req);
    if (!user?.adminRole) {
      throw new UnauthorizedError('Admin access required');
    }
    if (!hasPermission(user.adminRole, permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
```

### 관리자 레이아웃

```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1">
          <AdminHeader />
          {children}
        </main>
      </div>
    </AdminAuthProvider>
  );
}
```

---

## 데이터 모델

전체 타입 정의는 [data-models.md](./data-models.md) 참조.

### 관리자용 주요 타입

```typescript
interface AdminUser {
  id: string;
  userId: string;
  role: AdminRole;
  permissions: string[];
  createdAt: Date;
}

interface TagRequest {
  id: string;
  type: 'media' | 'cast';
  name: string;
  nameKo: string;
  relatedMediaId?: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

interface ModerationAction {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  action: 'approve' | 'reject' | 'flag' | 'ban';
  reason?: string;
  adminId: string;
  createdAt: Date;
}

interface PayoutAction {
  id: string;
  withdrawalId: string;
  action: 'approve' | 'reject' | 'complete';
  adminId: string;
  note?: string;
  createdAt: Date;
}
```

---

## 마이그레이션 경로

### 1단계: 기본 관리자 설정
1. 관리자 역할 시스템 생성
2. 관리자 레이아웃 및 네비게이션 구축
3. 인증 미들웨어 구현

### 2단계: 태그 관리
1. 태그 CRUD 인터페이스 구축
2. 태그 요청 검토 구현
3. 대량 작업 추가

### 3단계: 콘텐츠 모더레이션
1. 게시물 모더레이션 큐 구축
2. 승인/거부 흐름 구현
3. 사용자 관리 추가

### 4단계: 지급 & 분석
1. 지급 관리 인터페이스 구축
2. 분석 대시보드 생성
3. 내보내기 기능 추가

---

## 보안 고려사항

- 관리자 패널은 별도 서브도메인에 배치 (admin.decoded.app)
- 관리자 접근에 추가 2FA 필요
- 모든 관리자 작업은 전체 감사 추적으로 로깅
- 관리자 접근을 위한 IP 화이트리스팅 (선택)
- 관리자 API에 Rate limiting
- 비활성 후 세션 타임아웃

---

## 모바일 Admin 명세

> 모바일 앱 (packages/mobile)에서의 관리자 패널 상세 명세

### 모바일 vs 웹 차이점 요약

| 기능 | 웹 (packages/web) | 모바일 (packages/mobile) |
|------|------------------|------------------------|
| 레이아웃 | 사이드바 + 컨텐츠 영역 | 바텀 탭 네비게이션 |
| 태그 관리 | 테이블 뷰 | 리스트 + 스와이프 액션 |
| 모더레이션 | 카드 그리드 | 틴더 스타일 스와이프 |
| 분석 | 풀 차트 | 간소화된 미니 차트 |
| 대량 작업 | 체크박스 선택 | 롱프레스 다중 선택 |
| 푸시 알림 | 없음 | 긴급 알림 + 빠른 액션 |

---

### 모바일 Admin 네비게이션 구조

```
┌─────────────────────────────────────────┐
│  Decoded Admin                    [👤]   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │         [Main Content]          │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  [📊]     [✅]     [💰]     [🏷️]       │
│ Dashboard Moderate  Payouts   Tags       │
└─────────────────────────────────────────┘
```

---

### A-01 모바일 태그 관리

#### 모바일 태그 목록 화면

```
┌─────────────────────────────────────────┐
│  ← Tags                         [+] [🔍] │
│                                         │
│  [Media] [Cast] [Requests (5)]         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ← Swipe                         │   │
│  │ 🎵 BLACKPINK                    │   │
│  │    K-POP • Group • 4 members    │   │
│  │    1,234 posts                  │   │
│  │                          → Edit │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🎬 Squid Game                   │   │
│  │    K-Drama • Drama • 14 cast    │   │
│  │    567 posts                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🎵 NewJeans                     │   │
│  │    K-POP • Group • 5 members    │   │
│  │    890 posts                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│          [Load More...]                 │
└─────────────────────────────────────────┘
```

#### 스와이프 액션

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    TAG LIST SWIPE ACTIONS                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [왼쪽 스와이프 → 삭제/아카이브]                                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                         ┌─────────┐┌─────────┐      ││
│  │  🎵 BLACKPINK                           │ Archive ││  Delete │      ││
│  │     K-POP • Group                       │   🗄️    ││   🗑️    │      ││
│  │                              ←←←←←←←←←  │ (Gray)  ││  (Red)  │      ││
│  │                                         └─────────┘└─────────┘      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  [오른쪽 스와이프 → 편집]                                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ┌─────────┐                                                        ││
│  │  │  Edit   │  🎵 BLACKPINK                                          ││
│  │  │   ✏️    │     K-POP • Group                                      ││
│  │  │ (Blue)  │                              →→→→→→→→→                 ││
│  │  └─────────┘                                                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  라이브러리: react-native-swipeable-list 또는 react-native-gesture-handler│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 태그 요청 검토

```
┌─────────────────────────────────────────┐
│  ← Tag Requests                    (5)   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Request #127                    │   │
│  │                                 │   │
│  │ Type: Cast                      │   │
│  │ Name: Kim Chaewon              │   │
│  │ Korean: 김채원                  │   │
│  │ Related: LE SSERAFIM           │   │
│  │                                 │   │
│  │ By: user@example.com           │   │
│  │ "Adding new member to group"   │   │
│  │                                 │   │
│  │ ┌─────────┐ ┌─────────┐       │   │
│  │ │    ✓    │ │    ✗    │       │   │
│  │ │ Approve │ │  Reject │       │   │
│  │ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Request #126                    │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

### A-02 모바일 콘텐츠 모더레이션

#### 틴더 스타일 모더레이션 UI

```
┌─────────────────────────────────────────┐
│  Moderate                 23 pending     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │      [Post Image Preview]       │   │
│  │                                 │   │
│  │                                 │   │
│  │                                 │   │
│  ├─────────────────────────────────┤   │
│  │ Post #4521                      │   │
│  │ By: user123                     │   │
│  │ Tags: BLACKPINK > Jennie        │   │
│  │ Context: Airport                │   │
│  │ Items: 3                        │   │
│  │                                 │   │
│  │ [View Details]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────┐         ┌─────────┐       │
│  │    ✗    │         │    ✓    │       │
│  │  Reject │         │ Approve │       │
│  │  (Red)  │         │ (Green) │       │
│  └─────────┘         └─────────┘       │
│                                         │
│  ← Swipe left to reject                 │
│  → Swipe right to approve               │
│                                         │
└─────────────────────────────────────────┘
```

#### 모더레이션 제스처 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MODERATION GESTURE FLOW                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [카드 스와이프 제스처]                                                   │
│       │                                                                  │
│       ├─── 오른쪽 스와이프 (>50% 화면 너비)                              │
│       │         │                                                        │
│       │         ├─── 카드 애니메이션: 오른쪽으로 날아감 + ✓ 아이콘      │
│       │         ├─── Haptic feedback (success)                          │
│       │         ├─── PUT /api/admin/posts/:id/status { status: 'published' }
│       │         └─── 다음 카드 표시                                      │
│       │                                                                  │
│       ├─── 왼쪽 스와이프 (>50% 화면 너비)                                │
│       │         │                                                        │
│       │         ├─── 카드 애니메이션: 왼쪽으로 날아감 + ✗ 아이콘        │
│       │         ├─── 거부 사유 입력 모달 표시                           │
│       │         │    ┌─────────────────────────────────────┐           │
│       │         │    │ Rejection Reason                    │           │
│       │         │    │                                     │           │
│       │         │    │ [Inappropriate content]             │           │
│       │         │    │ [Wrong tags]                        │           │
│       │         │    │ [Low quality]                       │           │
│       │         │    │ [Other: ____________]              │           │
│       │         │    │                                     │           │
│       │         │    │           [Confirm Reject]          │           │
│       │         │    └─────────────────────────────────────┘           │
│       │         └─── PUT /api/admin/posts/:id/status { status: 'rejected', reason }
│       │                                                                  │
│       ├─── 위로 스와이프                                                 │
│       │         └─── 상세 보기 바텀시트 열기                            │
│       │                                                                  │
│       └─── 아래로 스와이프                                               │
│                 └─── 플래그 옵션 표시                                    │
│                      ├─── "Flag for review"                             │
│                      ├─── "Flag as spam"                                │
│                      └─── "Flag user"                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 게시물 상세 바텀시트

```
┌─────────────────────────────────────────┐
│  ─────────────────────────────────────  │
│                                         │
│  Post #4521 Details                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [Full Image]                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Author: user123                        │
│  Posted: Jan 8, 2026 at 2:34 PM        │
│                                         │
│  Tags:                                  │
│  Media: BLACKPINK                       │
│  Cast: Jennie                           │
│  Context: Airport                       │
│                                         │
│  Items (3):                             │
│  ┌────┐ ┌────┐ ┌────┐                  │
│  │top │ │bag │ │shoe│                  │
│  └────┘ └────┘ └────┘                  │
│                                         │
│  User History:                          │
│  • 45 approved posts                    │
│  • 2 rejected posts                     │
│  • Member since: Mar 2025               │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Reject  │ │  Flag   │ │ Approve │  │
│  └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

---

### A-02 모바일 지급 관리

#### 지급 대기 목록

```
┌─────────────────────────────────────────┐
│  ← Payouts                  8 pending    │
│                                         │
│  Summary:                               │
│  ┌────────────┐ ┌────────────┐         │
│  │ ₩1,234,500 │ │ ₩5,678,000 │         │
│  │  Pending   │ │ This Month │         │
│  └────────────┘ └────────────┘         │
│                                         │
│  [Pending] [Processing] [Completed]     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Request #891           Jan 7    │   │
│  │                                 │   │
│  │ 👤 top_contributor              │   │
│  │ 💰 ₩150,000                     │   │
│  │ 🏦 Shinhan xxx-xxx-123456       │   │
│  │                                 │   │
│  │ • Total earned: ₩450,000       │   │
│  │ • Previous payouts: 2 (100%)   │   │
│  │                                 │   │
│  │ ┌─────────┐     ┌─────────┐   │   │
│  │ │  Reject │     │ Approve │   │   │
│  │ └─────────┘     └─────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Request #890           Jan 7    │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### 지급 승인 확인 모달

```
┌─────────────────────────────────────────┐
│                                         │
│          Confirm Payout                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  Amount: ₩150,000               │   │
│  │  To: top_contributor            │   │
│  │  Bank: Shinhan xxx-xxx-123456   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ This action cannot be undone       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      [Cancel]    [Approve]      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Face ID required for approval          │
│                                         │
└─────────────────────────────────────────┘
```

---

### A-03 모바일 분석 대시보드

#### 간소화된 대시보드 홈

```
┌─────────────────────────────────────────┐
│  Dashboard                        [⚙️]   │
│                                         │
│  Jan 1 - Jan 8, 2026              [▼]  │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 12,345 │ │  1,234 │ │  5.2%  │      │
│  │  DAU   │ │ Posts  │ │  CTR   │      │
│  │  +12%  │ │  +8%   │ │ +0.3%  │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ ₩1.2M                          │    │
│  │ Revenue  +15%                   │    │
│  └────────────────────────────────┘    │
│                                         │
│  Activity                               │
│  ┌─────────────────────────────────┐   │
│  │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁               │   │
│  │ 1/1         1/4         1/8     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quick Actions                          │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │  23    │ │   8    │ │   5    │      │
│  │Moderate│ │Payouts │ │Tags Req│      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  Top Content This Week                  │
│  1. BLACKPINK Airport - 1,234 views    │
│  2. IVE Music Bank - 987 views         │
│  3. NewJeans Photoshoot - 876 views    │
│                                         │
└─────────────────────────────────────────┘
```

#### 상세 분석 화면

```
┌─────────────────────────────────────────┐
│  ← Analytics                            │
│                                         │
│  [Users] [Content] [Revenue]            │
│                                         │
│  Users - Last 30 days                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ DAU                             │   │
│  │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁│   │
│  │ Dec 9                   Jan 8   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌──────────────┐ ┌──────────────┐     │
│  │    45,678    │ │     3,456    │     │
│  │     MAU      │ │  New Users   │     │
│  │    +8%       │ │    +12%      │     │
│  └──────────────┘ └──────────────┘     │
│                                         │
│  Retention                              │
│  D1: 65% | D7: 42% | D30: 28%          │
│                                         │
│  Top Contributors                       │
│  ┌─────────────────────────────────┐   │
│  │ 1. user123        127 posts     │   │
│  │ 2. fashionista     89 posts     │   │
│  │ 3. kpop_fan        76 posts     │   │
│  └─────────────────────────────────┘   │
│                                         │
│        [Export Report]                  │
└─────────────────────────────────────────┘
```

---

### 모바일 푸시 알림 & 빠른 액션

#### 푸시 알림 유형

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ADMIN PUSH NOTIFICATIONS                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [1. 긴급 모더레이션 알림]                                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🚨 Decoded Admin                                           now      ││
│  │                                                                     ││
│  │ Flagged Content Alert                                               ││
│  │ Post #4521 was flagged by 3 users for "inappropriate content"      ││
│  │                                                                     ││
│  │ [View Post]  [Quick Reject]  [Dismiss]                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  → "View Post" 탭: 앱 열림 → 해당 게시물 상세                            │
│  → "Quick Reject" 탭: 바로 거부 처리 (확인 알림 표시)                    │
│                                                                          │
│  [2. 지급 요청 알림]                                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 💰 Decoded Admin                                           5m ago   ││
│  │                                                                     ││
│  │ New Payout Request                                                  ││
│  │ user123 requested ₩150,000 withdrawal                              ││
│  │                                                                     ││
│  │ [Review]  [Quick Approve]                                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  → "Quick Approve" 탭: Face ID 인증 후 바로 승인                         │
│                                                                          │
│  [3. 태그 요청 알림]                                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏷️ Decoded Admin                                          1h ago   ││
│  │                                                                     ││
│  │ 5 New Tag Requests                                                  ││
│  │ Pending review in Tags section                                      ││
│  │                                                                     ││
│  │ [View All]                                                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 알림 설정

```typescript
// packages/mobile/lib/notifications/adminNotifications.ts

interface AdminNotificationConfig {
  // 알림 유형별 설정
  moderation: {
    enabled: boolean;
    urgentOnly: boolean;  // 플래그된 콘텐츠만
    quietHours: { start: string; end: string }; // "22:00" - "08:00"
  };
  payouts: {
    enabled: boolean;
    minAmount: number;  // 이 금액 이상만 알림
  };
  tagRequests: {
    enabled: boolean;
    batchInterval: number; // 분 단위, 묶어서 알림
  };
}

// 기본값
const defaultConfig: AdminNotificationConfig = {
  moderation: {
    enabled: true,
    urgentOnly: true,
    quietHours: { start: "22:00", end: "08:00" }
  },
  payouts: {
    enabled: true,
    minAmount: 50000
  },
  tagRequests: {
    enabled: true,
    batchInterval: 60
  }
};
```

---

## 컴포넌트 상세 매핑

> 웹/모바일 공통 및 플랫폼별 구현 상세

### TagTable 컴포넌트 (웹)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TagTable.tsx                                                                │
│ packages/web/lib/components/admin/TagTable.tsx                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface TagTableProps {                                                  │
│   type: 'media' | 'cast';                                                 │
│   initialData?: TagItem[];                                                │
│   onEdit: (id: string) => void;                                           │
│   onArchive: (id: string) => void;                                        │
│   onBulkAction: (ids: string[], action: BulkAction) => void;             │
│ }                                                                          │
│                                                                            │
│ State:                                                                     │
│ interface TagTableState {                                                  │
│   data: TagItem[];                                                         │
│   pagination: { page: number; pageSize: number; total: number };          │
│   sorting: { column: string; direction: 'asc' | 'desc' };                 │
│   filters: { search: string; category?: string; status?: string };       │
│   selectedIds: string[];                                                   │
│   isLoading: boolean;                                                      │
│ }                                                                          │
│                                                                            │
│ 열 정의:                                                                   │
│ const columns: ColumnDef<TagItem>[] = [                                   │
│   { id: 'select', header: <Checkbox />, cell: <RowCheckbox /> },         │
│   {                                                                        │
│     id: 'name',                                                            │
│     header: 'Name',                                                        │
│     accessorKey: 'name',                                                   │
│     sortable: true,                                                        │
│     cell: ({ row }) => (                                                   │
│       <div className="flex items-center gap-2">                           │
│         <TagIcon type={row.original.type} />                              │
│         <span>{row.original.name}</span>                                  │
│         <span className="text-muted">{row.original.nameKo}</span>        │
│       </div>                                                               │
│     )                                                                      │
│   },                                                                       │
│   {                                                                        │
│     id: 'category',                                                        │
│     header: 'Category',                                                    │
│     accessorKey: 'category',                                               │
│     sortable: true,                                                        │
│     filterOptions: ['K-POP', 'K-Drama', 'K-Movie', 'Variety']            │
│   },                                                                       │
│   {                                                                        │
│     id: 'type',                                                            │
│     header: 'Type',                                                        │
│     accessorKey: 'mediaType',                                              │
│     sortable: true,                                                        │
│     filterOptions: ['group', 'solo', 'drama', 'movie', 'show']           │
│   },                                                                       │
│   {                                                                        │
│     id: 'stats',                                                           │
│     header: 'Stats',                                                       │
│     cell: ({ row }) => (                                                   │
│       <div>                                                                │
│         <span>{row.original.postCount} posts</span>                       │
│         <span>{row.original.itemCount} items</span>                       │
│       </div>                                                               │
│     )                                                                      │
│   },                                                                       │
│   {                                                                        │
│     id: 'actions',                                                         │
│     header: '',                                                            │
│     cell: ({ row }) => (                                                   │
│       <DropdownMenu>                                                       │
│         <DropdownItem onClick={() => onEdit(row.id)}>Edit</DropdownItem> │
│         <DropdownItem onClick={() => onViewPosts(row.id)}>             │
│           View Posts                                                       │
│         </DropdownItem>                                                    │
│         <DropdownItem onClick={() => onArchive(row.id)} variant="danger">│
│           Archive                                                          │
│         </DropdownItem>                                                    │
│       </DropdownMenu>                                                      │
│     )                                                                      │
│   }                                                                        │
│ ];                                                                         │
│                                                                            │
│ Events:                                                                    │
│ ├─── onSort(column) → setSorting({ column, direction: toggle })          │
│ ├─── onFilter(filters) → setFilters(filters), refetch()                  │
│ ├─── onPageChange(page) → setPagination({ ...pagination, page })         │
│ ├─── onSelectRow(id) → toggleSelectedId(id)                              │
│ ├─── onSelectAll() → setSelectedIds(allIds or [])                        │
│ └─── onBulkAction(action) → onBulkAction(selectedIds, action)            │
│                                                                            │
│ 라이브러리: @tanstack/react-table                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### TagListMobile 컴포넌트 (모바일)

```typescript
// packages/mobile/lib/components/admin/TagListMobile.tsx

interface TagListMobileProps {
  type: 'media' | 'cast';
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

interface TagListMobileState {
  data: TagItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  selectedForBulk: string[];
  isMultiSelectMode: boolean;
}

// 렌더링
// - FlashList for performance
// - Swipeable rows (react-native-gesture-handler)
// - Pull-to-refresh
// - Infinite scroll (onEndReached)
// - Long press to enter multi-select mode
```

### PostModerationCard 컴포넌트

#### 웹 버전

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PostModerationCard.tsx (Web)                                                │
│ packages/web/lib/components/admin/PostModerationCard.tsx                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface PostModerationCardProps {                                        │
│   post: PendingPost;                                                       │
│   onApprove: (id: string) => Promise<void>;                               │
│   onReject: (id: string, reason: string) => Promise<void>;                │
│   onFlag: (id: string, flagType: FlagType) => Promise<void>;              │
│   onViewDetails: (id: string) => void;                                    │
│   isProcessing?: boolean;                                                  │
│ }                                                                          │
│                                                                            │
│ State:                                                                     │
│ interface PostModerationCardState {                                        │
│   showRejectModal: boolean;                                                │
│   rejectReason: string;                                                    │
│   isSubmitting: boolean;                                                   │
│ }                                                                          │
│                                                                            │
│ 렌더링 구조:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <Card className="flex">                                                ││
│ │                                                                        ││
│ │   <!-- 이미지 프리뷰 -->                                                ││
│ │   <div className="w-32 h-32">                                          ││
│ │     <Image src={post.thumbnailUrl} />                                  ││
│ │   </div>                                                               ││
│ │                                                                        ││
│ │   <!-- 정보 영역 -->                                                    ││
│ │   <div className="flex-1">                                             ││
│ │     <div className="flex justify-between">                            ││
│ │       <span>Post #{post.id}</span>                                    ││
│ │       <span>{formatDate(post.createdAt)}</span>                       ││
│ │     </div>                                                             ││
│ │     <div>By: {post.author.username}</div>                             ││
│ │     <div>Tags: {post.media?.name} > {post.cast?.name}</div>          ││
│ │     <div>Items: {post.itemCount}</div>                                ││
│ │   </div>                                                               ││
│ │                                                                        ││
│ │   <!-- 액션 버튼 -->                                                    ││
│ │   <div className="flex gap-2">                                        ││
│ │     <Button variant="ghost" onClick={() => onViewDetails(post.id)}>  ││
│ │       View Details                                                     ││
│ │     </Button>                                                          ││
│ │     <Button variant="success" onClick={() => onApprove(post.id)}>    ││
│ │       ✓ Approve                                                        ││
│ │     </Button>                                                          ││
│ │     <Button variant="danger" onClick={() => setShowRejectModal(true)}>││
│ │       ✗ Reject                                                         ││
│ │     </Button>                                                          ││
│ │     <DropdownMenu>                                                     ││
│ │       <DropdownItem onClick={() => onFlag(post.id, 'review')}>       ││
│ │         🚩 Flag for Review                                            ││
│ │       </DropdownItem>                                                  ││
│ │       <DropdownItem onClick={() => onFlag(post.id, 'spam')}>         ││
│ │         🚩 Flag as Spam                                               ││
│ │       </DropdownItem>                                                  ││
│ │     </DropdownMenu>                                                    ││
│ │   </div>                                                               ││
│ │                                                                        ││
│ │ </Card>                                                                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ PendingPost 타입:                                                          │
│ interface PendingPost {                                                    │
│   id: string;                                                              │
│   thumbnailUrl: string;                                                    │
│   author: { id: string; username: string };                               │
│   media?: { id: string; name: string };                                   │
│   cast?: { id: string; name: string };                                    │
│   context?: ContextType;                                                   │
│   itemCount: number;                                                       │
│   createdAt: Date;                                                         │
│   status: 'pending';                                                       │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 버전 (SwipeablePostCard)

```typescript
// packages/mobile/lib/components/admin/SwipeablePostCard.tsx

interface SwipeablePostCardProps {
  post: PendingPost;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onFlag: (flagType: FlagType) => Promise<void>;
  onViewDetails: () => void;
}

interface SwipeablePostCardState {
  translateX: Animated.Value;
  isAnimating: boolean;
}

// 제스처 핸들링
// - PanGestureHandler로 스와이프 감지
// - 50% 이상 스와이프 시 액션 트리거
// - 스프링 애니메이션으로 카드 날아가는 효과
// - Haptic feedback on action
```

### MetricCard 컴포넌트

```
┌────────────────────────────────────────────────────────────────────────────┐
│ MetricCard.tsx (Web + Mobile)                                               │
│ packages/shared/lib/components/admin/MetricCard.tsx                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface MetricCardProps {                                                │
│   title: string;                       // "DAU", "Revenue", etc.          │
│   value: number | string;              // 12345, "₩1.2M"                  │
│   change?: {                           // 변화량                          │
│     value: number;                     // +12, -5                         │
│     type: 'percent' | 'absolute';                                         │
│   };                                                                       │
│   trend?: 'up' | 'down' | 'neutral';   // 화살표 방향                     │
│   format?: 'number' | 'currency' | 'percent';                             │
│   currency?: string;                   // "KRW", "USD"                    │
│   sparkline?: number[];                // 미니 차트 데이터                │
│   onClick?: () => void;                // 클릭 시 상세 페이지 이동        │
│   size?: 'sm' | 'md' | 'lg';           // 카드 크기                       │
│ }                                                                          │
│                                                                            │
│ 렌더링 (웹):                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <Card onClick={onClick} className={sizeClasses[size]}>                 ││
│ │                                                                        ││
│ │   <div className="text-sm text-muted">{title}</div>                   ││
│ │                                                                        ││
│ │   <div className="text-2xl font-bold">                                ││
│ │     {formatValue(value, format, currency)}                            ││
│ │   </div>                                                               ││
│ │                                                                        ││
│ │   {change && (                                                         ││
│ │     <div className={cn(                                               ││
│ │       'text-sm',                                                       ││
│ │       trend === 'up' && 'text-green-500',                             ││
│ │       trend === 'down' && 'text-red-500'                              ││
│ │     )}>                                                                ││
│ │       {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}          ││
│ │       {change.type === 'percent' ? `${change.value}%` : change.value}││
│ │     </div>                                                             ││
│ │   )}                                                                    ││
│ │                                                                        ││
│ │   {sparkline && (                                                      ││
│ │     <Sparkline data={sparkline} height={32} />                        ││
│ │   )}                                                                    ││
│ │                                                                        ││
│ │ </Card>                                                                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ Sparkline 컴포넌트:                                                        │
│ - 웹: recharts의 <AreaChart> 또는 <SparklineChart>                        │
│ - 모바일: react-native-svg + d3-shape로 직접 구현                         │
│                                                                            │
│ formatValue 함수:                                                          │
│ function formatValue(value, format, currency) {                           │
│   switch (format) {                                                        │
│     case 'currency':                                                       │
│       return new Intl.NumberFormat('ko-KR', {                             │
│         style: 'currency',                                                 │
│         currency: currency || 'KRW',                                      │
│         notation: value >= 1000000 ? 'compact' : 'standard'              │
│       }).format(value);                                                    │
│     case 'percent':                                                        │
│       return `${value}%`;                                                  │
│     default:                                                               │
│       return value.toLocaleString();                                      │
│   }                                                                        │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### ActivityChart 컴포넌트

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ActivityChart.tsx                                                           │
│ packages/web/lib/components/admin/ActivityChart.tsx                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Props:                                                                     │
│ interface ActivityChartProps {                                             │
│   data: DailyMetric[];                                                     │
│   metrics: ('dau' | 'newUsers' | 'posts' | 'clicks')[];                   │
│   period: '7d' | '30d' | '90d';                                           │
│   height?: number;                                                         │
│   showLegend?: boolean;                                                    │
│ }                                                                          │
│                                                                            │
│ interface DailyMetric {                                                    │
│   date: string;     // "2026-01-08"                                       │
│   dau: number;                                                             │
│   newUsers: number;                                                        │
│   posts: number;                                                           │
│   clicks: number;                                                          │
│ }                                                                          │
│                                                                            │
│ 웹 렌더링 (recharts):                                                      │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ <ResponsiveContainer height={height || 300}>                           ││
│ │   <LineChart data={data}>                                              ││
│ │     <CartesianGrid strokeDasharray="3 3" />                           ││
│ │     <XAxis dataKey="date" tickFormatter={formatDate} />               ││
│ │     <YAxis />                                                          ││
│ │     <Tooltip content={<CustomTooltip />} />                           ││
│ │     {showLegend && <Legend />}                                        ││
│ │                                                                        ││
│ │     {metrics.includes('dau') && (                                      ││
│ │       <Line                                                            ││
│ │         type="monotone"                                                ││
│ │         dataKey="dau"                                                  ││
│ │         stroke="#8884d8"                                               ││
│ │         name="Daily Active Users"                                      ││
│ │       />                                                               ││
│ │     )}                                                                  ││
│ │     {metrics.includes('newUsers') && (                                 ││
│ │       <Line                                                            ││
│ │         type="monotone"                                                ││
│ │         dataKey="newUsers"                                             ││
│ │         stroke="#82ca9d"                                               ││
│ │         name="New Users"                                               ││
│ │       />                                                               ││
│ │     )}                                                                  ││
│ │     ...                                                                ││
│ │   </LineChart>                                                         ││
│ │ </ResponsiveContainer>                                                 ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ 모바일 렌더링 (react-native-svg-charts):                                   │
│ - LineChart 대신 단순화된 Path 기반 차트                                   │
│ - 터치 시 해당 데이터포인트 툴팁 표시                                      │
│ - 차트 높이 축소 (200px)                                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 관리자 권한 상세화

### 역할별 접근 가능 화면

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ADMIN ROLE PERMISSIONS MATRIX                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  역할 (AdminRole)                                                         │
│  ├─── super_admin: 모든 권한                                             │
│  ├─── content_moderator: 콘텐츠 및 태그 관리                            │
│  ├─── payout_manager: 지급 관리                                          │
│  └─── viewer: 읽기 전용                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 화면/기능            │ super │ moderator │ payout │ viewer │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Dashboard (읽기)     │   ✓   │     ✓     │   ✓    │   ✓    │      │ │
│  │ Dashboard (내보내기) │   ✓   │     ✗     │   ✓    │   ✗    │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Tags (읽기)          │   ✓   │     ✓     │   ✗    │   ✓    │      │ │
│  │ Tags (추가/편집)     │   ✓   │     ✓     │   ✗    │   ✗    │      │ │
│  │ Tags (삭제)          │   ✓   │     ✗     │   ✗    │   ✗    │      │ │
│  │ Tag Requests (검토)  │   ✓   │     ✓     │   ✗    │   ✗    │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Content (읽기)       │   ✓   │     ✓     │   ✗    │   ✓    │      │ │
│  │ Content (승인/거부)  │   ✓   │     ✓     │   ✗    │   ✗    │      │ │
│  │ Content (플래그)     │   ✓   │     ✓     │   ✗    │   ✗    │      │ │
│  │ User Ban             │   ✓   │     ✗     │   ✗    │   ✗    │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Payouts (읽기)       │   ✓   │     ✗     │   ✓    │   ✓    │      │ │
│  │ Payouts (승인/거부)  │   ✓   │     ✗     │   ✓    │   ✗    │      │ │
│  │ Payouts (완료 처리)  │   ✓   │     ✗     │   ✓    │   ✗    │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Analytics (읽기)     │   ✓   │     ✓     │   ✓    │   ✓    │      │ │
│  │ Analytics (내보내기) │   ✓   │     ✗     │   ✓    │   ✗    │      │ │
│  ├──────────────────────┼───────┼───────────┼────────┼────────┤      │ │
│  │ Admin Users 관리     │   ✓   │     ✗     │   ✗    │   ✗    │      │ │
│  │ Settings             │   ✓   │     ✗     │   ✗    │   ✗    │      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 권한 체크 컴포넌트

```typescript
// packages/shared/lib/components/admin/RequirePermission.tsx

interface RequirePermissionProps {
  permission: string;  // "tags.edit", "payouts.approve", etc.
  children: React.ReactNode;
  fallback?: React.ReactNode;  // 권한 없을 때 표시
}

// 사용 예시
function TagsPage() {
  return (
    <div>
      <h1>Tags</h1>

      {/* 읽기 권한 - 모든 역할 */}
      <RequirePermission permission="tags.view">
        <TagTable />
      </RequirePermission>

      {/* 편집 권한 - moderator 이상 */}
      <RequirePermission
        permission="tags.edit"
        fallback={<DisabledButton>Edit (No Permission)</DisabledButton>}
      >
        <Button onClick={openEditModal}>Edit Tag</Button>
      </RequirePermission>

      {/* 삭제 권한 - super_admin만 */}
      <RequirePermission permission="tags.delete">
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </RequirePermission>
    </div>
  );
}
```

```typescript
// packages/shared/lib/hooks/useAdminPermission.ts

interface UseAdminPermissionReturn {
  role: AdminRole | null;
  hasPermission: (permission: string) => boolean;
  can: {
    viewTags: boolean;
    editTags: boolean;
    deleteTags: boolean;
    moderateContent: boolean;
    approvePayouts: boolean;
    exportData: boolean;
    manageAdmins: boolean;
  };
  isLoading: boolean;
}

export function useAdminPermission(): UseAdminPermissionReturn {
  const { user } = useAuth();
  const role = user?.adminRole;

  const hasPermission = useCallback((permission: string) => {
    if (!role) return false;
    if (role === 'super_admin') return true;

    const rolePermissions = ROLE_PERMISSION_MAP[role];
    return rolePermissions.includes(permission) ||
           rolePermissions.includes(permission.split('.')[0] + '.view');
  }, [role]);

  return {
    role,
    hasPermission,
    can: {
      viewTags: hasPermission('tags.view'),
      editTags: hasPermission('tags.edit'),
      deleteTags: hasPermission('tags.delete'),
      moderateContent: hasPermission('content.moderate'),
      approvePayouts: hasPermission('payouts.approve'),
      exportData: hasPermission('analytics.export'),
      manageAdmins: hasPermission('admin.manage'),
    },
    isLoading: !user,
  };
}
```

### 2FA 플로우 상세

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ADMIN 2FA AUTHENTICATION FLOW                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [1. 관리자 로그인]                                                       │
│       │                                                                  │
│       ▼                                                                  │
│  일반 로그인 (Supabase Auth)                                             │
│       │                                                                  │
│       ▼                                                                  │
│  adminRole 확인                                                          │
│       │                                                                  │
│       ├─── adminRole 없음 → 일반 사용자 화면으로 리다이렉트              │
│       │                                                                  │
│       └─── adminRole 있음 → 2FA 필요 여부 확인                           │
│                 │                                                        │
│                 ├─── 2FA 미설정 → 2FA 설정 강제 화면                     │
│                 │                                                        │
│                 └─── 2FA 설정됨 → 2FA 인증 요청                          │
│                           │                                              │
│                           ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Two-Factor Authentication                                          ││
│  │                                                                     ││
│  │  [웹] TOTP 코드 입력                                                ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │  Enter 6-digit code from your authenticator app            │   ││
│  │  │                                                             │   ││
│  │  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                      │   ││
│  │  │  │   │ │   │ │   │ │   │ │   │ │   │                      │   ││
│  │  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                      │   ││
│  │  │                                                             │   ││
│  │  │  [Verify]                                                   │   ││
│  │  │                                                             │   ││
│  │  │  Use backup code instead                                    │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  │  [모바일] 바이오메트릭 또는 TOTP                                     ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │                                                             │   ││
│  │  │            [Face ID / Fingerprint]                         │   ││
│  │  │                   👆                                       │   ││
│  │  │                                                             │   ││
│  │  │  or enter code manually                                     │   ││
│  │  │                                                             │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                 │                                                        │
│                 ▼                                                        │
│  2FA 검증                                                                │
│       │                                                                  │
│       ├─── 실패 → 에러 메시지 + 재시도                                   │
│       │    (5회 실패 시 15분 잠금)                                       │
│       │                                                                  │
│       └─── 성공 → admin_sessions 테이블에 세션 생성                     │
│                 │                                                        │
│                 └─── 관리자 대시보드로 이동                              │
│                                                                          │
│  [2. 세션 관리]                                                          │
│                                                                          │
│  admin_sessions 테이블:                                                  │
│  {                                                                       │
│    id: string,                                                           │
│    user_id: string,                                                      │
│    device_info: { platform, browser, ip },                              │
│    created_at: timestamp,                                                │
│    expires_at: timestamp,  // 24시간 후                                  │
│    last_activity: timestamp,                                             │
│    is_active: boolean                                                    │
│  }                                                                       │
│                                                                          │
│  세션 만료 조건:                                                         │
│  - 24시간 경과                                                           │
│  - 30분 비활성                                                           │
│  - 다른 기기에서 로그인 (기존 세션 무효화)                               │
│  - 명시적 로그아웃                                                       │
│                                                                          │
│  [3. 민감한 작업 재인증]                                                  │
│                                                                          │
│  다음 작업 시 2FA 재인증 필요:                                           │
│  - 지급 승인 (₩100,000 이상)                                            │
│  - 사용자 차단                                                           │
│  - 태그 삭제                                                             │
│  - 관리자 권한 변경                                                      │
│  - 데이터 내보내기                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2FA 설정 화면

```
┌─────────────────────────────────────────┐
│  ← Security Settings                    │
│                                         │
│  Two-Factor Authentication              │
│                                         │
│  Status: ✓ Enabled                      │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Authenticator App                      │
│  Google Authenticator, Authy, etc.      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │         [QR Code]               │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Manual entry key:                      │
│  ABCD EFGH IJKL MNOP               [📋] │
│                                         │
│  Enter verification code:               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│           [Verify & Enable]             │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Backup Codes                           │
│  Save these codes in a safe place       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ XXXX-XXXX-XXXX                  │   │
│  │ YYYY-YYYY-YYYY                  │   │
│  │ ZZZZ-ZZZZ-ZZZZ                  │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Generate New Codes]   [Download]      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 구현 상태 체크리스트

### A-01 태그 관리

#### 웹 (packages/web)
- [ ] AdminLayout 컴포넌트
- [ ] AdminSidebar 네비게이션
- [ ] TagTable 컴포넌트 (정렬, 필터, 페이지네이션)
- [ ] TagForm 모달 (추가/편집)
- [ ] TagRequestList 컴포넌트
- [ ] 대량 작업 UI (병합, 아카이브)
- [ ] 가져오기/내보내기 기능

#### 모바일 (packages/mobile)
- [ ] 바텀탭 네비게이션
- [ ] TagListMobile 컴포넌트 (FlashList)
- [ ] 스와이프 액션 (편집, 삭제)
- [ ] TagFormSheet 바텀시트
- [ ] TagRequestCard 컴포넌트
- [ ] 롱프레스 다중 선택

### A-02 콘텐츠/지급 관리

#### 웹 (packages/web)
- [ ] PostModerationCard 컴포넌트
- [ ] 게시물 상세 모달
- [ ] 거부 사유 입력 모달
- [ ] WithdrawalRequestCard 컴포넌트
- [ ] 지급 승인 확인 모달
- [ ] PayoutReport 컴포넌트

#### 모바일 (packages/mobile)
- [ ] SwipeablePostCard (틴더 스타일)
- [ ] 스와이프 제스처 핸들링
- [ ] 게시물 상세 바텀시트
- [ ] 거부 사유 선택 액션시트
- [ ] PayoutRequestCard 컴포넌트
- [ ] Face ID 인증 연동

### A-03 분석 대시보드

#### 웹 (packages/web)
- [ ] MetricCard 컴포넌트
- [ ] ActivityChart (recharts)
- [ ] RevenueChart (도넛/바 차트)
- [ ] TopContentList 컴포넌트
- [ ] TopContributorsList 컴포넌트
- [ ] DateRangePicker
- [ ] PDF/CSV 내보내기

#### 모바일 (packages/mobile)
- [ ] MetricCardMobile 컴포넌트
- [ ] 간소화된 미니 차트 (sparkline)
- [ ] QuickActionCards (대시보드)
- [ ] AnalyticsDetailScreen
- [ ] 날짜 범위 선택 바텀시트

### 인증 & 권한

#### 공통
- [ ] AdminAuthProvider 컨텍스트
- [ ] useAdminPermission 훅
- [ ] RequirePermission 컴포넌트
- [ ] 역할별 권한 매트릭스

#### 2FA
- [ ] TOTP 설정 화면
- [ ] 2FA 검증 화면 (웹)
- [ ] 바이오메트릭 인증 (모바일)
- [ ] 백업 코드 생성/관리
- [ ] 민감한 작업 재인증

#### API
- [ ] 관리자 인증 미들웨어
- [ ] 2FA 검증 엔드포인트
- [ ] 세션 관리 API
- [ ] 감사 로그 기록

### 푸시 알림 (모바일)

- [ ] 알림 권한 요청
- [ ] FCM 토큰 등록
- [ ] 알림 유형별 설정 화면
- [ ] 긴급 알림 (플래그된 콘텐츠)
- [ ] 빠른 액션 (알림에서 바로 처리)
