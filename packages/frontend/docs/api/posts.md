# Posts API

> Post(이미지 게시물) 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/posts` | Post 목록 조회 | - |
| `POST` | `/api/v1/posts` | Post 생성 | O |
| `GET` | `/api/v1/posts/{post_id}` | Post 상세 조회 | - |
| `PATCH` | `/api/v1/posts/{post_id}` | Post 수정 | O |
| `DELETE` | `/api/v1/posts/{post_id}` | Post 삭제 | O |
| `POST` | `/api/v1/posts/upload` | 이미지 업로드 | O |
| `POST` | `/api/v1/posts/analyze` | AI 이미지 분석 | - |

---

## POST 목록 조회

Post 목록을 조회합니다.

### Request

```http
GET /api/v1/posts
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `artist_name` | string | - | 아티스트명 필터 |
| `group_name` | string | - | 그룹명 필터 |
| `context` | string | - | 상황 필터 (airport, stage, mv 등) |
| `category` | string | - | 카테고리 필터 (fashion, living 등) |
| `user_id` | uuid | - | 작성자 ID 필터 |
| `sort` | string | - | 정렬 방식: `recent`, `popular`, `trending` |
| `page` | integer | - | 페이지 번호 (기본: 1) |
| `per_page` | integer | - | 페이지당 개수 (기본: 20) |

### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user": {
        "id": "user-uuid",
        "username": "fashionista",
        "avatar_url": "https://...",
        "rank": "expert"
      },
      "image_url": "https://images.decoded.co/...",
      "media_source": {
        "type": "drama",
        "title": "더 글로리",
        "platform": "Netflix",
        "year": 2023
      },
      "artist_name": "송혜교",
      "group_name": null,
      "context": "drama",
      "spot_count": 3,
      "view_count": 1520,
      "comment_count": 12,
      "created_at": "2025-01-15T12:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |

---

## Post 생성

새 Post를 생성합니다. 최소 1개 이상의 Spot이 필요합니다.

### Request

```http
POST /api/v1/posts
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

```json
{
  "image_url": "https://images.decoded.co/uploaded/...",
  "media_source": {
    "type": "drama",
    "title": "더 글로리",
    "platform": "Netflix",
    "year": 2023,
    "episode": 5
  },
  "spots": [
    {
      "position_left": "45.5%",
      "position_top": "30.2%",
      "category_id": "category-uuid"
    }
  ],
  "artist_name": "송혜교",
  "group_name": null,
  "context": "drama"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `image_url` | string | O | 업로드된 이미지 URL |
| `media_source` | object | O | 미디어 소스 정보 |
| `media_source.type` | string | O | 미디어 타입 |
| `media_source.title` | string | O | 미디어 제목 |
| `spots` | array | O | Spot 목록 (최소 1개) |
| `artist_name` | string | - | 아티스트명 |
| `group_name` | string | - | 그룹명 |
| `context` | string | - | 상황 정보 |

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "image_url": "https://images.decoded.co/...",
  "media_source": {
    "type": "drama",
    "title": "더 글로리"
  },
  "artist_name": "송혜교",
  "group_name": null,
  "context": "drama",
  "view_count": 0,
  "status": "active",
  "created_at": "2025-01-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 (spots가 비어있음 등) |
| `401` | 인증 필요 |

---

## Post 상세 조회

특정 Post의 상세 정보를 조회합니다.

### Request

```http
GET /api/v1/posts/{post_id}
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `post_id` | uuid | Post ID |

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "image_url": "https://images.decoded.co/...",
  "media_source": {
    "type": "drama",
    "title": "더 글로리",
    "platform": "Netflix",
    "year": 2023
  },
  "artist_name": "송혜교",
  "group_name": null,
  "context": "drama",
  "view_count": 1520,
  "status": "active",
  "created_at": "2025-01-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Post를 찾을 수 없음 |

---

## Post 수정

Post 정보를 수정합니다. 작성자만 수정 가능합니다.

### Request

```http
PATCH /api/v1/posts/{post_id}
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
  "artist_name": "송혜교",
  "group_name": null,
  "context": "drama",
  "media_source": {
    "type": "drama",
    "title": "더 글로리 시즌2",
    "episode": 10
  },
  "status": "active"
}
```

모든 필드는 선택사항입니다. 변경하고 싶은 필드만 전송합니다.

### Response

수정된 Post 정보를 반환합니다. (PostResponse 스키마)

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 (본인 Post만 수정 가능) |
| `404` | Post를 찾을 수 없음 |

---

## Post 삭제

Post를 삭제합니다. 작성자만 삭제 가능합니다.

### Request

```http
DELETE /api/v1/posts/{post_id}
Authorization: Bearer <token>
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `post_id` | uuid | Post ID |

