# decoded-monorepo Development Guidelines

## Overview

Monorepo for the decoded platform — image/item discovery and curation with behavioral intelligence, editorial magazine system, virtual try-on (VTON), admin dashboard, and comprehensive design system (v2.0). Features AI-powered item detection, social actions (like/save/comment), personalized content, and collection/studio experiences.

## Monorepo Structure

```text
decoded-monorepo/
├── package.json          # Root — bun workspaces, Turborepo
├── turbo.json            # Build orchestration (build/dev/lint/test)
├── bunfig.toml           # Bun config (hoisted strategy)
├── packages/
│   ├── web/              # Next.js 16 frontend (main app)
│   ├── shared/           # Shared types, hooks, Supabase queries
│   ├── mobile/           # Expo 54 React Native app
│   ├── api-server/       # Rust/Axum API (Cargo workspace; not a bun workspace member)
│   └── ai-server/        # Python AI / gRPC (uv; former decoded-ai repo)
├── .planning/            # GSD workflow artifacts
└── CLAUDE.md             # This file
```

- **Package Manager**: bun 1.3.10+ (not yarn/npm)
- **Build Orchestration**: Turborepo
- **API server (Rust)**: `packages/api-server` — builds via `cargo` (not managed by bun workspaces)
- **AI server (Python)**: `packages/ai-server` — uv; thin `package.json` scripts for Turborepo only

## Tech Stack

- **Frontend**: Next.js 16.2.1, React 19.2.4, TypeScript 5.9.3
- **Styling**: Tailwind CSS 3.4.19, tailwind-merge 3.4.0, @tailwindcss/typography 0.5.19
- **State**: Zustand 5.0.12, React Query 5.90.11, React Query DevTools 5.91.1
- **Backend**: Supabase 2.86.0, Auth Helpers 0.15.0
- **Animations**: GSAP 3.13.0, Motion 12.23.12, Lenis 1.3.15, @use-gesture/react 10.3.1
- **UI Libraries**: Lucide React 0.577.0, React Icons 5.5.0, Radix UI, Sonner 2.0.7, shadcn 4.1.0
- **3D/Media**: Three.js 0.183.2, Spline (@splinetool/react-spline), browser-image-compression 2.0.2
- **Content**: react-markdown 10.1.0, recharts 3.7.0
- **Theme**: next-themes 0.4.6
- **Testing**: Playwright 1.58.1 (visual QA)
- **Linting**: ESLint 10.1.0 (flat config, Node 22+), Prettier 3.6.2
- **Package Manager**: bun 1.3.10+ (Turborepo orchestration)
- **Node.js**: 22.22.1 LTS (via nvm)
- **Rust Backend**: Axum 0.8, SeaORM 1.1, tokio

## Project Structure

