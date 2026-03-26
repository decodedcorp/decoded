# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.9.3 - Strict mode enabled, all source code and configuration
- JavaScript - Build tooling and Next.js configuration (next.config.js, postcss.config.js, eslint.config.mjs)
- Rust - Backend API server (`packages/api-server`)
- Python - AI server (`packages/ai-server`)

**Secondary:**
- CSS/SCSS - Tailwind CSS preprocessed styles

## Runtime

**Environment:**
- Node.js 22+ (required; managed via bun)
- Next.js 16.2.1 runtime (React Server Components)

**Package Manager:**
- bun 1.3.10 (configured as packageManager in `package.json`)
- bun workspaces for monorepo dependency management
- Lockfile: `bun.lockb` present

**Task Runner:**
- Turborepo 2.x — task orchestration via `turbo.json`
- Config: `bunfig.toml` for bun-specific settings

## Monorepo Structure

**Workspaces:**
- `packages/web` — Next.js main frontend (`@decoded/web`)
- `packages/shared` — Shared types, hooks, utilities (`@decoded/shared`)
- `packages/mobile` — Expo mobile app (bun workspace member)
- `packages/api-server` — Rust/Axum backend (Cargo; **not** a bun workspace member)
- `packages/ai-server` — Python AI server (uv; **not** a bun workspace member)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework with App Router
  - Server Components and Route Handlers for backend
  - API routes for proxying to Rust backend
  - Built-in image optimization with remote patterns
  - React Strict Mode enabled

**Frontend:**
- React 19 + React DOM 19 - UI library
- Tailwind CSS 3.4.18 - Utility-first CSS framework
  - @tailwindcss/typography plugin for prose styling
  - Custom design tokens via CSS variables in `tailwind.config.ts`
  - Opacity support via color-mix() function
  - Dark mode support via class strategy

**State Management:**
- Zustand 5.0.12 - Lightweight state management
  - Stores: `authStore`, `requestStore`, `filterStore`, `searchStore`, `profileStore`, `transitionStore`, `vtonStore`, `behaviorStore`, `magazineStore`, `studioStore`, `collectionStore`
  - Location: `lib/stores/*.ts`

**Data Fetching & Caching:**
- TanStack React Query 5.90.11 - Server state management
  - @tanstack/react-query-devtools 5.91.1 for development
  - Query caching and synchronization
  - Configuration: 5-minute default stale time

**Animation & Interaction:**
- GSAP 3.13.0 + @gsap/react 2.1.2 - DOM animation and timeline orchestration
- Motion 12.23.12 - Declarative component animations
- Lenis 1.3.15 - Smooth scroll library
- @use-gesture/react 10.3.1 - React gesture handling
- Three.js 0.183 + @types/three - 3D graphics library
- OGL 1.0.11 - Lightweight WebGL library
- Spline 4.1 - 3D scene integration

**Charts & Visualization:**
- Recharts 3.7 - Composable chart components
- Rough.js 4.6 - Hand-drawn style graphics

**UI Components & Icons:**
- Radix UI primitives (@radix-ui/react-slot 1.2.4)
- Lucide React 0.577 - Icon library
- React Icons 5.5.0 - Additional icon sets
- Sonner 2.0.7 - Toast notification library
- class-variance-authority (CVA) 0.7.1 - Component variant system
- shadcn 4.1.0 - Component library generator

**HTTP Client:**
- Axios 1.13 - HTTP requests

**Utilities:**
- clsx 2.1.1 - Classname builder
- tailwind-merge 3.4.0 - Tailwind class conflict resolution
- browser-image-compression 2.0.2 - Client-side image compression for uploads
- react-markdown 10.1 - Parse and render Markdown
- next-themes 0.4.6 - Dark mode theme management
- Zod 3.25 - Schema validation

**Database & Auth:**
- @supabase/supabase-js 2.86.0 - PostgreSQL and auth client
- @supabase/auth-helpers-nextjs 0.15.0 - Server-side auth utilities with cookie handling

**Shared Package (`@decoded/shared`):**
- Exports: `supabase/*`, `hooks/*`, `stores/*`, `data/*`, `react-query/*`, `types`
- Peer deps: React 18+, Zustand 4+, TanStack Query 5+

## API Code Generation

