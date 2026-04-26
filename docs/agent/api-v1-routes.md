---
title: API v1 Routes — Agent Reference
owner: human
status: approved
updated: 2026-04-17
tags: [agent, api]
---

# API v1 Routes — Agent Reference

`packages/web/app/api/v1/` 기준. 메서드·경로 추가 시 이 파일과 실제 라우트 핸들러를 함께 갱신합니다.

## Search

| Route                        | Methods | Description                                                                             |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `/api/v1/search/[[...path]]` | GET     | Unified search — catch-all proxy to Rust backend (Meilisearch); Supabase ilike fallback |

Params: `q`, `context`, `media_type`, `sort`, `page`, `limit`.

## Posts & content

| Route                                | Methods  | Description                                                        |
| ------------------------------------ | -------- | ------------------------------------------------------------------ |
| `/api/v1/posts`                      | GET      | List posts with pagination                                         |
| `/api/v1/posts/with-solution`        | GET      | Posts with solution data                                           |
| `/api/v1/posts/with-solutions`       | GET      | Posts with multiple solutions                                      |
| `/api/v1/posts/extract-metadata`     | POST     | Extract metadata from URL                                          |
| `/api/v1/posts/analyze`              | POST     | AI image analysis                                                  |
| `/api/v1/posts/upload`               | POST     | Upload post image                                                  |
| `/api/v1/posts/[postId]`             | GET      | Single post detail                                                 |
| `/api/v1/posts/[postId]/spots`       | GET/POST | Spots for a post                                                   |
| `/api/v1/posts/[postId]/likes`       | POST     | Like/unlike a post                                                 |
| `/api/v1/posts/[postId]/saved`       | POST     | Save/unsave a post                                                 |
| `/api/v1/posts/try`                  | POST     | Try 포스트 생성 (인증 필요)                                        |
| `/api/v1/posts/[postId]/tries`       | GET      | Try 포스트 목록                                                    |
| `/api/v1/posts/[postId]/tries/count` | GET      | Try 개수                                                           |
| `/api/v1/post-magazines/[id]`        | GET      | Post magazine data                                                 |
| `/api/v1/post-magazines/generate`    | POST     | Trigger editorial generation for a post (admin only, proxy → Rust) |

## Solutions & spots

| Route                                  | Methods   | Description                  |
| -------------------------------------- | --------- | ---------------------------- |
| `/api/v1/solutions/convert-affiliate`  | POST      | Convert affiliate links      |
| `/api/v1/solutions/[solutionId]`       | GET/PATCH | Solution CRUD                |
| `/api/v1/solutions/[solutionId]/adopt` | POST      | Adopt a solution             |
| `/api/v1/solutions/extract-metadata`   | POST      | Solution metadata extraction |
| `/api/v1/solutions/[solutionId]/votes` | GET       | 솔루션 투표 조회             |
| `/api/v1/solutions/[solutionId]/votes` | POST      | 투표 생성 (인증 필요)        |
| `/api/v1/solutions/[solutionId]/votes` | DELETE    | 투표 삭제 (인증 필요)        |
| `/api/v1/spots/[spotId]`               | GET/PATCH | Spot CRUD                    |
| `/api/v1/spots/[spotId]/tries`         | GET       | Tries tagged with spot       |
| `/api/v1/spots/[spotId]/solutions`     | GET/POST  | Solutions for spot           |

## Comments

| Route                             | Methods  | Description                    |
| --------------------------------- | -------- | ------------------------------ |
| `/api/v1/posts/[postId]/comments` | GET/POST | List / create comments on post |
| `/api/v1/comments/[commentId]`    | DELETE   | Delete a comment (인증 필요)   |

## Users & profile

