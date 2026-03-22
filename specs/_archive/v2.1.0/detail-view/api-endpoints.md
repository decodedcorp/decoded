# Detail View API Endpoints

> 상세 보기(Detail View) 기능에 필요한 API 엔드포인트

---

## 필요 API

### Post 관련

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/posts/{post_id}` | Post 상세 조회 | [posts.md](../../docs/api/posts.md) |
| `DELETE /api/v1/posts/{post_id}` | Post 삭제 | [posts.md](../../docs/api/posts.md) |

### Spot 관련

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/posts/{post_id}/spots` | Spot 목록 | [spots.md](../../docs/api/spots.md) |
| `GET /api/v1/spots/{spot_id}` | Spot 상세 | [spots.md](../../docs/api/spots.md) |

### Solution 관련

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/spots/{spot_id}/solutions` | Solution 목록 | [solutions.md](../../docs/api/solutions.md) |
| `POST /api/v1/spots/{spot_id}/solutions` | Solution 등록 | [solutions.md](../../docs/api/solutions.md) |
| `POST /api/v1/solutions/{id}/adopt` | Solution 채택 | [solutions.md](../../docs/api/solutions.md) |
| `POST /api/v1/solutions/extract-metadata` | URL 메타데이터 | [solutions.md](../../docs/api/solutions.md) |

### 투표 관련

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/solutions/{id}/votes` | 투표 현황 | [votes.md](../../docs/api/votes.md) |
| `POST /api/v1/solutions/{id}/votes` | 투표하기 | [votes.md](../../docs/api/votes.md) |
| `DELETE /api/v1/solutions/{id}/votes` | 투표 취소 | [votes.md](../../docs/api/votes.md) |

### 댓글 관련

| API | 용도 | 문서 |
|-----|------|------|
| `GET /api/v1/posts/{post_id}/comments` | 댓글 목록 | [comments.md](../../docs/api/comments.md) |
| `POST /api/v1/posts/{post_id}/comments` | 댓글 작성 | [comments.md](../../docs/api/comments.md) |

---

## 화면별 API 호출

### Post 상세 화면 (SCR-VIEW-01)

```typescript
// 초기 로드
const [post, spots, comments] = await Promise.all([
  fetch(`/api/v1/posts/${postId}`),
  fetch(`/api/v1/posts/${postId}/spots`),
  fetch(`/api/v1/posts/${postId}/comments`)
]);

// 조회수 증가는 서버에서 자동 처리
```

### Spot 상세 (SCR-VIEW-02)

```typescript
// Spot 선택 시
const [spot, solutions] = await Promise.all([
  fetch(`/api/v1/spots/${spotId}`),
  fetch(`/api/v1/spots/${spotId}/solutions`)
]);

// Solution 등록 시
const metadata = await fetch('/api/v1/solutions/extract-metadata', {
  method: 'POST',
  body: JSON.stringify({ url: productUrl })
});

const newSolution = await fetch(`/api/v1/spots/${spotId}/solutions`, {
  method: 'POST',
  body: JSON.stringify({
    original_url: productUrl,
    product_name: metadata.title,
    brand: metadata.brand,
    price: metadata.price
  })
});
```

### Solution 상세 (SCR-VIEW-03)

```typescript
// 투표
await fetch(`/api/v1/solutions/${solutionId}/votes`, {
  method: 'POST',
  body: JSON.stringify({ vote_type: 'accurate' })
});

// 채택 (Spot 작성자만)
await fetch(`/api/v1/solutions/${solutionId}/adopt`, {
  method: 'POST',
  body: JSON.stringify({ match_type: 'perfect' })
});

// 클릭 기록 (상품 링크 클릭 시)
await fetch('/api/v1/clicks', {
  method: 'POST',
  body: JSON.stringify({ solution_id: solutionId })
});
```

---

## TypeScript 타입

```typescript
import type {
  PostResponse,
  SpotResponse,
  SolutionResponse,
  CommentResponse,
  VoteStatsResponse
} from '@/lib/api/types';

// Post 상세 화면 데이터
interface PostDetailData {
  post: PostResponse;
  spots: SpotResponse[];
  comments: CommentResponse[];
}

// Spot 상세 데이터
interface SpotDetailData {
  spot: SpotResponse;
  solutions: SolutionResponse[];
}
```

---

## 변경 이력

- **2026-01-22**: API 경로 동기화 (`/api/v1/links/*` → `/api/v1/solutions/*`)
- **2025-01-15**: 초기 문서 생성
