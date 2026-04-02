# Web routes & feature areas

App Router 기준 (`packages/web/app/`). 작업 시 이 표와 실제 `app/` 트리를 함께 확인합니다.

## Core pages & routes

| Route                | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `/`                  | Home - Hero carousel, trending, best sections, celebrity grid                      |
| `/explore`           | Grid view with category filtering                                                  |
| `/feed`              | Social feed timeline                                                               |
| `/search`            | Full-screen overlay search with multi-tab results                                  |
| `/images`            | Image discovery grid with infinite scroll                                          |
| `/posts/[id]`        | Post detail (Lightbox, hero, related items, shop grid, comments, AI summary, try)  |
| `/profile`           | User profile with activity, badges, tries, stats, rankings, style DNA, collections |
| `/editorial`         | Daily editorial page with curated content                                          |
| `/magazine/personal` | Personal magazine issue viewer with decoding ritual                                |
| `/admin`             | Admin dashboard (AI cost, audit, content, pipeline, server logs)                   |
| `/admin/content`     | Content management — post visibility, status control                               |
| `/request/upload`    | Image upload with DropZone                                                         |
| `/request/detect`    | AI detection results with item spotting                                            |
| `/login`             | OAuth authentication (Kakao, Google, Apple)                                        |
| `/debug/supabase`    | Supabase debug tools                                                               |
| `/lab/*`             | Experimental (ascii-text, fashion-scan)                                            |

## Key feature areas

- **Editorial & Magazine**: AI-curated editorial content, personal magazine issues, decoding ritual animations
- **Social Actions**: Like, save, comment on posts with real-time counts
- **Virtual Try-On (VTON)**: AI-powered virtual try-on with lazy-loaded modal
- **Behavioral Intelligence**: Event tracking (dwell time, scroll depth), personalization engine
- **Collection & Studio**: Boards, bookshelf, collage views, pins, issue management
- **Admin Dashboard**: AI cost tracking, audit logs, pipeline monitoring, server logs streaming
- **Design System v2.0**: 36 components with comprehensive token system

Next.js API proxy 목록은 [api-v1-routes.md](api-v1-routes.md)를 참고합니다.
