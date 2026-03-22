# Comments API

> 댓글 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/posts/{post_id}/comments` | 댓글 목록 조회 | - |
| `POST` | `/api/v1/posts/{post_id}/comments` | 댓글 작성 | O |
| `PATCH` | `/api/v1/comments/{comment_id}` | 댓글 수정 | O |
| `DELETE` | `/api/v1/comments/{comment_id}` | 댓글 삭제 | O |

---

## 댓글 목록 조회

특정 Post의 모든 댓글을 조회합니다. 대댓글은 계층 구조로 포함됩니다.

### Request

```http
GET /api/v1/posts/{post_id}/comments
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `post_id` | uuid | Post ID |

### Response

```json
[
  {
    "id": "comment-uuid-1",
    "post_id": "post-uuid",
    "user_id": "user-uuid",
    "content": "이 코트 어디 건가요?",
    "parent_id": null,
    "user": {
      "id": "user-uuid",
      "username": "fashionista",
      "display_name": "패션러버",
      "avatar_url": "https://...",
      "rank": "expert"
    },
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z",
    "replies": [
      {
        "id": "comment-uuid-2",
        "post_id": "post-uuid",
        "user_id": "user-uuid-2",
        "content": "ZARA에서 본 것 같아요!",
        "parent_id": "comment-uuid-1",
        "user": {
          "id": "user-uuid-2",
          "username": "helper",
          "rank": "beginner"
        },
        "created_at": "2025-01-15T12:05:00Z",
        "updated_at": "2025-01-15T12:05:00Z",
        "replies": []
      }
    ]
  }
]
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Post를 찾을 수 없음 |

---

## 댓글 작성

Post에 새 댓글을 작성합니다. 대댓글도 같은 API를 사용합니다.

### Request

```http
POST /api/v1/posts/{post_id}/comments
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
  "content": "이 코트 어디 건가요?",
  "parent_id": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `content` | string | O | 댓글 내용 |
| `parent_id` | uuid | - | 부모 댓글 ID (대댓글인 경우) |

### Response

```json
{
  "id": "comment-uuid",
  "post_id": "post-uuid",
  "user_id": "user-uuid",
  "content": "이 코트 어디 건가요?",
  "parent_id": null,
  "user": {
    "id": "user-uuid",
    "username": "fashionista",
    "rank": "expert"
  },
  "created_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-01-15T12:00:00Z",
  "replies": []
}
```

### 대댓글 작성 예시

```json
{
  "content": "ZARA에서 본 것 같아요!",
  "parent_id": "parent-comment-uuid"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |
| `401` | 인증 필요 |
| `404` | Post를 찾을 수 없음 |

---

## 댓글 수정

본인이 작성한 댓글을 수정합니다.

### Request

```http
PATCH /api/v1/comments/{comment_id}
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `comment_id` | uuid | Comment ID |

### Request Body

```json
{
  "content": "수정된 댓글 내용"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `content` | string | O | 수정할 댓글 내용 |

### Response

수정된 CommentResponse 반환

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 잘못된 요청 |
| `401` | 인증 필요 |
| `403` | 본인의 댓글만 수정 가능 |
| `404` | 댓글을 찾을 수 없음 |

---

## 댓글 삭제

본인이 작성한 댓글을 삭제합니다.

### Request

```http
DELETE /api/v1/comments/{comment_id}
Authorization: Bearer <token>
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `comment_id` | uuid | Comment ID |

### Response

```http
204 No Content
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `403` | 본인의 댓글만 삭제 가능 |
| `404` | 댓글을 찾을 수 없음 |

---

## 예시 코드 (TypeScript)

```typescript
// 댓글 목록 조회
const commentsResponse = await fetch(`/api/v1/posts/${postId}/comments`);
const comments = await commentsResponse.json();

// 댓글 작성
const createResponse = await fetch(`/api/v1/posts/${postId}/comments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: '이 코트 어디 건가요?'
  })
});

// 대댓글 작성
const replyResponse = await fetch(`/api/v1/posts/${postId}/comments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'ZARA에서 본 것 같아요!',
    parent_id: parentCommentId
  })
});
```

---

## 관련 API

- [Posts API](./posts.md) - Post 관리
- [Users API](./users.md) - 사용자 정보

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
