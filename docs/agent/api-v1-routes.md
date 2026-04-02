# Next.js API routes (`/api/v1/*`)

`packages/web/app/api/v1/` 기준. 메서드·경로 추가 시 이 파일과 실제 라우트 핸들러를 함께 갱신합니다.

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
| `/api/v1/admin/server-logs`           | GET     | Server logs              |
| `/api/v1/admin/server-logs/stream`    | GET     | Server logs (SSE stream) |

Rust REST API와의 관계는 [`.planning/codebase/INTEGRATIONS.md`](../../.planning/codebase/INTEGRATIONS.md) 및 `packages/api-server` 문서를 참고합니다.
