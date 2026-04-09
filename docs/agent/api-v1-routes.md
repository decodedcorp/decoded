# Next.js API routes (`/api/v1/*`)

`packages/web/app/api/v1/` 기준. 메서드·경로 추가 시 이 파일과 실제 라우트 핸들러를 함께 갱신합니다.

## Search

| Route              | Methods | Description                                                              |
| ------------------ | ------- | ------------------------------------------------------------------------ |
| `/api/v1/search/[[...path]]` | GET | Unified search — catch-all proxy to Rust backend (Meilisearch); Supabase ilike fallback |

Params: `q`, `context`, `media_type`, `sort`, `page`, `limit`.

## Posts & content

| Route                            | Methods  | Description                   |
| -------------------------------- | -------- | ----------------------------- |
| `/api/v1/posts`                  | GET      | List posts with pagination    |
| `/api/v1/posts/with-solution`    | GET      | Posts with solution data      |
| `/api/v1/posts/with-solutions`   | GET      | Posts with multiple solutions |
| `/api/v1/posts/extract-metadata` | POST     | Extract metadata from URL     |
| `/api/v1/posts/analyze`          | POST     | AI image analysis             |
| `/api/v1/posts/upload`           | POST     | Upload post image             |
| `/api/v1/posts/[postId]`         | GET      | Single post detail            |
| `/api/v1/posts/[postId]/spots`   | GET/POST | Spots for a post              |
| `/api/v1/posts/[postId]/likes`   | POST     | Like/unlike a post            |
| `/api/v1/posts/[postId]/saved`   | POST     | Save/unsave a post            |
| `/api/v1/posts/try`              | POST     | Create a try post             |
| `/api/v1/posts/[postId]/tries`   | GET      | List tries for a post         |
| `/api/v1/posts/[postId]/tries/count` | GET  | Try count for a post          |
| `/api/v1/post-magazines/[id]`    | GET      | Post magazine data            |
| `/api/v1/post-magazines/generate` | POST   | Trigger editorial generation for a post (admin only, proxy → Rust)      |

## Solutions & spots

| Route                                  | Methods   | Description                  |
| -------------------------------------- | --------- | ---------------------------- |
| `/api/v1/solutions/convert-affiliate`  | POST      | Convert affiliate links      |
| `/api/v1/solutions/[solutionId]`       | GET/PATCH | Solution CRUD                |
| `/api/v1/solutions/[solutionId]/adopt` | POST      | Adopt a solution             |
| `/api/v1/solutions/extract-metadata`   | POST      | Solution metadata extraction |
| `/api/v1/spots/[spotId]`               | GET/PATCH | Spot CRUD                    |
| `/api/v1/spots/[spotId]/tries`         | GET       | Tries tagged with spot       |
| `/api/v1/spots/[spotId]/solutions`     | GET/POST  | Solutions for spot           |

## Users & profile

| Route                           | Methods | Description          |
| ------------------------------- | ------- | -------------------- |
| `/api/v1/users/me`              | GET     | Current user profile |
| `/api/v1/users/me/activities`   | GET     | User activities      |
| `/api/v1/users/me/stats`        | GET     | User statistics      |
| `/api/v1/users/[userId]`        | GET     | User by ID           |
| `/api/v1/badges`                | GET     | All badges           |
| `/api/v1/badges/me`             | GET     | User's earned badges |
| `/api/v1/rankings`              | GET     | Global rankings      |
| `/api/v1/rankings/me`           | GET     | User's ranking       |

## Behavioral intelligence

| Route                | Methods | Description                                                |
| -------------------- | ------- | ---------------------------------------------------------- |
| `/api/v1/events`     | POST    | Track behavior events (dwell time, scroll depth, clicks)   |
| `/api/v1/categories` | GET     | Category list                                              |

## Virtual try-on (VTON)

| Route                | Methods | Description           |
| -------------------- | ------- | --------------------- |
| `/api/v1/vton`       | POST    | Submit VTON job       |
| `/api/v1/vton/items` | GET     | VTON-compatible items   |

## Admin dashboard

