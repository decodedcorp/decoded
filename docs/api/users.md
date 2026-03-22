# Users API

> 사용자 프로필 및 활동 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/users/me` | 내 프로필 조회 | O |
| `PATCH` | `/api/v1/users/me` | 프로필 수정 | O |
| `GET` | `/api/v1/users/me/activities` | 활동 내역 조회 | O |
| `GET` | `/api/v1/users/me/stats` | 활동 통계 조회 | O |
| `GET` | `/api/v1/users/{user_id}` | 공개 프로필 조회 | - |

---

## 내 프로필 조회

로그인한 사용자의 프로필을 조회합니다.

### Request

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

### Response

```json
{
  "id": "user-uuid",
  "username": "fashionista",
  "display_name": "패션러버",
  "avatar_url": "https://...",
  "bio": "패션을 사랑하는 사람입니다",
  "rank": "expert",
  "created_at": "2024-06-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 프로필 수정

로그인한 사용자의 프로필을 수정합니다.

### Request

```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

```json
{
  "display_name": "새로운 닉네임",
  "avatar_url": "https://...",
  "bio": "새로운 자기소개"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `display_name` | string | - | 표시 이름 |
| `avatar_url` | string | - | 아바타 URL |
| `bio` | string | - | 자기소개 |

모든 필드는 선택사항입니다.

### Response

수정된 UserResponse 반환

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |
| `401` | 인증 필요 |

---

## 활동 내역 조회

로그인한 사용자의 활동 내역을 조회합니다.

### Request

```http
GET /api/v1/users/me/activities
Authorization: Bearer <token>
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `type` | string | - | 활동 타입 필터: `post`, `spot`, `solution` |
| `page` | integer | - | 페이지 번호 (기본: 1) |
| `per_page` | integer | - | 페이지당 개수 (기본: 20, 최대: 100) |

### Response

```json
{
  "data": [
    {
      "id": "activity-uuid-1",
      "type": "post",
      "title": "아이유 뮤비 의상",
      "created_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": "activity-uuid-2",
      "type": "solution",
      "product_name": "ZARA 블레이저",
      "is_adopted": true,
      "is_verified": true,
      "spot": {
        "id": "spot-uuid",
        "post": {
          "id": "post-uuid",
          "image_url": "https://...",
          "artist_name": "아이유"
        }
      },
      "created_at": "2025-01-14T15:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

### 활동 타입

| 타입 | 설명 | 포함 필드 |
|------|------|----------|
| `post` | Post 작성 | title |
| `spot` | Spot 등록 | spot |
| `solution` | Solution 등록 | product_name, is_adopted, is_verified, spot |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 활동 통계 조회

로그인한 사용자의 활동 통계를 조회합니다.

### Request

```http
GET /api/v1/users/me/stats
Authorization: Bearer <token>
```

### Response

```json
{
  "post_count": 15,
  "spot_count": 45,
  "solution_count": 120,
  "adopted_count": 35,
  "verified_count": 80,
  "total_points": 2500
}
```

| 필드 | 설명 |
|------|------|
| `post_count` | 작성한 Post 수 |
| `spot_count` | 등록한 Spot 수 |
| `solution_count` | 등록한 Solution 수 |
| `adopted_count` | 채택된 Solution 수 |
| `verified_count` | 검증된 Solution 수 |
| `total_points` | 총 획득 포인트 |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 공개 프로필 조회

다른 사용자의 공개 프로필을 조회합니다.

### Request

```http
GET /api/v1/users/{user_id}
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `user_id` | uuid | 사용자 ID |

### Response

```json
{
  "id": "user-uuid",
  "username": "fashionista",
  "display_name": "패션러버",
  "avatar_url": "https://...",
  "bio": "패션을 사랑하는 사람입니다",
  "rank": "expert",
  "created_at": "2024-06-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | 사용자를 찾을 수 없음 |

---

## 사용자 등급 (Rank)

| 등급 | 설명 | 조건 |
|------|------|------|
| `beginner` | 초보자 | 가입 시 기본 |
| `intermediate` | 중급자 | Solution 10개 이상 |
| `expert` | 전문가 | Solution 50개 이상, 채택률 50% 이상 |
| `master` | 마스터 | Solution 100개 이상, 채택률 70% 이상 |

---

## 예시 코드 (TypeScript)

```typescript
// 내 프로필 조회
const profileResponse = await fetch('/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const profile = await profileResponse.json();

// 프로필 수정
const updateResponse = await fetch('/api/v1/users/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display_name: '새 닉네임',
    bio: '새 자기소개'
  })
});

// 활동 내역 조회
const activitiesResponse = await fetch('/api/v1/users/me/activities?type=solution', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data: activities, pagination } = await activitiesResponse.json();
```

---

## 관련 API

- [Rankings API](./rankings.md) - 사용자 랭킹
- [Badges API](./badges.md) - 사용자 뱃지
- [Earnings API](./earnings.md) - 수익 현황

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
