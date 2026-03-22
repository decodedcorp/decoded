# Earnings API

> 수익 및 정산 관련 API 엔드포인트

> **참고**: 현재 임시 구현 상태입니다. 실제 정산 시스템은 추후 구현 예정입니다.

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/earnings` | 수익 현황 조회 | O |
| `GET` | `/api/v1/earnings/clicks` | 클릭 통계 조회 | O |
| `GET` | `/api/v1/settlements` | 정산 내역 조회 | O |
| `POST` | `/api/v1/clicks` | 클릭 기록 | - |

---

## 수익 현황 조회

로그인한 사용자의 수익 현황을 조회합니다.

### Request

```http
GET /api/v1/earnings
Authorization: Bearer <token>
```

### Response

```json
{
  "total_earnings": 125000,
  "available_balance": 85000,
  "pending_settlement": 40000,
  "monthly_earnings": [
    {
      "month": "2025-01",
      "gross_earnings": 45000,
      "platform_fee": 9000,
      "net_earnings": 36000,
      "status": "pending"
    },
    {
      "month": "2024-12",
      "gross_earnings": 52000,
      "platform_fee": 10400,
      "net_earnings": 41600,
      "status": "settled"
    }
  ]
}
```

### 응답 필드 설명

| 필드 | 설명 |
|------|------|
| `total_earnings` | 총 누적 수익 (원) |
| `available_balance` | 출금 가능 잔액 |
| `pending_settlement` | 정산 대기 금액 |
| `monthly_earnings` | 월별 수익 내역 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 클릭 통계 조회

로그인한 사용자의 Solution 클릭 통계를 조회합니다.

### Request

```http
GET /api/v1/earnings/clicks
Authorization: Bearer <token>
```

### Response

```json
{
  "total_clicks": 5200,
  "unique_clicks": 3800,
  "monthly_stats": [
    {
      "month": "2025-01",
      "clicks": 520,
      "unique_clicks": 380
    },
    {
      "month": "2024-12",
      "clicks": 680,
      "unique_clicks": 450
    }
  ]
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 정산 내역 조회

정산 내역을 조회합니다.

### Request

```http
GET /api/v1/settlements
Authorization: Bearer <token>
```

### Response

```json
{
  "data": [
    {
      "id": "settlement-uuid",
      "amount": "41600",
      "currency": "KRW",
      "status": "completed",
      "created_at": "2025-01-05T00:00:00Z"
    }
  ]
}
```

### 정산 상태

| 상태 | 설명 |
|------|------|
| `pending` | 정산 대기 중 |
| `processing` | 정산 처리 중 |
| `completed` | 정산 완료 |
| `failed` | 정산 실패 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 클릭 기록

Solution 링크 클릭을 기록합니다. 수익 집계에 사용됩니다.

### Request

```http
POST /api/v1/clicks
Content-Type: application/json
```

### Request Body

```json
{
  "solution_id": "solution-uuid",
  "referrer": "https://decoded.co/posts/post-uuid"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `solution_id` | uuid | O | Solution ID |
| `referrer` | string | - | HTTP Referrer |

### Response

```http
201 Created
```

---

## 수익 계산 방식

### 클릭당 수익 (CPC)

| 조건 | 수익 |
|------|------|
| 일반 클릭 | ~10원 |
| 제휴 링크 클릭 | ~50원 |
| 구매 전환 | 구매액의 1~5% |

### 플랫폼 수수료

- 총 수익의 20%

### 정산 주기

- 매월 1일에 전월 수익 정산
- 최소 정산 금액: 10,000원

---

## 예시 코드 (TypeScript)

```typescript
// 수익 현황 조회
const earningsResponse = await fetch('/api/v1/earnings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const earnings = await earningsResponse.json();

// 클릭 기록 (Solution 링크 클릭 시)
const handleSolutionClick = async (solutionId: string, affiliateUrl: string) => {
  // 클릭 기록
  await fetch('/api/v1/clicks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      solution_id: solutionId,
      referrer: window.location.href
    })
  });

  // 상품 페이지로 이동
  window.open(affiliateUrl, '_blank');
};
```

---

## 관련 API

- [Solutions API](./solutions.md) - Solution 관리
- [Users API](./users.md) - 사용자 프로필
- [Admin API](./admin.md) - 정산 관리

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성 (임시 구현)