| Route                                  | Methods | Description          |
| -------------------------------------- | ------- | -------------------- |
| `/api/v1/users/me`                     | GET     | Current user profile |
| `/api/v1/users/me/activities`          | GET     | User activities      |
| `/api/v1/users/me/stats`               | GET     | User statistics      |
| `/api/v1/users/me/liked`               | GET     | User's liked posts   |
| `/api/v1/users/me/saved`               | GET     | User's saved posts   |
| `/api/v1/users/[userId]`               | GET     | User by ID           |
| `/api/v1/users/[userId]/follow`        | POST    | Follow/unfollow user |
| `/api/v1/users/[userId]/follow-status` | GET     | Check follow status  |
| `/api/v1/badges`                       | GET     | All badges           |
| `/api/v1/badges/me`                    | GET     | User's earned badges |
| `/api/v1/rankings`                     | GET     | Global rankings      |
| `/api/v1/rankings/me`                  | GET     | User's ranking       |

## Behavioral intelligence

| Route                | Methods | Description                                              |
| -------------------- | ------- | -------------------------------------------------------- |
| `/api/v1/events`     | POST    | Track behavior events (dwell time, scroll depth, clicks) |
| `/api/v1/categories` | GET     | Category list                                            |

## Virtual try-on (VTON)

| Route                | Methods | Description           |
| -------------------- | ------- | --------------------- |
| `/api/v1/vton`       | POST    | Submit VTON job       |
| `/api/v1/vton/items` | GET     | VTON-compatible items |

## Admin dashboard

| Route                                 | Methods      | Description                                                              |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `/api/v1/admin/dashboard/stats`       | GET          | Dashboard statistics                                                     |
| `/api/v1/admin/dashboard/chart`       | GET          | Dashboard charts                                                         |
| `/api/v1/admin/dashboard/today`       | GET          | Today's activity                                                         |
| `/api/v1/admin/ai-cost/kpi`           | GET          | AI cost KPIs                                                             |
| `/api/v1/admin/ai-cost/chart`         | GET          | AI cost charts                                                           |
| `/api/v1/admin/audit`                 | GET          | Audit logs                                                               |
| `/api/v1/admin/audit/[requestId]`     | GET          | Single audit entry                                                       |
| `/api/v1/admin/pipeline`              | GET          | Pipeline status                                                          |
| `/api/v1/admin/pipeline/[pipelineId]` | GET          | Single pipeline                                                          |
| `/api/v1/reports`                     | POST         | Submit content report (proxy → Rust)                                     |
| `/api/v1/admin/posts`                 | GET          | Admin post list (proxy → Rust)                                           |
| `/api/v1/admin/posts/[postId]`        | PATCH        | Admin post metadata edit (proxy → Rust)                                  |
| `/api/v1/admin/posts/[postId]/status` | PATCH        | Update post status (proxy → Rust)                                        |
| `/api/v1/admin/reports`               | GET          | Admin report list (proxy → Rust)                                         |
| `/api/v1/admin/reports/[reportId]`    | PATCH        | Update report status (proxy → Rust)                                      |
| `/api/v1/admin/server-logs`           | GET          | Server logs                                                              |
| `/api/v1/admin/server-logs/stream`    | GET          | Server logs (SSE stream)                                                 |
| `/api/v1/admin/editorial-candidates`  | GET          | Posts eligible for editorial (spot ≥ 4, solution ≥ 1/spot; proxy → Rust) |
| `/api/v1/admin/picks`                 | GET/POST     | List / create decoded picks (Supabase `decoded_picks` table)             |
| `/api/v1/admin/picks/[pickId]`        | PATCH/DELETE | Update / delete a decoded pick                                           |
| `/api/v1/admin/monitoring/metrics`    | GET          | Backend monitoring metrics (Prometheus-sourced)                          |

## Utility

| Route                 | Methods | Description                                     |
| --------------------- | ------- | ----------------------------------------------- |
| `/api/v1/image-proxy` | GET     | Proxy external image URLs (avoids CORS/hotlink) |

## Admin API (`/api/admin/`)

> `/api/v1/` 프리픽스가 아닌 `/api/admin/` 경로. Seed 파이프라인, 엔티티 관리, 감사 로그 등 어드민 전용.

