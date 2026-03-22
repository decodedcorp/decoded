# Spots API

> Spot(이미지 내 아이템 위치 표시) 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/posts/{post_id}/spots` | Spot 목록 조회 | - |
| `POST` | `/api/v1/posts/{post_id}/spots` | Spot 추가 | O |
| `GET` | `/api/v1/spots/{spot_id}` | Spot 상세 조회 | - |
| `PATCH` | `/api/v1/spots/{spot_id}` | Spot 수정 | O |
| `DELETE` | `/api/v1/spots/{spot_id}` | Spot 삭제 | O |

---

## Spot 목록 조회

특정 Post의 모든 Spot을 조회합니다.

### Request

```http
GET /api/v1/posts/{post_id}/spots
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `post_id` | uuid | Post ID |

### Response

```json
[
  {
    "id": "spot-uuid-1",
    "position_left": "45.5%",
    "position_top": "30.2%",
    "category": {
      "id": "category-uuid",
      "code": "fashion",
      "name": {
        "ko": "패션",
        "en": "Fashion"
      },
      "color_hex": "#FF5733",
      "display_order": 1,
      "is_active": true
    },
    "status": "active",
    "created_at": "2025-01-15T12:00:00Z"
  }
]
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Post를 찾을 수 없음 |

---

## Spot 추가

Post에 새 Spot을 추가합니다.

### Request

```http
POST /api/v1/posts/{post_id}/spots
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `post_id` | uuid | Post ID |

### Request Body

```json
{
  "position_left": "45.5%",
  "position_top": "30.2%",
  "category_id": "category-uuid"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `position_left` | string | O | 위치 좌표 (왼쪽, %) |
| `position_top` | string | O | 위치 좌표 (위, %) |
| `category_id` | uuid | O | 카테고리 ID |

### Response

```json
{
  "id": "spot-uuid",
  "post_id": "post-uuid",
  "user_id": "user-uuid",
  "position_left": "45.5%",
  "position_top": "30.2%",
  "category": {
    "id": "category-uuid",
    "code": "fashion",
    "name": {
      "ko": "패션",
      "en": "Fashion"
    },
    "display_order": 1,
    "is_active": true
  },
  "status": "active",
  "created_at": "2025-01-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `404` | Post를 찾을 수 없음 |

---

## Spot 상세 조회

특정 Spot의 상세 정보를 조회합니다.

### Request

```http
GET /api/v1/spots/{spot_id}
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `spot_id` | uuid | Spot ID |

### Response

SpotResponse 스키마 반환

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Spot을 찾을 수 없음 |

---

## Spot 수정

Spot 정보를 수정합니다.

### Request

```http
PATCH /api/v1/spots/{spot_id}
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
  "position_left": "50.0%",
  "position_top": "35.0%",
  "category_id": "new-category-uuid",
  "status": "active"
}
```

모든 필드는 선택사항입니다.

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 |
| `404` | Spot을 찾을 수 없음 |

---

## Spot 삭제

Spot을 삭제합니다.

### Request

```http
DELETE /api/v1/spots/{spot_id}
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
| `404` | Spot을 찾을 수 없음 |

---

## 관련 API

- [Posts API](./posts.md) - Post 관리
- [Solutions API](./solutions.md) - Spot에 대한 Solution 등록
- [Categories API](./categories.md) - 카테고리 목록

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
