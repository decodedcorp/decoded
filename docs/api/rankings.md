# Rankings API

> 랭킹 시스템 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/rankings` | 전체 랭킹 조회 | 선택 |
| `GET` | `/api/v1/rankings/categories/{category_code}` | 카테고리별 랭킹 | 선택 |
| `GET` | `/api/v1/rankings/me` | 내 랭킹 상세 | O |

---

## 전체 랭킹 조회

전체 사용자 랭킹을 조회합니다. 인증된 사용자는 본인의 랭킹 정보도 함께 제공됩니다.

### Request

```http
GET /api/v1/rankings
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `period` | string | - | 기간: `weekly`, `monthly`, `all_time` (기본: all_time) |
| `page` | integer | - | 페이지 번호 (기본: 1) |
| `per_page` | integer | - | 페이지당 개수 (기본: 20) |

### Response

```json
{
  "data": [
    {
      "rank": 1,
      "user": {
        "id": "user-uuid-1",
        "username": "top_fashionista",
        "avatar_url": "https://...",
        "rank": "master"
      },
      "total_points": 15200,
      "weekly_points": 520,
      "solution_count": 450,
      "adopted_count": 280,
      "verified_count": 380
    },
    {
      "rank": 2,
      "user": {
        "id": "user-uuid-2",
        "username": "style_hunter",
        "avatar_url": "https://...",
        "rank": "expert"
      },
      "total_points": 12800,
      "weekly_points": 480,
      "solution_count": 320,
      "adopted_count": 200,
      "verified_count": 280
    }
  ],
  "my_ranking": {
    "rank": 156,
    "total_points": 2500,
    "weekly_points": 85
  },
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 5000,
    "total_pages": 250
  }
}
```

### 포인트 계산

| 활동 | 포인트 |
|------|--------|
| Solution 등록 | +5 |
| Solution 검증됨 (Verified) | +10 |
| Solution 채택됨 (Adopted) | +30 |
| Perfect Match 채택 | +50 |
| Accurate 투표 받음 | +1 |

---

## 카테고리별 랭킹 조회

특정 카테고리의 랭킹을 조회합니다.

### Request

```http
GET /api/v1/rankings/categories/{category_code}
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `category_code` | string | 카테고리 코드 (fashion, living, tech, beauty) |

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `page` | integer | - | 페이지 번호 |
| `per_page` | integer | - | 페이지당 개수 |

### Response

```json
{
  "category_code": "fashion",
  "data": [
    {
      "rank": 1,
      "user": {
        "id": "user-uuid",
        "username": "fashion_expert",
        "avatar_url": "https://...",
        "rank": "master"
      },
      "category_points": 8500,
      "solution_count": 280,
      "adopted_count": 180
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 1200,
    "total_pages": 60
  }
}
```

---

## 내 랭킹 상세 조회

로그인한 사용자의 상세 랭킹 정보를 조회합니다.

### Request

```http
GET /api/v1/rankings/me
Authorization: Bearer <token>
```

### Response

```json
{
  "overall_rank": 156,
  "total_points": 2500,
  "weekly_points": 85,
  "monthly_points": 450,
  "solution_stats": {
    "total_count": 120,
    "adopted_count": 35,
    "verified_count": 80,
    "accurate_votes": 520
  },
  "category_rankings": [
    {
      "category_code": "fashion",
      "category_name": "패션",
      "rank": 45,
      "points": 1800
    },
    {
      "category_code": "living",
      "category_name": "리빙",
      "rank": 120,
      "points": 500
    },
    {
      "category_code": "beauty",
      "category_name": "뷰티",
      "rank": 88,
      "points": 200
    }
  ]
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 랭킹 기간 설명

| 기간 | 설명 |
|------|------|
| `weekly` | 이번 주 (월요일~일요일) 획득 포인트 기준 |
| `monthly` | 이번 달 획득 포인트 기준 |
| `all_time` | 전체 누적 포인트 기준 |

---

## 예시 코드 (TypeScript)

```typescript
// 전체 랭킹 조회 (주간)
const response = await fetch('/api/v1/rankings?period=weekly', {
  headers: {
    'Authorization': `Bearer ${token}`  // 선택: 내 랭킹도 함께 조회
  }
});
const { data: rankings, my_ranking, pagination } = await response.json();

// 카테고리별 랭킹
const fashionRankings = await fetch('/api/v1/rankings/categories/fashion');

// 내 랭킹 상세
const myRanking = await fetch('/api/v1/rankings/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 관련 API

- [Users API](./users.md) - 사용자 통계
- [Badges API](./badges.md) - 랭킹 관련 뱃지
- [Solutions API](./solutions.md) - 포인트 획득 활동

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
