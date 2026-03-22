# [SCR-ADMN-03] 지불 관리 (Payments Management)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-ADMN-03 |
| **화면명** | 지불 관리 |
| **경로** | `/admin/payments` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 사용자 출금 요청 검토/승인/거절, 지불 처리 현황 관리, 정산 리포트 생성
- **선행 조건**: 관리자 권한 (payout_manager 이상)
- **후속 화면**: 사용자 상세, 분석 대시보드
- **관련 기능 ID**: A-02 Content/Payout Management

---

## 2. UI 와이어프레임

### 2.1 지불 관리 메인

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ≡  Payments Management                                       🔔 (2)  [Admin ▼]   │
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│              │                                                                       │
│  📊 Dashboard│  Payout Management                                                   │
│              │                                                                       │
│  🏷️ Tags     │  ┌────────────────────────────────────────────────────────────────┐ │
│              │  │                                                                │ │
│  📝 Content  │  │  Summary (This Month)                                         │ │
│              │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │ │
│  💰 Payouts  │  │  │ [CARD-PEND]   │ │ [CARD-PROC]   │ │ [CARD-COMP]   │       │ │
│     (active) │  │  │  ₩1,234,500   │ │   ₩456,000    │ │  ₩5,678,000   │       │ │
│   • Requests │  │  │   Pending     │ │  Processing   │ │   Completed   │       │ │
│   • History  │  │  │   8 requests  │ │  3 requests   │ │  42 requests  │       │ │
│   • Reports  │  │  └───────────────┘ └───────────────┘ └───────────────┘       │ │
│              │  │                                                                │ │
│  ⚙️ Settings │  └────────────────────────────────────────────────────────────────┘ │
│              │                                                                       │
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│              │  │ [Pending (8)] [Processing (3)] [Completed] [Rejected]         │ │
│              │  │  ━━━━━━━━━━━━━                                                 │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
│              │                                                                       │
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│              │  │ 🔍 Search user...          [Date ▼] [Amount ▼] [Method ▼]    │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
│              │                                                                       │
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────────┐ │ │
│              │  │  │ [□]  Request #891                       Jan 7, 2026      │ │ │
│              │  │  │      User: top_contributor                               │ │ │
│              │  │  │      Amount: ₩150,000                                   │ │ │
│              │  │  │      Method: Bank Transfer (신한 xxx-xxx-123456)        │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      User Stats:                                         │ │ │
│              │  │  │      • Total Earnings: ₩450,000                         │ │ │
│              │  │  │      • Previous Payouts: 2 (all successful)             │ │ │
│              │  │  │      • Account Age: 8 months                            │ │ │
│              │  │  │      • Risk Score: Low ✓                                │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      [View History] [✓ Approve] [✗ Reject]             │ │ │
│              │  │  │      [REQ-01]                                            │ │ │
│              │  │  └──────────────────────────────────────────────────────────┘ │ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────────┐ │ │
│              │  │  │ [□]  Request #890                       Jan 7, 2026      │ │ │
│              │  │  │      User: fashion_lover                                 │ │ │
│              │  │  │      Amount: ₩50,000                                    │ │ │
│              │  │  │      Method: Bank Transfer (국민 xxx-xxx-789012)        │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      User Stats:                                         │ │ │
│              │  │  │      • Total Earnings: ₩120,000                         │ │ │
│              │  │  │      • Previous Payouts: 1 (successful)                 │ │ │
│              │  │  │      • Account Age: 2 months                            │ │ │
│              │  │  │      • Risk Score: Medium ⚠️                            │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      [View History] [✓ Approve] [✗ Reject]             │ │ │
│              │  │  │      [REQ-02]                                            │ │ │
│              │  │  └──────────────────────────────────────────────────────────┘ │ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────────┐ │ │
│              │  │  │ [□]  Request #889                       Jan 6, 2026      │ │ │
│              │  │  │      User: new_user_xyz                                  │ │ │
│              │  │  │      Amount: ₩500,000                                   │ │ │
│              │  │  │      Method: Bank Transfer (우리 xxx-xxx-345678)        │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      ⚠️ RISK ALERT:                                     │ │ │
│              │  │  │      • Account Age: 5 days (very new)                   │ │ │
│              │  │  │      • First payout request                             │ │ │
│              │  │  │      • High amount for new user                         │ │ │
│              │  │  │      • Risk Score: High 🔴                              │ │ │
│              │  │  │                                                          │ │ │
│              │  │  │      [View History] [✓ Approve] [✗ Reject] [⏸️ Hold]   │ │ │
│              │  │  │      [REQ-03]                                            │ │ │
│              │  │  └──────────────────────────────────────────────────────────┘ │ │
│              │  │                                                                │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
│              │                                                                       │
│              │  Bulk Actions: [□ Select All]  [✓ Approve Selected] [Process]       │
│              │                                                                       │
│              │  Showing 1-8 of 8                                [1]                 │
│              │                                                                       │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.2 요청 상세 모달

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Withdrawal Request #891                                              [✕]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request Information                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Amount:           ₩150,000                                            ││
│  │  Method:           Bank Transfer                                       ││
│  │  Bank:             신한은행                                            ││
│  │  Account:          xxx-xxx-123456                                      ││
│  │  Account Holder:   홍길동                                              ││
│  │  Requested:        Jan 7, 2026, 3:45 PM                               ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  User Information                                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Username:         top_contributor                                     ││
│  │  Email:            user@example.com                                    ││
│  │  Joined:           May 15, 2025 (8 months ago)                        ││
│  │  Verified:         ✓ Email, ✓ Phone                                  ││
│  │                                                                        ││
│  │  ───────────────────────────────────────────────────────────────────  ││
│  │                                                                        ││
│  │  Earnings Summary                                                      ││
│  │  Total Earned:     ₩450,000                                           ││
│  │  Total Withdrawn:  ₩300,000                                           ││
│  │  Available:        ₩150,000                                           ││
│  │                                                                        ││
│  │  ───────────────────────────────────────────────────────────────────  ││
│  │                                                                        ││
│  │  Content Stats                                                         ││
│  │  Posts:            127 (125 approved, 2 rejected)                     ││
│  │  Items Tagged:     456                                                 ││
│  │  Click-throughs:   12,345                                             ││
│  │  Conversion Rate:  2.8%                                               ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Previous Payouts                                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  #567  │  ₩100,000  │  Nov 15, 2025  │  ✓ Completed                  ││
│  │  #234  │  ₩200,000  │  Aug 20, 2025  │  ✓ Completed                  ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Risk Assessment                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Overall Risk:     Low ✓                                              ││
│  │                                                                        ││
│  │  ✓ Account age > 6 months                                             ││
│  │  ✓ Previous successful payouts                                        ││
│  │  ✓ Consistent posting history                                         ││
│  │  ✓ Earnings from organic content                                      ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Admin Notes                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ Add notes...                                                           ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │  [⏸️ Put on Hold]   [✗ Reject]   [✓ Approve]                        ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 처리 중 목록 (Processing)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Payout Management > Processing (3)                                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  [Pending (8)] [Processing (3)] [Completed] [Rejected]                              │
│                 ━━━━━━━━━━━━━━━━                                                     │
│                                                                                      │
│  These requests have been approved and are awaiting bank transfer.                  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [□]  Request #885                   Approved: Jan 6, 2026               │ │ │
│  │  │      User: style_master                                                  │ │ │
│  │  │      Amount: ₩200,000                                                   │ │ │
│  │  │      Method: Bank Transfer (신한 xxx-xxx-111222)                        │ │ │
│  │  │                                                                          │ │ │
│  │  │      Status: Awaiting transfer                                          │ │ │
│  │  │      Approved by: @admin1                                               │ │ │
│  │  │                                                                          │ │ │
│  │  │                                           [Mark as Transferred ✓]       │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [□]  Request #884                   Approved: Jan 5, 2026               │ │ │
│  │  │      User: kfashion_daily                                               │ │ │
│  │  │      Amount: ₩180,000                                                   │ │ │
│  │  │      Method: Bank Transfer (국민 xxx-xxx-333444)                        │ │ │
│  │  │                                                                          │ │ │
│  │  │      Status: Awaiting transfer                                          │ │ │
│  │  │      Approved by: @admin2                                               │ │ │
│  │  │                                                                          │ │ │
│  │  │                                           [Mark as Transferred ✓]       │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  Bulk Actions: [□ Select All]  [Mark All as Transferred]                            │
│                                                                                      │
│  Total Processing: ₩456,000 (3 requests)                                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 정산 리포트

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Payout Management > Reports                                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Generate Payout Report                                                              │
│                                                                                      │
│  Period:  [January 2026 ▼]       Status: [All ▼]                                   │
│                                                                                      │
│  [Generate Report]                                                                   │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  January 2026 Summary                                                                │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  Total Requests:    53                                                        │ │
│  │  Total Amount:      ₩7,368,500                                               │ │
│  │                                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Status Breakdown                                                       │ │ │
│  │  │                                                                          │ │ │
│  │  │  ██████████████████████████████████████  Completed: 42 (₩5,678,000)    │ │ │
│  │  │  ██████                                  Pending: 8 (₩1,234,500)       │ │ │
│  │  │  ███                                     Processing: 3 (₩456,000)      │ │ │
│  │  │                                          Rejected: 0 (₩0)              │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Daily Trend                                                            │ │ │
│  │  │                                                                          │ │ │
│  │  │       ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇                                           │ │ │
│  │  │       1  2  3  4  5  6  7  8  ...                                       │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  │  Top Recipients                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  1. top_contributor       ₩450,000    3 payouts                        │ │ │
│  │  │  2. style_master          ₩380,000    2 payouts                        │ │ │
│  │  │  3. fashion_expert        ₩320,000    2 payouts                        │ │ │
│  │  │  4. kfashion_daily        ₩280,000    2 payouts                        │ │ │
│  │  │  5. trendsetter           ₩250,000    2 payouts                        │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  [Export PDF] [Export CSV] [Export Excel]                                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 거절 모달

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Reject Withdrawal Request #889                                       [✕]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request Details:                                                           │
│  User: new_user_xyz                                                         │
│  Amount: ₩500,000                                                          │
│                                                                             │
│  Select rejection reason:                                                   │
│                                                                             │
│  [○] Insufficient verification                                             │
│  [○] Suspicious activity detected                                          │
│  [○] Invalid bank account information                                      │
│  [○] Account temporarily restricted                                        │
│  [●] Under review (manual check required)                                  │
│  [○] Other (specify below)                                                 │
│                                                                             │
│  Additional notes to user:                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ Your withdrawal request requires additional verification due to        ││
│  │ account age. Please contact support.                                   ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Actions:                                                                   │
│  [ ] Notify user via email                                                 │
│  [ ] Freeze user's withdrawal ability temporarily                          │
│  [ ] Flag user for manual review                                           │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  [Cancel]                               [Reject Request]               ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 요약 카드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CARD-PEND | 카드 | 대기 중 금액 | 총 대기 금액 + 요청 수 | 클릭 시 Pending 탭 |
| CARD-PROC | 카드 | 처리 중 금액 | 총 처리 중 금액 + 요청 수 | 클릭 시 Processing 탭 |
| CARD-COMP | 카드 | 완료 금액 | 이번 달 완료 금액 | 클릭 시 Completed 탭 |

