# Quick Task 017: Request API Split by Solution

## Goal

Request 플로우에서 두 가지 유저 유형을 분리:
- **Solution을 모르는 유저**: `POST /api/v1/posts` (기존)
- **Solution을 아는 유저**: `POST /api/v1/posts/with-solution` (신규)

## Current State

- 현재 `useCreatePost` 훅은 모든 요청을 `/api/v1/posts`로 전송
- `DetectedSpot`에는 solution 정보 필드가 없음
- API types에 solution을 포함한 request type이 없음

## Tasks

### Task 1: API Types 추가

**파일**: `packages/web/lib/api/types.ts`

Solution을 포함한 새로운 request type 추가:

```typescript
// Solution 정보 (spot과 함께 제출)
export interface SpotSolution {
  title: string;
  original_url: string;
  thumbnail_url?: string;
  price_amount?: number;
  price_currency?: string; // default: 'KRW'
  description?: string;
}

// Spot with solution
export interface SpotWithSolutionRequest {
  position_left: string;
  position_top: string;
  category_id: string;
  solution: SpotSolution;
}

// Create post with solutions request
export interface CreatePostWithSolutionRequest {
  image_url: string;
  media_source: MediaSource;
  spots: SpotWithSolutionRequest[];
  artist_name?: string;
  group_name?: string;
  context?: ContextType;
  description?: string;
  media_metadata?: MediaMetadataItem[];
}
```

### Task 2: API Route 추가

**파일**: `packages/web/app/api/v1/posts/with-solution/route.ts` (신규)

새로운 엔드포인트 프록시 추가:

```typescript
// POST /api/v1/posts/with-solution
// Solution을 아는 유저용 - 백엔드 API로 프록시
```

### Task 3: API Client 함수 추가

**파일**: `packages/web/lib/api/posts.ts`

```typescript
export async function createPostWithSolution(
  request: CreatePostWithSolutionRequest
): Promise<CreatePostResponse> {
  return apiClient<CreatePostResponse>({
    path: "/api/v1/posts/with-solution",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}
```

### Task 4: Store에 Solution 필드 추가

**파일**: `packages/web/lib/stores/requestStore.ts`

`DetectedSpot`에 solution 정보 필드 추가:

```typescript
export interface SpotSolutionData {
  title: string;
  originalUrl: string;
  thumbnailUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  description?: string;
}

export interface DetectedSpot {
  // ... existing fields
  solution?: SpotSolutionData; // 사용자가 입력한 solution 정보
}
```

Store actions 추가:
- `setSpotSolution(spotId: string, solution: SpotSolutionData): void`
- `clearSpotSolution(spotId: string): void`
- `selectHasSolutions(state): boolean` - solution이 있는지 확인

### Task 5: useCreatePost 훅 분기 처리

**파일**: `packages/web/lib/hooks/useCreatePost.ts`

Solution 유무에 따라 API 분기:

```typescript
// spot에 solution이 하나라도 있으면 with-solution 엔드포인트 사용
const hasSolutions = detectedSpots.some(spot => spot.solution);

if (hasSolutions) {
  // createPostWithSolution 호출
} else {
  // createPost 호출 (기존)
}
```

### Task 6: exports 추가

**파일**: `packages/web/lib/api/index.ts`

새로운 함수/타입 export 추가

## Success Criteria

- [ ] Solution을 모르는 유저는 기존대로 `/api/v1/posts` 사용
- [ ] Solution을 아는 유저는 `/api/v1/posts/with-solution` 사용
- [ ] Store에 solution 데이터 저장 가능
- [ ] 타입 안전성 유지
- [ ] 빌드 성공

## Out of Scope

- UI에서 solution 입력 폼 (별도 task)
- 백엔드 API 구현 (프론트엔드 프록시만)
