---
title: Web Routes & Features — Agent Reference
owner: human
status: approved
updated: 2026-04-17
tags: [agent, ui]
---

# Web Routes & Features — Agent Reference

App Router 기준 (`packages/web/app/`). 작업 시 이 표와 실제 `app/` 트리를 함께 확인합니다.

## Core pages & routes

| Route                           | Description                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/`                             | Home — HeroItemSync, EditorialMagazine, EditorialCarousel, StyleMoods, EditorPicks, TrendingListSection, DomeGallerySection |
| `/explore`                      | Grid view with Meilisearch search, hierarchical filters, artist/context facets                                              |
| `/feed`                         | Social feed timeline                                                                                                        |
| `/search`                       | Full-screen overlay search with multi-tab results                                                                           |
| `/images`                       | Image discovery grid with infinite scroll                                                                                   |
| `/posts/[id]`                   | Post detail (Lightbox, hero, related items, shop grid, comments, social actions, AI summary, try)                           |
| `/profile`                      | User profile with activity, badges, tries, stats, rankings, style DNA, likes, saved, follow                                 |
| `/profile/[userId]`             | Public profile with follow, posts, likes grid                                                                               |
| `/rankings`                     | Global rankings & user ranking                                                                                              |
| `/editorial`                    | Daily editorial page with curated content                                                                                   |
| `/magazine/personal`            | Personal magazine issue viewer with decoding ritual                                                                         |
| `/admin`                        | Admin dashboard (AI cost, audit, content, pipeline, server logs, picks, monitoring)                                         |
| `/admin/login`                  | Admin email/password login (exempted from proxy.ts auth middleware)                                                         |
| `/admin/content`                | Content management — post visibility, status control                                                                        |
| `/admin/monitoring`             | Backend monitoring — latency charts, throughput, endpoint metrics (Prometheus)                                              |
| `/admin/ai-audit`               | AI 감사 페이지                                                                                                              |
| `/admin/editorial-candidates`   | Posts eligible for editorial promotion (spot ≥ 4, solution ≥ 1/spot)                                                        |
| `/admin/picks`                  | Decoded Pick curation — create/edit daily curated picks                                                                     |
| `/admin/audit-log`              | 감사 로그 뷰어                                                                                                              |
| `/admin/review`                 | 콘텐츠 리뷰                                                                                                                 |
| `/admin/seed/candidates`        | 시드 후보 목록                                                                                                              |
| `/admin/seed/candidates/[id]`   | 개별 후보 상세                                                                                                              |
| `/admin/seed/post-images`       | 시드 포스트 이미지                                                                                                          |
| `/admin/seed/post-spots`        | 시드 포스트 스팟                                                                                                            |
| `/admin/entities/artists`       | 아티스트 관리 (CRUD, paginated, searchable)                                                                                 |
| `/admin/entities/brands`        | 브랜드 관리 (CRUD)                                                                                                          |
| `/admin/entities/group-members` | 그룹 멤버 관리                                                                                                              |
| `/admin/raw-post-sources`       | 수집 소스 등록/관리 (Pinterest 등 — #327)                                                                                   |
| `/admin/raw-posts`              | **검증 큐** (#333) — assets 의 raw_posts 를 status 탭(COMPLETED/IN_PROGRESS/ERROR/VERIFIED) 으로 필터링, "검증" 버튼으로 prod posts 반영 |
| `/request/upload`               | Image upload with DropZone                                                                                                  |
| `/request/detect`               | AI detection results with item spotting                                                                                     |
| `/request/try`                  | Try 포스트 업로드 페이지                                                                                                    |
| `/login`                        | OAuth authentication (Kakao, Google, Apple)                                                                                 |
| `/debug/supabase`               | Supabase debug tools                                                                                                        |
| `/lab/*`                        | Experimental (ascii-text, fashion-scan)                                                                                     |

## Main page sections (`/`)

Sections rendered in order:

| Component             | Description                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `HeroItemSync`        | Hero carousel synced with item annotations; slides through recent + popular posts (desktop only) |
| `EditorialMagazine`   | Magazine-style cards from posts with `post_magazine_title` (diverse artists, max 12)             |
| `EditorialCarousel`   | Style cards with editorial posts + spot/solution items (up to 10, deduplicated by artist)        |
| `StyleMoods`          | Masonry grid of popular posts (up to 16, with image dimensions)                                  |
| `EditorPicks`         | Editor-curated picks (from `fetchEditorPicks`)                                                   |
| `TrendingListSection` | Trending artist keywords with profile images (up to 8)                                           |
| `DomeGallerySection`  | Dome/panoramic gallery of popular post images (up to 20)                                         |

## Key feature areas

- **Editorial & Magazine**: AI-curated editorial content, personal magazine issues, decoding ritual animations
- **Explore Search**: Meilisearch full-text search via `/api/v1/search` proxy; falls back to Supabase ilike. `useExploreData` hook switches between browse/search modes. Artist facets (client-side multi-select) and context filter (server-side).
- **Decoded Pick Curation**: Daily curated post managed from `/admin/picks`. `DecodedPickSection` on homepage displays the active pick with spot annotations and item cards.
- **Social Actions**: Like, save, comment on posts with real-time counts
- **Virtual Try-On (VTON)**: AI-powered virtual try-on with lazy-loaded modal
- **Behavioral Intelligence**: Event tracking (dwell time, scroll depth), personalization engine
- **Collection & Studio**: Boards, bookshelf, collage views, pins, issue management
- **Admin Dashboard**: AI cost tracking, audit logs, pipeline monitoring, server logs streaming, editorial candidates, picks management
- **Error Handling**: `app/error.tsx` (route-level 500, inside layout, reports to Sentry), `app/global-error.tsx` (top-level fallback)
- **Design System v2.0**: 36 components with comprehensive token system

## SEO

| File                   | Description                                   |
| ---------------------- | --------------------------------------------- |
| `app/sitemap.ts`       | 동적 XML sitemap (active posts + 정적 페이지) |
| `app/robots.ts`        | robots.txt 규칙                               |
| `app/api/og/route.tsx` | OG image 동적 생성                            |

## API proxy routes (Try & Votes)

| Route                                  | Methods         | Description                                        |
| -------------------------------------- | --------------- | -------------------------------------------------- |
| `/api/v1/posts/try`                    | POST            | Try 생성 API (인증 필요)                           |
| `/api/v1/posts/[postId]/tries`         | GET             | Try 목록                                           |
| `/api/v1/posts/[postId]/tries/count`   | GET             | Try 개수                                           |
| `/api/v1/solutions/[solutionId]/votes` | GET/POST/DELETE | 솔루션 투표 조회·생성·삭제 (POST·DELETE 인증 필요) |

## Auth

| File                             | Description       |
| -------------------------------- | ----------------- |
| `app/api/auth/callback/route.ts` | OAuth 콜백 핸들러 |
| `app/api/auth/session/route.ts`  | 서버 세션 설정    |

Next.js API proxy 목록은 [api-v1-routes.md](api-v1-routes.md)를 참고합니다.