### Response

```http
204 No Content
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 권한 없음 (본인 Post만 삭제 가능) |
| `404` | Post를 찾을 수 없음 |

---

## 이미지 업로드

Post 생성 전 이미지를 먼저 업로드합니다.

### Request

```http
POST /api/v1/posts/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Request Body

`multipart/form-data` 형식으로 이미지 파일을 전송합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | file | 이미지 파일 (JPEG, PNG, WebP) |

### Response

```json
{
  "image_url": "https://images.decoded.co/uploaded/abc123.jpg"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 (지원하지 않는 파일 형식 등) |
| `401` | 인증 필요 |

---

## AI 이미지 분석

업로드된 이미지를 AI로 분석하여 아이템 위치와 메타데이터를 추출합니다.

### Request

```http
POST /api/v1/posts/analyze
Content-Type: application/json
```

### Request Body

```json
{
  "image_url": "https://images.decoded.co/uploaded/abc123.jpg"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `image_url` | string | O | 분석할 이미지 URL |

### Response

```json
{
  "image_url": "https://images.decoded.co/uploaded/abc123.jpg",
  "detected_items": [
    {
      "left": 45.5,
      "top": 30.2,
      "category": "fashion",
      "label": "jacket",
      "confidence": 0.92
    },
    {
      "left": 60.3,
      "top": 55.8,
      "category": "fashion",
      "label": "bag",
      "confidence": 0.87
    }
  ],
  "metadata": {
    "artist_name": "송혜교",
    "group_name": null,
    "context": "drama"
  }
}
```

### DetectedItem 스키마

| 필드 | 타입 | 설명 |
|------|------|------|
| `left` | number | 위치 좌표 (왼쪽, %) |
| `top` | number | 위치 좌표 (위, %) |
| `category` | string | 카테고리 코드 |
| `label` | string | 아이템 라벨 |
| `confidence` | number | 신뢰도 (0.0 ~ 1.0) |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |

---

## 사용 흐름

### Post 생성 플로우

```
1. 이미지 업로드
   POST /api/v1/posts/upload
   → image_url 획득

2. AI 분석 (선택)
   POST /api/v1/posts/analyze
   → detected_items, metadata 획득

3. Post 생성
   POST /api/v1/posts
   → Post 생성 완료
```

### 예시 코드 (TypeScript)

```typescript
// 1. 이미지 업로드
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('/api/v1/posts/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
const { image_url } = await uploadResponse.json();

// 2. AI 분석
const analyzeResponse = await fetch('/api/v1/posts/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ image_url })
});
const { detected_items, metadata } = await analyzeResponse.json();

// 3. Post 생성
const postResponse = await fetch('/api/v1/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url,
    media_source: {
      type: 'drama',
      title: '더 글로리'
    },
    spots: detected_items.map(item => ({
      position_left: `${item.left}%`,
      position_top: `${item.top}%`,
      category_id: getCategoryIdByCode(item.category)
    })),
    artist_name: metadata.artist_name,
    context: metadata.context
  })
});
```

---

## 관련 API

- [Spots API](./spots.md) - Post 내 Spot 관리
- [Comments API](./comments.md) - Post 댓글
- [Search API](./search.md) - Post 검색

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
