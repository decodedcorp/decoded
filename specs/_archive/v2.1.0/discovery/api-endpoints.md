# Discovery API Endpoints

> 발견(Discovery) 기능에 필요한 API 엔드포인트

---

## 필요 API

### 핵심 API

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/posts` | Post 목록 조회 | [posts.md](../../docs/api/posts.md) |
| `GET /api/v1/search` | 통합 검색 | [search.md](../../docs/api/search.md) |
| `GET /api/v1/categories` | 카테고리 필터 | [categories.md](../../docs/api/categories.md) |

### 검색 관련 API

| API | 용도 |
|-----|------|
| `GET /api/v1/search/popular` | 인기 검색어 |
| `GET /api/v1/search/recent` | 최근 검색어 (인증) |
| `DELETE /api/v1/search/recent` | 검색 기록 삭제 |

---

## 화면별 API 호출

### 홈 화면 (SCR-DISC-01)

```typescript
// 초기 로드
const [posts, categories, popular] = await Promise.all([
  fetch('/api/v1/posts?sort=recent&per_page=20'),
  fetch('/api/v1/categories'),
  fetch('/api/v1/search/popular')
]);

// 무한 스크롤
const morePosts = await fetch(`/api/v1/posts?page=${nextPage}`);
```

### 검색 화면 (SCR-DISC-03)

```typescript
// 검색 페이지 진입
const [popular, recent] = await Promise.all([
  fetch('/api/v1/search/popular'),
  fetch('/api/v1/search/recent', { headers: authHeaders })
]);

// 검색 실행
const results = await fetch(`/api/v1/search?q=${query}&category=${filter}`);
```

---

## TypeScript 타입

```typescript
import type {
  PostListItem,
  CategoryResponse,
  SearchResultItem,
  PopularSearchItem
} from '@/lib/api/types';

// 홈 화면 데이터
interface HomeData {
  posts: PostListItem[];
  categories: CategoryResponse[];
  popularSearches: PopularSearchItem[];
}

// 검색 결과 데이터
interface SearchData {
  results: SearchResultItem[];
  facets: Facets;
  pagination: PaginationMeta;
}
```

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