### 3.2 탭/필터

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TAB-PENDING | 탭 | 대기 중 | Badge: 대기 수 | 상태 필터 |
| TAB-PROCESSING | 탭 | 처리 중 | Badge: 처리 중 수 | 상태 필터 |
| TAB-COMPLETED | 탭 | 완료됨 | - | 상태 필터 |
| TAB-REJECTED | 탭 | 거절됨 | - | 상태 필터 |
| INP-SEARCH | 입력 | 검색 | 사용자명, 요청 ID | 검색 |
| SEL-DATE | 선택 | 날짜 | Today, 7D, 30D, Custom | 기간 필터 |
| SEL-AMOUNT | 선택 | 금액 | 범위 필터 | 금액 필터 |
| SEL-METHOD | 선택 | 방법 | Bank, PayPal 등 | 결제 방법 필터 |

### 3.3 요청 카드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| REQ-n | 카드 | 출금 요청 | 금액, 사용자, 은행 정보 | 클릭 시 상세 |
| TXT-AMOUNT | 텍스트 | 금액 | ₩ 포맷 | - |
| TXT-METHOD | 텍스트 | 결제 방법 | 은행명 + 마스킹된 계좌 | - |
| BADGE-RISK | 뱃지 | 위험도 | Low/Medium/High | 색상 코딩 |
| TXT-STATS | 텍스트 | 사용자 통계 | 수익, 이전 출금, 계정 나이 | - |
| BTN-HISTORY | 버튼 | 이력 보기 | variant: ghost | 상세 모달 |
| BTN-APPROVE | 버튼 | 승인 | variant: success | 승인 처리 |
| BTN-REJECT | 버튼 | 거절 | variant: destructive | 거절 모달 |
| BTN-HOLD | 버튼 | 보류 | variant: warning | 보류 처리 (고위험만) |
| CHK-SELECT | 체크박스 | 선택 | - | 대량 처리용 |