```text
packages/web/
├── app/                    # Next.js App Router pages
│   ├── @modal/             # Parallel route for modals
│   ├── api/v1/             # API routes (posts, solutions, users, categories, spots, events, admin, vton, badges, rankings)
│   ├── admin/              # Admin dashboard (ai-cost, ai-audit, pipeline-logs, server-logs)
│   ├── debug/              # Debug tools (supabase)
│   ├── editorial/          # Daily editorial page
│   ├── explore/            # Explore grid view
│   ├── feed/               # Social feed
│   ├── images/             # Image discovery & detail
│   ├── login/              # OAuth authentication
│   ├── magazine/           # Personal magazine (editorial issue viewer)
│   ├── posts/              # Post detail
│   ├── profile/            # User profile with activity, badges, tries, collections
│   ├── request/            # Upload & AI detection flow
│   ├── search/             # Full-screen search overlay
│   └── lab/                # Experimental features
├── lib/
│   ├── api/                # API client functions
│   ├── components/         # Feature-based components
│   │   ├── ui/             # Primitive UI (Card, Button, BottomSheet)
│   │   ├── admin/          # Admin dashboard (sidebar, ai-cost, audit, pipeline, server-logs)
│   │   ├── auth/           # Auth components
│   │   ├── collection/     # Collection & studio (boards, bookshelf, collage, pins, issues)
│   │   ├── detail/         # Image/post detail views (hero, lightbox, gallery, try, comments, AI summary)
│   │   ├── dome/           # Dome experiment
│   │   ├── explore/        # Explore grid
│   │   ├── fashion-scan/   # AI fashion detection
│   │   ├── feed/           # Feed components
│   │   ├── magazine/       # Editorial magazine (hero, gallery, renderer, decoding ritual, particles)
│   │   ├── main/           # Home page sections
│   │   ├── main-renewal/   # Home page renewal components
│   │   ├── profile/        # Profile sections (activity, badges, tries, rankings, style DNA, ink economy)
│   │   ├── request/        # Upload flow components
│   │   ├── search/         # Search overlay & results
│   │   ├── shared/         # Shared components
│   │   └── vton/           # Virtual Try-On modal & lab
│   ├── design-system/      # v2.0 Design System (36 components)
│   ├── hooks/              # Custom React hooks
│   │   ├── admin/          # Admin hooks (useAiCost, useAudit, useDashboard, usePipeline, useServerLogs)
│   │   └── debug/          # Debug hooks
│   ├── stores/             # Zustand state stores
│   ├── supabase/           # Supabase client + queries
│   └── utils/              # Utility functions
└── __tests__/              # Test files

packages/shared/            # Shared types, hooks, Supabase queries
├── supabase/
│   ├── client.ts           # Shared Supabase client
│   ├── types.ts            # Shared DB types
│   └── queries/            # Shared queries (images, items)
specs/                      # Feature specifications
docs/                       # Documentation
.planning/                  # GSD workflow artifacts
```

## Implemented Features

### Core Pages & Routes

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
| `/admin`             | Admin dashboard (AI cost, audit, pipeline, server logs)                            |
| `/request/upload`    | Image upload with DropZone                                                         |
| `/request/detect`    | AI detection results with item spotting                                            |
| `/login`             | OAuth authentication (Kakao, Google, Apple)                                        |
| `/debug/supabase`    | Supabase debug tools                                                               |
| `/lab/*`             | Experimental (ascii-text, fashion-scan)                                            |

### Key Feature Areas

- **Editorial & Magazine**: AI-curated editorial content, personal magazine issues, decoding ritual animations
- **Social Actions**: Like, save, comment on posts with real-time counts
- **Virtual Try-On (VTON)**: AI-powered virtual try-on with lazy-loaded modal
- **Behavioral Intelligence**: Event tracking (dwell time, scroll depth), personalization engine
- **Collection & Studio**: Boards, bookshelf, collage views, pins, issue management
- **Admin Dashboard**: AI cost tracking, audit logs, pipeline monitoring, server logs streaming
- **Design System v2.0**: 36 components with comprehensive token system

## v2.0 Design System

### Import Path

All design system components are exported from a single barrel import:

```typescript
import {
  // Typography
  Heading,
  Text,
  // Inputs
  Input,
  SearchInput,
  // Cards
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardSkeleton,
  ProductCard,
  GridCard,
  FeedCardBase,
  ProfileHeaderCard,
  // Headers & Footer
  DesktopHeader,
  MobileHeader,
  DesktopFooter,
  // Tokens
  typography,
  colors,
  spacing,
  shadows,
  borderRadius,
  zIndex,
} from "@/lib/design-system";
```

### Component Usage Guide

| Component       | Use Case            | Example                                              |
| --------------- | ------------------- | ---------------------------------------------------- |
| **Heading**     | Page/section titles | `<Heading variant="h2">Title</Heading>`              |
| **Text**        | Body text, captions | `<Text variant="small">Description</Text>`           |
| **Card**        | Generic container   | `<Card variant="elevated" size="md">...</Card>`      |
| **ProductCard** | Product display     | `<ProductCard image={url} title="..." price="$99"/>` |
| **Input**       | Form inputs         | `<Input variant="search" leftIcon={<Search/>}/>`     |

### Design Token Reference

Access design tokens directly for custom styling:

