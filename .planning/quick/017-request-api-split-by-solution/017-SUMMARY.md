# Quick Task 017: Request API Split by Solution - Summary

## Completed: 2026-02-05

## Changes Made

### 1. API Types (`packages/web/lib/api/types.ts`)
Added new types for posts with solution:
- `SpotSolution` - Solution 정보 (title, original_url, price, etc.)
- `SpotWithSolutionRequest` - Spot + Solution 요청 형식
- `CreatePostWithSolutionRequest` - Solution을 포함한 post 생성 요청

### 2. API Route (`packages/web/app/api/v1/posts/with-solution/route.ts`)
새로운 엔드포인트 프록시:
- `POST /api/v1/posts/with-solution` - 백엔드 API로 프록시
- 인증 필수 (Authorization 헤더 검증)

### 3. API Client (`packages/web/lib/api/posts.ts`)
- `createPostWithSolution()` 함수 추가
- 기존 `createPost()`와 동일한 패턴

### 4. Request Store (`packages/web/lib/stores/requestStore.ts`)
- `SpotSolutionData` 인터페이스 추가
- `DetectedSpot`에 `solution?` 필드 추가
- Actions 추가:
  - `setSpotSolution(spotId, solution)`
  - `clearSpotSolution(spotId)`
- Selectors 추가:
  - `selectHasSolutions` - solution 존재 여부
  - `selectSpotsWithSolutions` - solution이 있는 spots만 필터

### 5. useCreatePost Hook (`packages/web/lib/hooks/useCreatePost.ts`)
Solution 유무에 따른 API 분기 처리:
- Solution이 있는 spot이 하나라도 있으면 → `/api/v1/posts/with-solution`
- Solution이 없으면 → `/api/v1/posts` (기존)

### 6. Exports (`packages/web/lib/api/index.ts`)
- `createPostWithSolution` 함수 export 추가

## Files Changed
- `packages/web/lib/api/types.ts` (modified)
- `packages/web/app/api/v1/posts/with-solution/route.ts` (new)
- `packages/web/lib/api/posts.ts` (modified)
- `packages/web/lib/stores/requestStore.ts` (modified)
- `packages/web/lib/hooks/useCreatePost.ts` (modified)
- `packages/web/lib/api/index.ts` (modified)

## Verification
- [x] TypeScript type check passed
- [x] ESLint passed (no new errors)
- [x] 기존 기능 유지 (solution 없는 경우)
- [x] 새 기능 추가 (solution 있는 경우)

## Usage Example

```typescript
// Store에서 solution 설정
import { useRequestStore } from "@/lib/stores/requestStore";

const setSpotSolution = useRequestStore((s) => s.setSpotSolution);

// Spot에 solution 정보 추가
setSpotSolution("spot_1", {
  title: "Nike Air Force 1",
  originalUrl: "https://nike.com/...",
  priceAmount: 129000,
  priceCurrency: "KRW",
});

// 제출 시 자동으로 적절한 API 선택됨
const { submit } = useCreatePost();
submit(); // hasSolutions → /api/v1/posts/with-solution
```

## Out of Scope
- UI에서 solution 입력 폼 (별도 task 필요)
- 백엔드 API 구현 (프론트엔드 프록시만 구현됨)