- **Generator:** Orval 8.5.3 — config at `packages/web/orval.config.ts`
- **Source of truth:** `packages/api-server/openapi.json` (Rust utoipa-generated spec)
- **Generated output:** `packages/web/lib/api/generated/` (gitignored, only `.gitkeep` tracked)
- **Regenerate:** `cd packages/web && bun run generate:api`
- **Zod schemas:** `lib/api/generated/zod/decodedApi.zod.ts` — single file, all endpoint schemas
- **Upload endpoints:** Excluded from generation (4 multipart POST endpoints) — see `orval.config.ts` transformer
- **Extend behavior:** Edit `lib/api/mutator/custom-instance.ts` or `orval.config.ts` — never edit generated files directly

## Build Tools & Code Quality

**Build:**
- Next.js 16.2.1 - Built-in webpack-based build system
- PostCSS 8.5.6 - CSS processing pipeline
- Autoprefixer 10.4.22 - CSS vendor prefixes

**Linting & Formatting:**
- ESLint 10 - JavaScript/TypeScript linter (flat config)
  - Config: `packages/web/eslint.config.mjs`
  - Plugins: @next/eslint-plugin-next, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-prettier, typescript-eslint
  - Extends: @eslint/js, typescript-eslint recommended, Next.js core-web-vitals
  - Rules: prettier/prettier as error, unused vars warning (leading underscore allowed)

- Prettier 3.6.2 - Code formatter
  - Config: `packages/web/.prettierrc`
  - Settings: semi true, trailingComma es5, singleQuote false, printWidth 80, tabWidth 2, useTabs false, arrowParens always

**Testing:**
- Playwright 1.58 - E2E testing
- Vitest 4.1 - Unit testing

**TypeScript Configuration (tsconfig.json):**
- Strict mode: enabled
- Module resolution: bundler
- Target: ES2017
- Path aliases:
  - `@/*` → workspace root
  - `@decoded/shared` → `../shared/index.ts`
  - `@decoded/shared/*` → `../shared/*`

## Design System