```typescript
import { typography, spacing, colors } from "@/lib/design-system/tokens";

// Typography
typography.sizes.h1; // Font size for h1
responsiveTypography.pageTitle; // Responsive title sizing

// Spacing (4px base unit)
spacing[4]; // 16px
spacing[8]; // 32px

// Colors (CSS variable references)
colors.primary;
colors.muted;
```

### Documentation

For detailed design specifications and usage patterns:

- **[docs/design-system/](docs/design-system/)** - Design token documentation
- **[.planning/codebase/](/.planning/codebase/)** - Architecture and conventions

### Component List

Located in `lib/design-system/`:

| Component                            | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| **tokens.ts**                        | Design tokens (colors, spacing, typography, shadows) |
| **Heading, Text**                    | Typography components with size variants             |
| **Input, SearchInput**               | Form inputs with variants                            |
| **Card Family**                      | Base card + Header/Content/Footer + Skeleton         |
| **ProductCard**                      | Product card with image & description                |
| **GridCard**                         | Grid layout card variant                             |
| **FeedCardBase**                     | Social feed card variant                             |
| **ProfileHeaderCard**                | Profile header card                                  |
| **DesktopHeader**                    | Desktop navigation header                            |
| **MobileHeader**                     | Mobile navigation with bottom sheet                  |
| **DesktopFooter**                    | Desktop footer with links                            |
| **ActionButton**                     | Interactive action button                            |
| **ArtistCard**                       | Artist/celebrity display card                        |
| **Badge**                            | Badge/tag display                                    |
| **BottomSheet**                      | Mobile bottom sheet                                  |
| **Divider**                          | Section divider                                      |
| **GuestButton**                      | Guest action button                                  |
| **Hotspot**                          | Interactive hotspot marker                           |
| **LeaderItem**                       | Leaderboard/ranking item                             |
| **LoadingSpinner**                   | Loading state indicator                              |
| **LoginCard**                        | Login prompt card                                    |
| **NavBar, NavItem**                  | Navigation components                                |
| **OAuthButton**                      | OAuth provider button                                |
| **RankingItem**                      | Ranking display item                                 |
| **SectionHeader**                    | Section title header                                 |
| **ShopCarouselCard**                 | Shop item carousel card                              |
| **SpotCard, SpotDetail, SpotMarker** | Spot interaction components                          |
| **StatCard**                         | Statistics display card                              |
| **StepIndicator**                    | Multi-step progress indicator                        |
| **Tabs**                             | Tab navigation                                       |
| **Tag**                              | Categorization tag                                   |

## Key File Locations

| Area               | Location                            | Description                                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| **Auth**           | `lib/stores/authStore.ts`           | OAuth (Kakao, Google, Apple) + session                       |
| **Search State**   | `lib/stores/searchStore.ts`         | Search query, filters, results                               |
| **Behavior**       | `lib/stores/behaviorStore.ts`       | Behavioral tracking state                                    |
| **VTON**           | `lib/stores/vtonStore.ts`           | Virtual try-on state                                         |
| **Collection**     | `lib/stores/collectionStore.ts`     | Collection/studio state                                      |
| **Magazine**       | `lib/stores/magazineStore.ts`       | Magazine/editorial state                                     |
| **API Client**     | `lib/api/`                          | Backend API calls                                            |
| **API Routes**     | `app/api/v1/`                       | Next.js API proxy & server logic                             |
| **Supabase**       | `lib/supabase/queries/`             | DB queries (events, images, posts, profile, personalization) |
| **Shared Queries** | `packages/shared/supabase/queries/` | Cross-package queries (images, items)                        |
| **Design System**  | `lib/design-system/`                | v2.0 components & tokens                                     |
| **Components**     | `lib/components/`                   | Feature components                                           |
| **Hooks**          | `lib/hooks/`                        | Custom hooks                                                 |
| **Admin Hooks**    | `lib/hooks/admin/`                  | Admin dashboard hooks                                        |
| **Stores**         | `lib/stores/`                       | Zustand stores                                               |
| **Rust API**       | `packages/api-server/`              | Axum REST API, gRPC client to ai-server                      |
| **AI / gRPC**      | `packages/ai-server/`               | Inference, metadata, gRPC (Python)                           |

