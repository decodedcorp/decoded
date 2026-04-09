# Web routes & feature areas

App Router 기준 (`packages/web/app/`). 작업 시 이 표와 실제 `app/` 트리를 함께 확인합니다.

## Core pages & routes

| Route                | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `/`                  | Home — HeroItemSync, TrendingPostsSection, HelpFindSection, EditorialMagazine, DecodedPickSection, MasonryGrid, DomeGallerySection |
| `/explore`           | Grid view with Meilisearch search, hierarchical filters, artist/context facets     |
| `/feed`              | Social feed timeline                                                               |
| `/search`            | Full-screen overlay search with multi-tab results                                  |
| `/images`            | Image discovery grid with infinite scroll                                          |
| `/posts/[id]`        | Post detail (Lightbox, hero, related items, shop grid, comments, AI summary, try)  |
| `/profile`           | User profile with activity, badges, tries, stats, rankings, style DNA, collections |
| `/editorial`         | Daily editorial page with curated content                                          |
| `/magazine/personal` | Personal magazine issue viewer with decoding ritual                                |
| `/admin`             | Admin dashboard (AI cost, audit, content, pipeline, server logs, picks)            |
| `/admin/login`       | Admin email/password login (exempted from proxy.ts auth middleware)                |
| `/admin/content`     | Content management — post visibility, status control                               |
| `/admin/editorial-candidates` | Posts eligible for editorial promotion (spot ≥ 4, solution ≥ 1/spot)   |
| `/admin/picks`       | Decoded Pick curation — create/edit daily curated picks                            |
| `/admin/audit-log`   | 감사 로그 뷰어                                                                     |
| `/admin/review`      | 콘텐츠 리뷰                                                                        |
| `/admin/seed/candidates` | 시드 후보 목록                                                                 |
| `/admin/seed/candidates/[id]` | 개별 후보 상세                                                           |
| `/admin/seed/post-images` | 시드 포스트 이미지                                                            |
| `/admin/seed/post-spots`  | 시드 포스트 스팟                                                              |
| `/admin/entities/artists` | 아티스트 관리 (CRUD, paginated, searchable)                                   |
| `/admin/entities/brands`  | 브랜드 관리 (CRUD)                                                            |
| `/admin/entities/group-members` | 그룹 멤버 관리                                                          |
| `/request/upload`    | Image upload with DropZone                                                         |
| `/request/detect`    | AI detection results with item spotting                                            |
| `/login`             | OAuth authentication (Kakao, Google, Apple)                                        |
| `/debug/supabase`    | Supabase debug tools                                                               |
| `/lab/*`             | Experimental (ascii-text, fashion-scan)                                            |

## Main page sections (`/`)

Sections rendered in order:

| Component | Description |
| --------- | ----------- |
| `HeroItemSync` | Hero carousel synced with item annotations; slides through recent + popular posts |
| `TrendingPostsSection` | Horizontal scroll of trending (popular) posts — up to 16 cards |
| `HelpFindSection` | Posts where `created_with_solutions = false` — community sourcing |
| `EditorialMagazine` | Magazine-style cards from posts with `post_magazine_title` |
| `DecodedPickSection` | Daily curated pick with style card + item grid; sourced from `decoded_picks` table |
| `MasonryGrid` | Masonry layout of popular posts (up to 16) |
| `DomeGallerySection` | Dome/panoramic gallery of popular post images (up to 20) |

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

| File | Description |
| ---- | ----------- |
| `app/sitemap.ts` | 동적 XML sitemap (active posts + 정적 페이지) |
| `app/robots.ts` | robots.txt 규칙 |
| `app/api/og/route.tsx` | OG image 동적 생성 |

## Auth

| File | Description |
| ---- | ----------- |
| `app/api/auth/callback/route.ts` | OAuth 콜백 핸들러 |
| `app/api/auth/session/route.ts` | 서버 세션 설정 |

Next.js API proxy 목록은 [api-v1-routes.md](api-v1-routes.md)를 참고합니다.