| Route                                 | Methods | Description              |
| ------------------------------------- | ------- | ------------------------ |
| `/api/v1/admin/dashboard/stats`       | GET     | Dashboard statistics     |
| `/api/v1/admin/dashboard/chart`       | GET     | Dashboard charts         |
| `/api/v1/admin/dashboard/today`       | GET     | Today's activity         |
| `/api/v1/admin/ai-cost/kpi`           | GET     | AI cost KPIs             |
| `/api/v1/admin/ai-cost/chart`         | GET     | AI cost charts           |
| `/api/v1/admin/audit`                 | GET     | Audit logs               |
| `/api/v1/admin/audit/[requestId]`     | GET     | Single audit entry       |
| `/api/v1/admin/pipeline`              | GET     | Pipeline status          |
| `/api/v1/admin/pipeline/[pipelineId]` | GET     | Single pipeline          |
| `/api/v1/reports`                     | POST    | Submit content report (proxy → Rust) |
| `/api/v1/admin/posts`                 | GET     | Admin post list (proxy → Rust) |
| `/api/v1/admin/posts/[postId]`        | PATCH   | Admin post metadata edit (proxy → Rust) |
| `/api/v1/admin/posts/[postId]/status` | PATCH   | Update post status (proxy → Rust) |
| `/api/v1/admin/reports`               | GET     | Admin report list (proxy → Rust) |
| `/api/v1/admin/reports/[reportId]`    | PATCH   | Update report status (proxy → Rust) |
| `/api/v1/admin/server-logs`           | GET     | Server logs              |
| `/api/v1/admin/server-logs/stream`    | GET     | Server logs (SSE stream) |
| `/api/v1/admin/editorial-candidates`  | GET     | Posts eligible for editorial (spot ≥ 4, solution ≥ 1/spot; proxy → Rust) |
| `/api/v1/admin/picks`                 | GET/POST | List / create decoded picks (Supabase `decoded_picks` table) |
| `/api/v1/admin/picks/[pickId]`        | PATCH/DELETE | Update / delete a decoded pick |

## Utility

| Route                    | Methods | Description                                      |
| ------------------------ | ------- | ------------------------------------------------ |
| `/api/v1/image-proxy`    | GET     | Proxy external image URLs (avoids CORS/hotlink)  |

## Admin API (`/api/admin/`)

> `/api/v1/` 프리픽스가 아닌 `/api/admin/` 경로. Seed 파이프라인, 엔티티 관리, 감사 로그 등 어드민 전용.

| Route | Methods | Description |
| ----- | ------- | ----------- |
| `/api/admin/entities/brands` | GET/POST | 브랜드 목록/생성 |
| `/api/admin/entities/brands/[id]` | GET/PATCH/DELETE | 개별 브랜드 |
| `/api/admin/entities/artists` | GET/POST | 아티스트 목록/생성 |
| `/api/admin/entities/artists/[id]` | GET/PATCH/DELETE | 개별 아티스트 |
| `/api/admin/entities/group-members` | GET | 그룹 멤버 목록 |
| `/api/admin/candidates` | GET/POST | 시드 후보 목록/생성 |
| `/api/admin/candidates/[id]` | GET/PATCH | 개별 후보 |
| `/api/admin/candidates/[id]/approve` | POST | 후보 승인 |
| `/api/admin/candidates/[id]/reject` | POST | 후보 거절 |
| `/api/admin/bulk` | POST | 벌크 작업 (approve/reject/delete) |
| `/api/admin/audit-log` | GET | 감사 로그 목록 |
| `/api/admin/audit-log/[id]/rollback` | POST | 감사 로그 롤백 |
| `/api/admin/post-images` | POST | 포스트 이미지 업로드 |
| `/api/admin/post-spots` | POST | 포스트 스팟 관리 |
| `/api/admin/review` | GET/POST | 콘텐츠 리뷰 |

Rust REST API와의 관계는 [`.planning/codebase/INTEGRATIONS.md`](../../.planning/codebase/INTEGRATIONS.md) 및 `packages/api-server` 문서를 참고합니다.