## API Routes

### Posts & Content

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
| `/api/v1/post-magazines/[id]`    | GET      | Post magazine data            |

### Solutions & Spots

| Route                                  | Methods   | Description                  |
| -------------------------------------- | --------- | ---------------------------- |
| `/api/v1/solutions/convert-affiliate`  | POST      | Convert affiliate links      |
| `/api/v1/solutions/[solutionId]`       | GET/PATCH | Solution CRUD                |
| `/api/v1/solutions/[solutionId]/adopt` | POST      | Adopt a solution             |
| `/api/v1/solutions/extract-metadata`   | POST      | Solution metadata extraction |
| `/api/v1/spots/[spotId]`               | GET/PATCH | Spot CRUD                    |
| `/api/v1/spots/[spotId]/solutions`     | GET/POST  | Solutions for spot           |

### Users & Profile

| Route                         | Methods | Description          |
| ----------------------------- | ------- | -------------------- |
| `/api/v1/users/me`            | GET     | Current user profile |
| `/api/v1/users/me/activities` | GET     | User activities      |
| `/api/v1/users/me/stats`      | GET     | User statistics      |
| `/api/v1/users/[userId]`      | GET     | User by ID           |
| `/api/v1/badges`              | GET     | All badges           |
| `/api/v1/badges/me`           | GET     | User's earned badges |
| `/api/v1/rankings`            | GET     | Global rankings      |
| `/api/v1/rankings/me`         | GET     | User's ranking       |

### Behavioral Intelligence

| Route                | Methods | Description                                              |
| -------------------- | ------- | -------------------------------------------------------- |
| `/api/v1/events`     | POST    | Track behavior events (dwell time, scroll depth, clicks) |
| `/api/v1/categories` | GET     | Category list                                            |

### Virtual Try-On (VTON)

| Route                | Methods | Description           |
| -------------------- | ------- | --------------------- |
| `/api/v1/vton`       | POST    | Submit VTON job       |
| `/api/v1/vton/items` | GET     | VTON-compatible items |

### Admin Dashboard

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

## Custom Hooks

### Data Fetching

- `useImages()` - Fetch and paginate images with filters
- `usePosts()` - Fetch and manage posts
- `useProfile()` - Fetch user profile data
- `useCategories()` - Fetch category list
- `useItems()` - Fetch items for posts
- `useNormalizedItems()` - Normalize item data structure
- `useSolutions()` - Fetch solutions for items
- `useSpots()` - Fetch spot data for images
- `useComments()` - Fetch and manage comments
- `useTries()` - Fetch try-on results

### Social Actions

- `usePostLike()` - Like/unlike posts
- `useSavedPost()` - Save/unsave posts

### Behavioral Tracking

- `useTrackEvent()` - Track custom behavior events
- `useTrackDwellTime()` - Track time spent on content
- `useTrackScrollDepth()` - Track scroll depth on pages

### Form & Input

- `useCreatePost()` - Multi-step post creation flow
- `useImageUpload()` - Image uploads with compression
- `useSearch()` - Search with debouncing
- `useSearchURLSync()` - URL-based search state sync

### UI & Animation

- `useResponsiveGridSize()` - Calculate grid columns
- `useScrollAnimation()` - Scroll-triggered animations
- `useFlipTransition()` - Flip card animations
- `useMediaQuery()` - Responsive breakpoint detection
- `useSpotCardSync()` - Sync spot selection with card UI
- `useDebounce()` - Debounce value changes

### Admin

- `useAiCost()` - AI cost tracking data
- `useAudit()` - Audit log data
- `useDashboard()` - Dashboard statistics
- `usePipeline()` - Pipeline monitoring
- `useServerLogs()` - Server log streaming

## Commands

