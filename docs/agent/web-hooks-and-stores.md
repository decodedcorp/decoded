---
title: Web Hooks & Stores — Agent Reference
owner: human
status: approved
updated: 2026-04-17
tags: [agent, ui]
---

# Key file locations & custom hooks

Paths below are under `packages/web/` unless absolute from repo root.

## Key file locations

| Area               | Location                            | Description                                                                                                       |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Auth**           | `lib/stores/authStore.ts`           | OAuth (Kakao, Google, Apple) + session                                                                            |
| **Search State**   | `lib/stores/searchStore.ts`         | Search query, debouncedQuery, filters (category/mediaType/context/sort), page; re-exported from `@decoded/shared` |
| **Filter**         | `lib/stores/filterStore.ts`         | Category filter key (all/fashion/beauty/…); re-exported from `@decoded/shared`                                    |
| **Behavior**       | `lib/stores/behaviorStore.ts`       | Behavioral tracking state                                                                                         |
| **VTON**           | `lib/stores/vtonStore.ts`           | Virtual try-on state                                                                                              |
| **Collection**     | `lib/stores/collectionStore.ts`     | Collection/studio state                                                                                           |
| **Magazine**       | `lib/stores/magazineStore.ts`       | Magazine/editorial state                                                                                          |
| **Active Spot**    | `lib/stores/activeSpotStore.ts`     | Currently selected spot on image canvas                                                                           |
| **Studio**         | `lib/stores/studioStore.ts`         | Studio/collage creation state                                                                                     |
| **Request**        | `lib/stores/requestStore.ts`        | Post request/upload flow state                                                                                    |
| **Transition**     | `lib/stores/transitionStore.ts`     | Page transition animation state                                                                                   |
| **API Client**     | `lib/api/`                          | Backend API calls                                                                                                 |
| **API Generated**  | `lib/api/generated/`                | Orval 자동 생성 — 절대 수동 편집 금지 (아래 섹션 참조)                                                            |
| **API Routes**     | `app/api/v1/`                       | Next.js API proxy & server logic                                                                                  |
| **Supabase**       | `lib/supabase/queries/`             | DB queries (events, images, posts, profile, personalization)                                                      |
| **Shared Queries** | `packages/shared/supabase/queries/` | Cross-package queries (images, items)                                                                             |
| **Design System**  | `lib/design-system/`                | v2.0 components & tokens                                                                                          |
| **Components**     | `lib/components/`                   | Feature components                                                                                                |
| **Hooks**          | `lib/hooks/`                        | Custom hooks                                                                                                      |
| **Admin Hooks**    | `lib/hooks/admin/`                  | Admin dashboard hooks                                                                                             |
| **Stores**         | `lib/stores/`                       | Zustand stores                                                                                                    |
| **Rust API**       | `packages/api-server/`              | Axum REST API, gRPC client to ai-server                                                                           |
| **AI / gRPC**      | `packages/ai-server/`               | Inference, metadata, gRPC (Python)                                                                                |
| **Frontend CI**    | `packages/web/scripts/pre-push.sh`  | ESLint, Prettier, TypeScript checks                                                                               |
| **Git workflow**   | `docs/GIT-WORKFLOW.md`              | Branch, commit, PR conventions                                                                                    |
| **Code reviewer**  | `.claude/agents/code-reviewer.md`   | Repository code-review agent notes                                                                                |

## Generated API (Orval + Zod)

> `lib/api/generated/`는 **자동 생성 코드** — 절대 수동 편집하지 않는다. Gitignored (`.gitkeep`만 트래킹).

### Source of truth

`packages/api-server/openapi.json` (Rust backend utoipa에서 생성)

### 재생성

```bash
cd packages/web && bun run generate:api
```

### 구조

```
lib/api/
├── generated/           # Orval 자동 생성 (수동 편집 금지)
│   ├── models/          # TypeScript 인터페이스 (response/request types)
│   ├── admin/           # Admin endpoint hooks (useListAdminPosts 등)
│   ├── posts/           # Posts endpoint hooks (useListPosts 등)
│   ├── search/          # Search endpoint hooks
│   ├── solutions/       # Solutions endpoint hooks
│   ├── spots/           # Spots endpoint hooks
│   ├── users/           # Users endpoint hooks
│   ├── zod/             # Zod 스키마 (decodedApi.zod.ts — 전체 ��드포인트 검증)
│   └── ...              # 태그별 분리 (badges, categories, rankings 등)
├── mutator/
│   └── custom-instance.ts  # Axios 인스턴스 커스텀 (baseURL, 인터셉터)
├── server-instance.ts       # 서버 컴포넌트용 API 클라이언트
└── adapters/                # API 응답 → UI 모델 변환
```

### Orval 설정 (`orval.config.ts`)

