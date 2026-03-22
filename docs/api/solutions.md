# Solutions API

> Solution(상품 정보 답변) 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/spots/{spot_id}/solutions` | Solution 목록 조회 | - |
| `POST` | `/api/v1/spots/{spot_id}/solutions` | Solution 등록 | O |
| `GET` | `/api/v1/solutions/{solution_id}` | Solution 상세 조회 | - |
| `PATCH` | `/api/v1/solutions/{solution_id}` | Solution 수정 | O |
| `DELETE` | `/api/v1/solutions/{solution_id}` | Solution 삭제 | O |
| `POST` | `/api/v1/solutions/{solution_id}/adopt` | Solution 채택 | O |
| `POST` | `/api/v1/solutions/extract-metadata` | 메타데이터 추출 | - |
| `POST` | `/api/v1/solutions/convert-affiliate` | 제휴 링크 변환 | - |

---

## Solution 목록 조회

특정 Spot에 등록된 모든 Solution을 조회합니다.

### Request

```http
GET /api/v1/spots/{spot_id}/solutions
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `spot_id` | uuid | Spot ID |

### Response

```json
[
  {
    "id": "solution-uuid",
    "user": {
      "id": "user-uuid",
      "username": "fashionista",
      "avatar_url": "https://...",
      "rank": "expert"
    },
    "product_name": "ZARA 오버사이즈 블레이저",
    "brand": "ZARA",
    "price": {
      "amount": 129000,
      "currency": "KRW"
    },
    "thumbnail_url": "https://...",
    "vote_stats": {
      "accurate_count": 15,
      "different_count": 2,
      "total_count": 17
    },
    "is_verified": true,
    "is_adopted": true,
    "match_type": "perfect",
    "created_at": "2025-01-15T12:00:00Z"
  }
]
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Spot을 찾을 수 없음 |

---

## Solution 등록

Spot에 새 Solution(상품 정보)을 등록합니다.

### Request

```http
POST /api/v1/spots/{spot_id}/solutions
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `spot_id` | uuid | Spot ID |

### Request Body