```bash
# Monorepo (from root)
bun run dev             # Development server (JS packages via Turborepo)
bun run dev:api-server  # Rust API (cargo watch)
bun run dev:ai-server   # Python AI server (uv)
bun run build           # Production build (via Turborepo)
bun run lint            # ESLint (and package scripts where configured)

# Split local dev: Meilisearch·Redis·SearXNG = Docker first, then:
bun run dev:local-deps       # Docker deps only (see scripts/local-deps-up.sh)
bun run dev:local-fe         # Next only (same as dev:web)
bun run dev:local-be         # API + AI together; logs -> .logs/local/api.log & ai.log (tail -f in other terminals)
# Local host env templates: packages/api-server/.env.dev.example , packages/ai-server/.dev.env.example
# Port alignment (호스트 실행): MEILISEARCH_URL=http://localhost:7700 ; DECODED_AI_GRPC_URL=http://localhost:50052 (AI APP_ENV=dev)
#   API GRPC_PORT must equal AI GRPC_BACKEND_PORT ; AI Redis localhost:6303 + SEARXNG localhost:4000 with local-deps
# just local-help            # prints tail -f hints (root Justfile)

# Web package only
cd packages/web
bun run dev           # Next.js dev server
bun run build         # Next.js production build
bun run lint          # ESLint
bun run format        # Prettier formatting

# API server (Rust)
cd packages/api-server
cargo build           # Build API server
cargo run             # Run API server
cargo test            # Run tests

# AI server (Python)
cd packages/ai-server
uv sync
uv run python -m src.main
# or: bun run dev:ai-server  # from monorepo root
```

## Code Style

- TypeScript strict mode enabled
- ESLint + Prettier applied
- Conventional Commits format

## Important Notes

- Uses bun as package manager with Turborepo — use `bun` commands (not yarn/npm)
- ESLint 9 with flat config (eslint.config.mjs)
- Environment variables: .env.local (gitignored, see .env.local.example)
- Supabase integration required for data/auth

## Codebase Documentation

상세한 코드베이스 분석은 `.planning/codebase/`에서 확인:

| 문서                                                  | 내용                                 |
| ----------------------------------------------------- | ------------------------------------ |
| [STACK.md](.planning/codebase/STACK.md)               | 기술 스택, 의존성, 설정              |
| [ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | 시스템 아키텍처, 레이어, 데이터 흐름 |
| [STRUCTURE.md](.planning/codebase/STRUCTURE.md)       | 디렉토리 구조, 파일 위치             |
| [CONVENTIONS.md](.planning/codebase/CONVENTIONS.md)   | 코딩 컨벤션, 네이밍 패턴             |
| [TESTING.md](.planning/codebase/TESTING.md)           | 테스트 구조, 패턴                    |
| [INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) | 외부 서비스, API 연동                |
| [CONCERNS.md](.planning/codebase/CONCERNS.md)         | 기술 부채, 주의 사항                 |

## GSD Workflow

프로젝트 관리 명령어:

```bash
# 현황 확인
/gsd:progress          # 전체 진행 상황

# 페이즈 작업
/gsd:discuss-phase N   # 페이즈 N 논의
/gsd:plan-phase N      # 페이즈 N 계획
/gsd:execute-phase N   # 페이즈 N 실행
/gsd:verify-work       # 작업 검증

# 기타
/gsd:help              # 전체 명령어 목록
/gsd:quick             # 빠른 작업 (계획 없이)
```

## SpecKit Integration

- Specs 위치: `specs/` (feature별 폴더)
- Commands: `/speckit.*` (in Claude Code)

## Documentation

- **[docs/README.md](docs/README.md)** - 문서 인덱스
- **[.planning/](.planning/)** - GSD 워크플로우 아티팩트
- docs/adr/ - Architecture Decision Records
- docs/api/ - API integration guides
- docs/ai-playbook/ - AI tool usage guides
- docs/design-system/ - Design tokens

<!-- Last Updated: 2026-03-19 -->

<!-- MANUAL ADDITIONS START -->

- [Antigravity Rules](file:///Users/kiyeol/development/decoded/decoded-app/.antigravity/rules.md) - Autonomous execution policy and language preferences.
<!-- MANUAL ADDITIONS END -->