### 3.4 상세 모달

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| MODAL-DETAIL | 모달 | 상세 모달 | max-width: 700px | - |
| SECTION-REQUEST | 섹션 | 요청 정보 | 금액, 은행, 날짜 | - |
| SECTION-USER | 섹션 | 사용자 정보 | 가입일, 인증 상태 | - |
| SECTION-EARNINGS | 섹션 | 수익 요약 | 총 수익, 출금, 잔액 | - |
| SECTION-CONTENT | 섹션 | 콘텐츠 통계 | 포스트, 클릭, 전환율 | - |
| SECTION-HISTORY | 섹션 | 이전 출금 | 테이블 형태 | - |
| SECTION-RISK | 섹션 | 위험 평가 | 체크리스트 | - |
| INP-NOTES | 입력 | 관리자 메모 | textarea | 감사 로그 |

### 3.5 리포트

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| SEL-PERIOD | 선택 | 기간 선택 | 월별 | 리포트 갱신 |
| SEL-STATUS | 선택 | 상태 필터 | All, Completed, etc. | 리포트 갱신 |
| BTN-GENERATE | 버튼 | 생성 | variant: primary | 리포트 생성 |
| CHART-STATUS | 차트 | 상태 분포 | Bar/Pie chart | - |
| CHART-TREND | 차트 | 일별 추이 | Line chart | - |
| LIST-TOP | 목록 | 상위 수령자 | 순위 + 금액 | 클릭 시 사용자 상세 |
| BTN-EXPORT | 버튼 | 내보내기 | PDF, CSV, Excel | 파일 다운로드 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로딩 | 데이터 패칭 | 스켈레톤 |
| 빈 목록 | 해당 상태 0건 | 빈 상태 메시지 |
| 고위험 요청 | risk === 'high' | 경고 배경색 + 경고 아이콘 |
| 처리 중 | API 호출 중 | 버튼 로딩 + 비활성화 |
| 대량 선택 | 1개 이상 선택 | 대량 처리 버튼 활성화 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 요청 목록 | GET | `/api/admin/withdrawals?status={status}&page={page}` | 페이지 로드, 필터 변경 |
| 요청 상세 | GET | `/api/admin/withdrawals/{id}` | 상세 모달 |
| 요청 승인 | PUT | `/api/admin/withdrawals/{id}/approve` | 승인 버튼 |
| 요청 거절 | PUT | `/api/admin/withdrawals/{id}/reject` | 거절 확인 |
| 요청 보류 | PUT | `/api/admin/withdrawals/{id}/hold` | 보류 버튼 |
| 이체 완료 | PUT | `/api/admin/withdrawals/{id}/complete` | 이체 완료 버튼 |
| 대량 처리 | POST | `/api/admin/withdrawals/bulk` | 대량 승인/처리 |
| 리포트 생성 | GET | `/api/admin/payouts/report?month={month}` | 리포트 생성 |
| 리포트 내보내기 | GET | `/api/admin/payouts/export?type={type}&month={month}` | 내보내기 버튼 |