```json
{
  "original_url": "https://www.zara.com/kr/ko/product/12345",
  "product_name": "오버사이즈 블레이저",
  "brand": "ZARA",
  "description": "편안한 핏의 오버사이즈 블레이저",
  "price": {
    "amount": 129000,
    "currency": "KRW"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `original_url` | string | O | 원본 상품 URL |
| `product_name` | string | - | 상품명 (없으면 메타데이터에서 추출) |
| `brand` | string | - | 브랜드명 (없으면 메타데이터에서 추출) |
| `description` | string | - | 상품 설명 |
| `price` | object | - | 가격 정보 (없으면 메타데이터에서 추출) |

### Response

```json
{
  "id": "solution-uuid",
  "spot_id": "spot-uuid",
  "user": {
    "id": "user-uuid",
    "username": "fashionista",
    "rank": "beginner"
  },
  "product_name": "오버사이즈 블레이저",
  "brand": "ZARA",
  "description": "편안한 핏의 오버사이즈 블레이저",
  "price": {
    "amount": 129000,
    "currency": "KRW"
  },
  "original_url": "https://www.zara.com/kr/ko/product/12345",
  "affiliate_url": "https://link.decoded.co/...",
  "thumbnail_url": "https://...",
  "vote_stats": {
    "accurate_count": 0,
    "different_count": 0,
    "total_count": 0
  },
  "is_verified": false,
  "is_adopted": false,
  "match_type": null,
  "click_count": 0,
  "purchase_count": 0,
  "created_at": "2025-01-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `404` | Spot을 찾을 수 없음 |

---

## Solution 상세 조회

특정 Solution의 상세 정보를 조회합니다.

### Request

```http
GET /api/v1/solutions/{solution_id}
```

### Response

SolutionResponse 스키마 반환

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Solution을 찾을 수 없음 |

---

## Solution 수정

Solution 정보를 수정합니다. 작성자만 수정 가능합니다.

### Request

```http
PATCH /api/v1/solutions/{solution_id}
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

```json
{
  "product_name": "수정된 상품명",
  "brand": "ZARA",
  "description": "수정된 설명",
  "price": {
    "amount": 99000,
    "currency": "KRW"
  }
}
```

모든 필드는 선택사항입니다.

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 |
| `404` | Solution을 찾을 수 없음 |

---

## Solution 삭제

Solution을 삭제합니다. 작성자만 삭제 가능합니다.

### Request

```http
DELETE /api/v1/solutions/{solution_id}
Authorization: Bearer <token>
```

### Response

```http
204 No Content
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 |
| `404` | Solution을 찾을 수 없음 |

---

## Solution 채택

Spot 작성자가 Solution을 채택합니다.

### Request

```http
POST /api/v1/solutions/{solution_id}/adopt
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

```json
{
  "match_type": "perfect"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `match_type` | string | O | 매치 타입: `perfect` (정확히 일치) 또는 `close` (유사) |

### Response

```json
{
  "solution_id": "solution-uuid",
  "is_adopted": true,
  "match_type": "perfect",
  "adopted_at": "2025-01-15T12:00:00Z",
  "updated_spot": {
    "spot_id": "spot-uuid",
    "product_name": "오버사이즈 블레이저",
    "brand": "ZARA",
    "price_amount": 129000,
    "price_currency": "KRW"
  }
}
```

### Match Type 설명

| 타입 | 설명 |
|------|------|
| `perfect` | 정확히 동일한 상품 (Spot에 상품 정보가 업데이트됨) |
| `close` | 유사한 상품 (대안으로 채택) |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 (Spot 작성자만 채택 가능) |
| `404` | Solution을 찾을 수 없음 |

---

## 메타데이터 추출

상품 URL에서 메타데이터를 추출합니다.

### Request

```http
POST /api/v1/solutions/extract-metadata
Content-Type: application/json
```

### Request Body

```json
{
  "url": "https://www.zara.com/kr/ko/product/12345"
}
```

### Response

```json
{
  "url": "https://www.zara.com/kr/ko/product/12345",
  "title": "오버사이즈 블레이저",
  "brand": "ZARA",
  "description": "편안한 핏의 오버사이즈 블레이저",
  "thumbnail_url": "https://...",
  "price": {
    "amount": 129000,
    "currency": "KRW"
  },
  "is_affiliate_supported": true
}
```

---

## 제휴 링크 변환

일반 상품 URL을 제휴 링크로 변환합니다.

### Request

```http
POST /api/v1/solutions/convert-affiliate
Content-Type: application/json
```

### Request Body

```json
{
  "url": "https://www.zara.com/kr/ko/product/12345"
}
```

### Response

```json
{
  "original_url": "https://www.zara.com/kr/ko/product/12345",
  "affiliate_url": "https://link.decoded.co/zara/12345?ref=decoded"
}
```

---

## 사용 흐름

### Solution 등록 플로우

```
1. 상품 URL 메타데이터 추출 (선택)
   POST /api/v1/solutions/extract-metadata
   → product_name, brand, price 자동 획득

2. Solution 등록
   POST /api/v1/spots/{spot_id}/solutions
   → Solution 생성 완료

3. 다른 사용자들의 투표
   POST /api/v1/solutions/{solution_id}/votes
   → 신뢰도 상승

4. Spot 작성자의 채택
   POST /api/v1/solutions/{solution_id}/adopt
   → Solution 채택 완료
```

---

## 관련 API

- [Spots API](./spots.md) - Spot 관리
- [Votes API](./votes.md) - Solution 투표
- [Earnings API](./earnings.md) - Solution 클릭 수익

---

## 변경 이력

- **2026-01-22**: API 경로 동기화 (`/api/v1/links/*` → `/api/v1/solutions/*`)
- **2025-01-15**: 초기 문서 생성