| Route                                | Methods          | Description                       |
| ------------------------------------ | ---------------- | --------------------------------- |
| `/api/admin/entities/brands`         | GET/POST         | 브랜드 목록/생성                  |
| `/api/admin/entities/brands/[id]`    | GET/PATCH/DELETE | 개별 브랜드                       |
| `/api/admin/entities/artists`        | GET/POST         | 아티스트 목록/생성                |
| `/api/admin/entities/artists/[id]`   | GET/PATCH/DELETE | 개별 아티스트                     |
| `/api/admin/entities/group-members`  | GET              | 그룹 멤버 목록                    |
| `/api/admin/candidates`              | GET/POST         | 시드 후보 목록/생성               |
| `/api/admin/candidates/[id]`         | GET/PATCH        | 개별 후보                         |
| `/api/admin/candidates/[id]/approve` | POST             | 후보 승인                         |
| `/api/admin/candidates/[id]/reject`  | POST             | 후보 거절                         |
| `/api/admin/bulk`                    | POST             | 벌크 작업 (approve/reject/delete) |
| `/api/admin/audit-log`               | GET              | 감사 로그 목록                    |
| `/api/admin/audit-log/[id]/rollback` | POST             | 감사 로그 롤백                    |
| `/api/admin/post-images`             | POST             | 포스트 이미지 업로드              |
| `/api/admin/post-spots`              | POST             | 포스트 스팟 관리                  |
| `/api/admin/review`                  | GET/POST         | 콘텐츠 리뷰                       |

### Raw posts admin (#333 — Rust api-server proxy)

> assets Supabase 프로젝트의 raw_posts 도메인. Next.js 가 Bearer 위임으로 api-server `/api/v1/raw-posts/*` 에 프록시. 자세한 설계: [`docs/architecture/assets-project.md`](../architecture/assets-project.md)

| Route (Next.js proxy)                                   | Methods | Backend (api-server)                          | Description                                |
| ------------------------------------------------------- | ------- | --------------------------------------------- | ------------------------------------------ |
| `/api/admin/raw-post-sources`                           | GET/POST | `/api/v1/raw-posts/sources`                  | 수집 소스 목록/생성                        |
| `/api/admin/raw-post-sources/[id]`                      | PATCH/DELETE | `/api/v1/raw-posts/sources/{id}`         | 개별 소스                                  |
| `/api/admin/raw-post-sources/[id]/trigger`              | POST    | `/api/v1/raw-posts/sources/{id}/trigger`     | 수동 트리거 (#327)                         |
| `/api/admin/raw-posts/items`                            | GET     | `/api/v1/raw-posts/items`                    | raw_posts 큐 (status 필터링)               |
| `/api/admin/raw-posts/items/[id]/verify`                | POST    | `/api/v1/raw-posts/items/{id}/verify`        | 검증 — assets COMPLETED → prod posts INSERT (#339) |

api-server 직통 routes (web proxy 거치지 않는 경우 — 내부 호출/테스트용):

| Route                                       | Methods | Description                                                                  |
| ------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `/api/v1/raw-posts/sources`                 | GET/POST | 소스 CRUD (admin guard)                                                     |
| `/api/v1/raw-posts/sources/{id}`            | PATCH/DELETE | 개별 소스                                                                |
| `/api/v1/raw-posts/items`                   | GET     | raw_posts 페이지네이션 + 필터 (`status`, `platform`, `source_id`)            |
| `/api/v1/raw-posts/items/{id}`              | GET     | 단일 raw_post                                                                |
| `/api/v1/raw-posts/items/{id}/verify`       | POST    | 검증 → 로컬/prod posts INSERT. `APP_ENV=local` 시 assets status write skip |
| `/api/v1/raw-posts/stats`                   | GET     | 플랫폼별 parse_status 카운트                                                 |

Rust REST API와의 관계는 [`.planning/codebase/INTEGRATIONS.md`](../../.planning/codebase/INTEGRATIONS.md) 및 `packages/api-server` 문서를 참고합니다.