**v2.0 Design System** (`lib/design-system/`):
- class-variance-authority 0.7.1 - Component variant system (CVA pattern)
- Radix UI primitives (@radix-ui/react-slot) - Headless UI components
- Design tokens in `tokens.ts` - Centralized spacing, colors, typography, shadows
- Barrel exports from `index.ts`: `import { Card } from "@/lib/design-system"`
- Component library (36 components total including tokens.ts and index.ts):
  - Typography: `Heading`, `Text` with responsive size variants
  - Inputs: `Input`, `SearchInput` with CVA variants
  - Card family: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardSkeleton`, `ProductCard`, `GridCard`, `FeedCardBase`, `ProfileHeaderCard`, `ArtistCard`, `SpotCard`, `SpotDetail`, `ShopCarouselCard`, `StatCard`, `RankingItem`, `LeaderItem`, `SkeletonCard`
  - Navigation: `NavBar`, `NavItem`, `SectionHeader`, `DesktopHeader`, `MobileHeader`, `DesktopFooter`
  - Buttons: `ActionButton`, `OAuthButton`, `GuestButton`
  - Feedback: `Tag`, `Badge`, `Divider`, `Tabs`, `StepIndicator`, `LoadingSpinner`, `LoginCard`, `BottomSheet`, `Hotspot`
- Integration: CSS variables → Tailwind config → `globals.css` → components

**Pattern:**
- CVA for variant management with `componentVariants` pattern
- Skeleton states for all major components (e.g., `CardSkeleton`)
- Brand color utility: `brandToColor` for deterministic color generation via string hash

## Backend API (packages/api-server — Rust)

**Async Runtime & HTTP:**
- Tokio 1.36 - Async runtime
- Axum 0.8.8 - HTTP web framework

**Data & Storage:**
- SeaORM 1.1.19 - Async ORM (PostgreSQL)
- aws-sdk-s3 1.119 - Cloudflare R2 object storage
- Meilisearch SDK 0.32 - Full-text search

**Auth & Security:**
- jsonwebtoken 9 - JWT signing and verification
- validator 0.20 - Input validation

**gRPC (AI server communication):**
- Tonic 0.14.2 - gRPC framework
- Prost 0.14.3 - Protobuf code generation

**Scheduling & Caching:**
- tokio-cron-scheduler 0.13 - Cron job scheduling
- moka 0.12 - In-memory cache

**OpenAPI Docs:**
- utoipa 5.3 - OpenAPI spec generation via derive macros
- utoipa-swagger-ui 9.0 - Swagger UI integration

**Utilities:**
- Tera 1 - Jinja2-like templating for LLM prompt templates
- image 0.25 - Image processing
- scraper 0.25 - HTML scraping
- tracing 0.1 + tracing-subscriber 0.3 - Observability and structured logging

## AI Server (packages/ai-server — Python)

**Web Framework:**
- FastAPI 0.115 - Async REST API
- Uvicorn 0.34 - ASGI server

**gRPC:**
- grpcio 1.74 + grpcio-tools - gRPC server
- protobuf 6.31 - Protocol buffers

**LLM Providers:**
- OpenAI SDK - GPT models
- Groq SDK - Groq-hosted LLMs
- Google GenAI (Gemini) - Gemini models
- Perplexity AI - Perplexity search-augmented LLMs

**LLM Orchestration:**
- LangGraph 0.3+ - Stateful multi-step agent workflows
- LangChain Groq + Core - LangChain integrations

**ML / Local LLM:**
- PyTorch 2.7 - Deep learning framework
- Transformers 4.53 - Hugging Face model hub

**Search:**
- SearXNG - Self-hosted meta-search engine

**Job Queue & Scheduling:**
- ARQ 0.26 - Redis-backed async job queue
- APScheduler 3.10 - In-process task scheduling
- Redis 5.2 - Message broker and cache

**Web Scraping:**
- BeautifulSoup4 - HTML parsing
- Selenium 4.29 - Browser automation

**Utilities:**
- dependency-injector 4.46 - IoC container
- PyJWT 2.10 - JWT handling
- python-telegram-bot 21 - Telegram bot integration
- youtube-transcript-api 1.2 - YouTube transcript extraction
- tenacity 9 - Retry logic
- supabase-py 2.0 - Supabase client
- Jinja2 3.1 - Template engine

## Key Dependencies

**Critical (Direct Integration):**
- Next.js 16.2.1 - Runtime framework
- React 19 + React DOM 19 - UI library
- @supabase/supabase-js 2.86.0 - PostgreSQL + Auth
- @supabase/auth-helpers-nextjs 0.15.0 - Server-side auth
- TypeScript 5.9.3 - Type checking

**Infrastructure & Build:**
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.22 - CSS vendor prefixes
- Tailwind CSS 3.4.18 - CSS framework

**State & Data:**
- Zustand 5.0.12 - Client state
- @tanstack/react-query 5.90.11 - Server state
- @tanstack/react-query-devtools 5.91.1 - Query debugging

## Configuration

**Environment Files:**
- `.env.local` - Local development (gitignored)
- `.env.local.example` - Template
- `bunfig.toml` - bun configuration
- `turbo.json` - Turborepo pipeline config

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only admin key
- `API_BASE_URL` - Backend API base URL (server-only)
- `NEXT_PUBLIC_API_BASE_URL` - Client API override (optional, defaults to empty for proxy mode)
- `NEXT_PUBLIC_USE_MOCK_SEARCH` - Enable mock search data (optional)

**TypeScript & Build Config:**
- `packages/web/tsconfig.json` - TypeScript strict config
- `packages/web/next.config.js` - Next.js config with remote image patterns
- `packages/web/tailwind.config.ts` - Design token system with CSS variables
- `packages/web/eslint.config.mjs` - ESLint flat config

**Image Remote Patterns (next.config.js):**
- `**.r2.dev` - Cloudflare R2 buckets
- `picsum.photos` - Placeholder images
- `api.dicebear.com` - Avatar generation

## Platform Requirements

**Development:**
- Node.js 22+
- bun 1.3.10 (must use bun, not yarn/npm)

**Production:**
- Deployment target: Vercel or Node.js runtime supporting Next.js 16

**External Services (Required):**
- Supabase project (PostgreSQL, Auth)
- Backend API server at `API_BASE_URL`

**Optional Services:**
- Cloudflare R2 (image storage)
- OAuth providers: Google, Apple, Kakao (via Supabase)
- Meilisearch (full-text search)
- Redis (AI server job queue)

---

*Stack analysis: 2026-03-26*
