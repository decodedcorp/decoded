# Admin API

> 관리자 전용 API 엔드포인트

> **주의**: 모든 Admin API는 관리자 권한이 필요합니다.

---

## 엔드포인트 목록

### 대시보드

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/admin/dashboard/stats` | KPI 통계 조회 |
| `GET` | `/api/v1/admin/dashboard/traffic` | 트래픽 분석 |

### 카테고리 관리

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/v1/admin/categories` | 카테고리 생성 |
| `PATCH` | `/api/v1/admin/categories/{id}` | 카테고리 수정 |
| `PATCH` | `/api/v1/admin/categories/{id}/status` | 활성화/비활성화 |
| `PUT` | `/api/v1/admin/categories/order` | 순서 변경 |

### 뱃지 관리

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/admin/badges` | 뱃지 목록 |
| `POST` | `/api/v1/admin/badges` | 뱃지 생성 |
| `PATCH` | `/api/v1/admin/badges/{id}` | 뱃지 수정 |
| `DELETE` | `/api/v1/admin/badges/{id}` | 뱃지 삭제 |

### 큐레이션 관리

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/v1/admin/curations` | 큐레이션 생성 |
| `PATCH` | `/api/v1/admin/curations/{id}` | 큐레이션 수정 |
| `DELETE` | `/api/v1/admin/curations/{id}` | 큐레이션 삭제 |
| `PUT` | `/api/v1/admin/curations/order` | 순서 변경 |

### 동의어 관리

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/admin/synonyms` | 동의어 목록 |
| `POST` | `/api/v1/admin/synonyms` | 동의어 생성 |
| `PATCH` | `/api/v1/admin/synonyms/{id}` | 동의어 수정 |
| `DELETE` | `/api/v1/admin/synonyms/{id}` | 동의어 삭제 |

### 콘텐츠 관리

| Method | Path | 설명 |
|--------|------|------|
| `PATCH` | `/api/v1/admin/posts/{id}/status` | Post 상태 변경 |
| `PATCH` | `/api/v1/admin/solutions/{id}/status` | Solution 상태 변경 |

---

## 대시보드 KPI 조회

### Request

```http
GET /api/v1/admin/dashboard/stats
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "dau": 1520,
  "mau": 12500,
  "total_users": 45000,
  "total_posts": 8500,
  "total_solutions": 35000,
  "total_clicks": 520000,
  "today_posts": 45,
  "today_solutions": 180,
  "today_clicks": 3200
}
```

---

## 트래픽 분석

### Request

```http
GET /api/v1/admin/dashboard/traffic?start_date=2025-01-01&end_date=2025-01-15
Authorization: Bearer <admin_token>
```

### Query Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `start_date` | string | 시작일 (YYYY-MM-DD) |
| `end_date` | string | 종료일 (YYYY-MM-DD) |

### Response

```json
{
  "daily_traffic": [
    {
      "date": "2025-01-15",
      "dau": 1520,
      "search_count": 8500,
      "click_count": 3200
    }
  ],
  "total_searches": 125000,
  "total_clicks": 52000
}
```

---

## 카테고리 생성

### Request

```http
POST /api/v1/admin/categories
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Request Body

```json
{
  "code": "electronics",
  "name": {
    "ko": "전자제품",
    "en": "Electronics"
  },
  "description": {
    "ko": "스마트폰, 태블릿 등"
  },
  "icon_url": "https://...",
  "color_hex": "#3357FF",
  "display_order": 5
}
```

---

## 뱃지 관리

### 뱃지 생성

```http
POST /api/v1/admin/badges
Authorization: Bearer <admin_token>
Content-Type: application/json
```

```json
{
  "type": "specialist",
  "name": "BTS 전문가",
  "description": "BTS 관련 Solution 50개 이상 채택",
  "criteria": {
    "type": "group",
    "target": "BTS",
    "threshold": 50
  },
  "rarity": "legendary",
  "icon_url": "https://..."
}
```

### 뱃지 삭제

> **주의**: 이미 사용자가 획득한 뱃지는 삭제할 수 없습니다.

```http
DELETE /api/v1/admin/badges/{id}
Authorization: Bearer <admin_token>
```

---

## 동의어 관리

검색 정확도 향상을 위한 동의어를 관리합니다.

### 동의어 생성

```http
POST /api/v1/admin/synonyms
Authorization: Bearer <admin_token>
Content-Type: application/json
```

```json
{
  "type": "artist",
  "canonical": "아이유",
  "synonyms": ["IU", "이지은", "아이유님"],
  "is_active": true
}
```

### 동의어 타입

| 타입 | 설명 |
|------|------|
| `artist` | 아티스트명 |
| `group` | 그룹명 |
| `location` | 장소명 |
| `brand` | 브랜드명 |
| `other` | 기타 |

---

## 콘텐츠 상태 관리

### Post 상태 변경

```http
PATCH /api/v1/admin/posts/{id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json
```

```json
{
  "status": "hidden"
}
```

### 상태 값

| 상태 | 설명 |
|------|------|
| `active` | 활성 (정상 노출) |
| `hidden` | 숨김 (검색/목록에서 제외) |
| `deleted` | 삭제됨 |

---

## 인증 요구사항

모든 Admin API는 다음을 요구합니다:

1. 유효한 Bearer Token
2. Admin 권한 (`role: admin`)

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | Admin 권한 필요 |

---

## 관련 API

- [Categories API](./categories.md) - 일반 카테고리 조회
- [Badges API](./badges.md) - 일반 뱃지 조회
- [Posts API](./posts.md) - Post 관리
- [Solutions API](./solutions.md) - Solution 관리

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