### 5.2 요청/응답 스키마

```typescript
interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  method: 'bank_transfer' | 'paypal';
  bankInfo?: {
    bankName: string;
    accountNumber: string;  // 마스킹됨
    accountHolder: string;
  };
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'hold';
  riskScore: 'low' | 'medium' | 'high';
  userStats: {
    totalEarnings: number;
    totalWithdrawn: number;
    availableBalance: number;
    accountAge: number;     // 일 단위
    previousPayouts: number;
    successfulPayouts: number;
    postsCount: number;
    rejectionRate: number;
  };
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

interface RejectWithdrawalRequest {
  reason: string;
  note?: string;
  notifyUser?: boolean;
  freezeWithdrawals?: boolean;
  flagForReview?: boolean;
}

interface PayoutReport {
  period: string;
  summary: {
    totalRequests: number;
    totalAmount: number;
    pending: { count: number; amount: number };
    processing: { count: number; amount: number };
    completed: { count: number; amount: number };
    rejected: { count: number; amount: number };
  };
  dailyTrend: Array<{ date: string; amount: number; count: number }>;
  topRecipients: Array<{ username: string; amount: number; count: number }>;
}
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| 잔액 부족 | "User's available balance is insufficient." | 요청 자동 거절 안내 |
| 은행 정보 오류 | "Invalid bank account information." | 사용자 확인 요청 |
| 동시 처리 충돌 | "This request was already processed." | 새로고침 |
| 내보내기 실패 | "Failed to generate report." | 재시도 버튼 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 탭 → 필터 → 요청 카드들 → 페이지네이션
- `Enter`: 카드에서 상세 모달
- `Space`: 체크박스 토글

### 7.2 스크린 리더
- 요청 카드: `aria-label="Withdrawal request 891 from top_contributor for 150,000 won, risk score low"`
- 위험도 뱃지: `aria-label="Risk score: high, requires manual review"`
- 금액: 숫자 포맷팅 + 통화 명시

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | AdminPayoutsPage | `app/admin/payments/page.tsx` |
| 요약 카드 | PayoutSummaryCards | `lib/components/admin/PayoutSummaryCards.tsx` |
| 요청 목록 | WithdrawalRequestList | `lib/components/admin/WithdrawalRequestList.tsx` |
| 요청 카드 | WithdrawalRequestCard | `lib/components/admin/WithdrawalRequestCard.tsx` |
| 상세 모달 | WithdrawalDetailModal | `lib/components/admin/WithdrawalDetailModal.tsx` |
| 거절 모달 | RejectWithdrawalModal | `lib/components/admin/RejectWithdrawalModal.tsx` |
| 리포트 | PayoutReport | `lib/components/admin/PayoutReport.tsx` |
| 리포트 차트 | PayoutCharts | `lib/components/admin/PayoutCharts.tsx` |

---

## 9. 구현 체크리스트

- [ ] PayoutSummaryCards (대기/처리 중/완료)
- [ ] 상태별 탭 필터링
- [ ] WithdrawalRequestCard (위험도 표시)
- [ ] 위험도 계산 로직
- [ ] WithdrawalDetailModal (상세 정보 + 이력)
- [ ] 승인/거절/보류 기능
- [ ] 거절 사유 모달
- [ ] 이체 완료 처리 (Processing → Completed)
- [ ] 대량 처리 기능
- [ ] PayoutReport (월별 요약)
- [ ] 리포트 차트 (Recharts)
- [ ] 내보내기 (PDF, CSV, Excel)
- [ ] 감사 로그 기록
- [ ] 접근성 테스트

---

## 10. 참고 사항

### 10.1 위험도 계산
```typescript
function calculateRiskScore(user: UserStats): 'low' | 'medium' | 'high' {
  let score = 0;

  // 계정 나이
  if (user.accountAge < 7) score += 3;      // 7일 미만: 높은 위험
  else if (user.accountAge < 30) score += 2; // 30일 미만: 중간 위험
  else if (user.accountAge < 90) score += 1; // 90일 미만: 낮은 위험

  // 이전 출금 이력
  if (user.previousPayouts === 0) score += 2;
  else if (user.successfulPayouts < user.previousPayouts) score += 1;

  // 거절률
  if (user.rejectionRate > 0.3) score += 2;
  else if (user.rejectionRate > 0.1) score += 1;

  // 금액 대비 활동
  const earningsPerPost = user.totalEarnings / Math.max(user.postsCount, 1);
  if (earningsPerPost > 50000) score += 1; // 비정상적으로 높은 수익

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
```

### 10.2 거절 사유 프리셋
```typescript
const REJECTION_REASONS = [
  { id: 'insufficient_verification', label: 'Insufficient verification' },
  { id: 'suspicious_activity', label: 'Suspicious activity detected' },
  { id: 'invalid_bank', label: 'Invalid bank account information' },
  { id: 'account_restricted', label: 'Account temporarily restricted' },
  { id: 'under_review', label: 'Under review (manual check required)' },
  { id: 'other', label: 'Other (specify below)' },
];
```

### 10.3 출금 상태 흐름
```
pending → approved → processing → completed
          ↓           ↓
        rejected    (manual intervention)
          ↓
         hold → (review) → approved/rejected
```
