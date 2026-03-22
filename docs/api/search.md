# Search API

> 통합 검색 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/search` | 통합 검색 | - |
| `GET` | `/api/v1/search/popular` | 인기 검색어 | - |
| `GET` | `/api/v1/search/recent` | 최근 검색어 | O |
| `DELETE` | `/api/v1/search/recent` | 검색 기록 삭제 | O |
| `GET` | `/api/v1/search/keywords/popular` | 인기 키워드 | - |

---

## 통합 검색

Post, 아티스트, 미디어 등을 통합 검색합니다.

### Request

```http
GET /api/v1/search?q={query}
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `q` | string | O | 검색어 |
| `category` | string | - | 카테고리 필터 (fashion, living, tech, beauty) |
| `media_type` | string | - | 미디어 타입 필터 (drama, movie, mv, youtube, variety) |
| `context` | string | - | 컨텍스트 필터 (airport, stage, mv, red_carpet 등) |
| `has_adopted` | boolean | - | 채택된 Solution이 있는 Spot만 필터링 |
| `sort` | string | - | 정렬: `relevant`, `recent`, `popular`, `solution_count` |
| `page` | integer | - | 페이지 번호 (기본: 1) |
| `limit` | integer | - | 페이지당 개수 (기본: 20, 최대: 50) |

### Response

```json
{
  "data": [
    {
      "id": "post-uuid",
      "type": "post",
      "image_url": "https://images.decoded.co/...",
      "artist_name": "아이유",
      "group_name": null,
      "context": "mv",
      "media_source": {
        "type": "mv",
        "title": "Blueming"
      },
      "spot_count": 5,
      "view_count": 3200,
      "highlight": {
        "artist_name": "<em>아이유</em>"
      }
    }
  ],
  "facets": {
    "category": {
      "fashion": 45,
      "living": 12,
      "tech": 3,
      "beauty": 8
    },
    "media_type": {
      "drama": 20,
      "mv": 35,
      "variety": 13
    },
    "context": {
      "airport": 15,
      "stage": 25,
      "mv": 28
    }
  },
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 68,
    "total_pages": 4
  },
  "query": "아이유",
  "took_ms": 45
}
```

### Facets 설명

검색 결과의 필터별 집계 정보입니다. UI에서 필터 버튼의 카운트 표시에 사용됩니다.

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 검색어가 비어있음 |

---

## 인기 검색어

실시간 인기 검색어 목록을 조회합니다.

### Request

```http
GET /api/v1/search/popular
```

### Response

```json
{
  "data": [
    {
      "rank": 1,
      "query": "아이유",
      "search_count": 1520
    },
    {
      "rank": 2,
      "query": "뉴진스",
      "search_count": 1380
    },
    {
      "rank": 3,
      "query": "더 글로리",
      "search_count": 980
    }
  ]
}
```

---

## 최근 검색어

로그인한 사용자의 최근 검색 기록을 조회합니다.

### Request

```http
GET /api/v1/search/recent
Authorization: Bearer <token>
```

### Response

```json
{
  "data": [
    {
      "id": "search-log-uuid",
      "query": "아이유 코트",
      "searched_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": "search-log-uuid-2",
      "query": "뉴진스 무대의상",
      "searched_at": "2025-01-15T11:30:00Z"
    }
  ]
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 검색 기록 삭제

로그인한 사용자의 검색 기록을 삭제합니다.

### Request

```http
DELETE /api/v1/search/recent
Authorization: Bearer <token>
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `id` | uuid | - | 특정 검색 기록 ID (없으면 전체 삭제) |

### Response

```http
204 No Content
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |

---

## 인기 키워드

인기 키워드 목록을 조회합니다. (태그 클라우드 등에 사용)

### Request

```http
GET /api/v1/search/keywords/popular
```

### Response

```json
{
  "keywords": [
    {
      "keyword": "블레이저",
      "count": 520
    },
    {
      "keyword": "공항패션",
      "count": 480
    },
    {
      "keyword": "오버사이즈",
      "count": 350
    }
  ]
}
```

---

## 검색 사용 예시

### 기본 검색

```typescript
const response = await fetch('/api/v1/search?q=아이유');
const results = await response.json();
```

### 필터 적용 검색

```typescript
const params = new URLSearchParams({
  q: '아이유',
  category: 'fashion',
  media_type: 'mv',
  sort: 'recent'
});

const response = await fetch(`/api/v1/search?${params}`);
const results = await response.json();
```

### 자동완성 구현 예시

```typescript
// 디바운싱 적용
const searchDebounced = debounce(async (query: string) => {
  if (query.length < 2) return;

  const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=5`);
  const { data } = await response.json();

  // 자동완성 목록 표시
  showSuggestions(data);
}, 300);
```

---

## 검색 흐름

```
1. 검색 페이지 진입
   - GET /api/v1/search/popular (인기 검색어 표시)
   - GET /api/v1/search/recent (최근 검색어 표시, 로그인 시)

2. 검색어 입력
   - GET /api/v1/search?q={query} (실시간 검색)

3. 필터 적용
   - GET /api/v1/search?q={query}&category=fashion

4. 결과에서 Post 클릭
   - GET /api/v1/posts/{post_id}
```

---

## 관련 API

- [Posts API](./posts.md) - 검색 결과 Post 조회
- [Categories API](./categories.md) - 카테고리 필터

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
