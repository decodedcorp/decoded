# Votes API

> 투표 및 채택 관련 API 엔드포인트

---

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| `GET` | `/api/v1/solutions/{solution_id}/votes` | 투표 현황 조회 | - |
| `POST` | `/api/v1/solutions/{solution_id}/votes` | 투표하기 | O |
| `DELETE` | `/api/v1/solutions/{solution_id}/votes` | 투표 취소 | O |

---

## 투표 시스템 개요

Solution의 정확성을 커뮤니티가 검증하는 투표 시스템입니다.

### 투표 타입

| 타입 | 설명 | 포인트 |
|------|------|--------|
| `accurate` | 정확함 - 이 상품이 맞다고 판단 | Solution 작성자 +1점 |
| `different` | 다름 - 이 상품이 아니라고 판단 | - |

### 검증(Verified) 조건

- `accurate` 투표가 일정 수 이상 누적되면 자동으로 `is_verified: true`
- 검증된 Solution은 목록에서 상단에 표시됨

---

## 투표 현황 조회

특정 Solution의 투표 현황을 조회합니다.

### Request

```http
GET /api/v1/solutions/{solution_id}/votes
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `solution_id` | uuid | Solution ID |

### Response

```json
{
  "solution_id": "solution-uuid",
  "accurate_count": 15,
  "different_count": 2,
  "total_count": 17,
  "my_vote": "accurate"
}
```

| 필드 | 설명 |
|------|------|
| `accurate_count` | "정확함" 투표 수 |
| `different_count` | "다름" 투표 수 |
| `total_count` | 총 투표 수 |
| `my_vote` | 내 투표 (인증된 경우만, 없으면 null) |

### 에러 코드

| 코드 | 설명 |
|------|------|
| `404` | Solution을 찾을 수 없음 |

---

## 투표하기

Solution에 투표합니다.

### Request

```http
POST /api/v1/solutions/{solution_id}/votes
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `solution_id` | uuid | Solution ID |

### Request Body

```json
{
  "vote_type": "accurate"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `vote_type` | string | O | 투표 타입: `accurate` 또는 `different` |

### Response

```json
{
  "solution_id": "solution-uuid",
  "vote_type": "accurate",
  "voted_at": "2025-01-15T12:00:00Z"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `400` | 이미 투표함 |
| `401` | 인증 필요 |
| `404` | Solution을 찾을 수 없음 |

---

## 투표 취소

기존 투표를 취소합니다.

### Request

```http
DELETE /api/v1/solutions/{solution_id}/votes
Authorization: Bearer <token>
```

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `solution_id` | uuid | Solution ID |

### Response

```http
204 No Content
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `401` | 인증 필요 |
| `404` | 투표를 찾을 수 없음 |

---

## 투표 흐름

```
1. Solution 목록에서 상품 확인
   GET /api/v1/spots/{spot_id}/solutions

2. 투표 현황 확인
   GET /api/v1/solutions/{solution_id}/votes

3. 투표하기
   POST /api/v1/solutions/{solution_id}/votes
   { "vote_type": "accurate" }

4. 투표 변경하기 (취소 후 재투표)
   DELETE /api/v1/solutions/{solution_id}/votes
   POST /api/v1/solutions/{solution_id}/votes
   { "vote_type": "different" }
```

---

## 예시 코드 (TypeScript)

```typescript
// 투표 현황 확인
const statsResponse = await fetch(`/api/v1/solutions/${solutionId}/votes`);
const stats = await statsResponse.json();

// 투표하기
const voteResponse = await fetch(`/api/v1/solutions/${solutionId}/votes`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vote_type: 'accurate'
  })
});

// 투표 취소
await fetch(`/api/v1/solutions/${solutionId}/votes`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 관련 API

- [Solutions API](./solutions.md) - Solution 관리
- [Rankings API](./rankings.md) - 투표로 획득한 포인트 랭킹

---

## 변경 이력

- **2025-01-15**: 초기 문서 생성