| 설정                | 값                                                                |
| ------------------- | ----------------------------------------------------------------- |
| **Input**           | `../api-server/openapi.json`                                      |
| **Output mode**     | `tags-split` (태그별 파일 분리)                                   |
| **Client**          | `react-query` (TanStack Query 5)                                  |
| **HTTP client**     | `axios` (custom-instance.ts mutator)                              |
| **Zod output**      | `lib/api/generated/zod/` (별도 client: zod)                       |
| **제외 엔드포인트** | multipart POST 4개 (create_post, with-solutions, upload, analyze) |

### 사용 패턴

```ts
// Hook import (태그/operationId 기반)
import { useListPosts } from "@/lib/api/generated/posts/posts";

// Zod 스키마 import
import { listPostsQueryParams } from "@/lib/api/generated/zod/decodedApi.zod";

// Type import
import type { PaginatedResponsePostListItem } from "@/lib/api/generated/models";
```

### 새 엔드포인트 추가 시

1. Backend에서 OpenAPI spec 업데이트
2. `packages/api-server/openapi.json` 복사
3. `cd packages/web && bun run generate:api`
4. `@/lib/api/generated/{tag}/{operationId}`에서 생성된 hook import

### 동작 확장

- **Axios 인터셉터**: `lib/api/mutator/custom-instance.ts` 편집
- **Orval 설정**: `orval.config.ts` 편집
- **생성 코드 자체**: 절대 편집하지 않음

---

## Custom hooks

### Data fetching

- `useImages()` / `useInfinitePosts()` - Fetch and paginate images/posts with filters
- `usePosts()` - Fetch and manage posts
- `useProfile()` - Fetch user profile data
- `useCategories()` - Fetch category list
- `useItems()` - Fetch items for posts
- `useNormalizedItems()` - Normalize item data structure
- `useSolutions()` - Fetch solutions for items
- `useSpots()` - Fetch spot data for images
- `useComments(postId)` - Fetch comments for a post
- `useCreateComment(postId)` - Create a comment
- `useDeleteComment(postId)` - Delete a comment
- `useCommentCount(postId)` - Comment count for a post
- `useTries()` - Fetch try-on results
- `useCreateTryPost()` - Try 포스트 생성 (`lib/hooks/useTries.ts`)
- `useTrendingArtists()` - Fetch trending artist list
- `useExploreData()` - Unified explore hook: switches between browse mode (Supabase) and search mode (Meilisearch via `/api/v1/search`); exposes `mode`, artist/context facets, multi-select artist filter, sort, and pagination

### Social actions

- `usePostLike()` - Like/unlike posts
- `useSavedPost()` - Save/unsave posts
- `useReport()` - Submit content reports
- `useAffiliateClick()` - Track affiliate link clicks
- `useAdoptDropdown()` - Adopt a solution from dropdown
- `useVoting()` (`useVoteStats`, `useCreateVote`, `useDeleteVote`) — 솔루션 투표 조회·생성·삭제 (`lib/hooks/useVoting.ts`)

### Behavioral tracking

- `useTrackEvent()` - Track custom behavior events
- `useTrackDwellTime()` - Track time spent on content
- `useTrackScrollDepth()` - Track scroll depth on pages

### Form & input

- `useCreatePost()` - Multi-step post creation flow
- `useImageUpload()` - Image uploads with compression
- `useSearch()` - Search with debouncing
- `useSearchURLSync()` - URL-based search state sync
- `usePretext()` - Pretext/context text generation

### UI & animation

- `useResponsiveGridSize()` - Calculate grid columns
- `useScrollAnimation()` - Scroll-triggered animations
- `useFlipTransition()` - Flip card animations
- `useMediaQuery()` - Responsive breakpoint detection
- `useSpotCardSync()` - Sync spot selection with card UI
- `useDebounce()` - Debounce value changes
- `useItemCardGSAP()` - GSAP animation for item cards
- `useImageDimensions()` - Get image natural dimensions
- `useImageModalAnimation()` - Lightbox/modal open-close animation

### VTON

- `useVtonTryOn()` - Submit and poll VTON job
- `useVtonItemFetch()` - Fetch items compatible with VTON
- `useVtonScrollLock()` - Lock scroll while VTON modal is open

### Admin

- `useAiCost()` - AI cost tracking data
- `useAudit()` - Audit log data
- `useDashboard()` - Dashboard statistics
- `usePipeline()` - Pipeline monitoring
- `useServerLogs()` - Server log streaming
- `useAdminPosts()` / `useAdminPostEdit()` - Admin post list and metadata editing
- `useAdminReports()` - Admin content report list
- `useEditorialCandidates()` / `useGenerateEditorial()` - Posts eligible for editorial promotion + trigger generation
- `useAdminPickList()` / `useCreatePick()` / `useUpdatePick()` / `useDeletePick()` - Decoded Pick CRUD (from `lib/hooks/admin/useAdminPicks.ts`)
- `useMonitoringMetrics()` - Backend monitoring metrics (latency, throughput, endpoints)
