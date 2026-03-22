# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**
- TypeScript 5.9.3 - Strict mode enabled, all source code and configuration
- JavaScript - Build tooling and Next.js configuration (next.config.js, postcss.config.js, eslint.config.mjs)

**Secondary:**
- CSS/SCSS - Tailwind CSS preprocessed styles

## Runtime

**Environment:**
- Node.js (version not pinned, managed via Yarn)
- Next.js 16.0.7 runtime (React Server Components)

**Package Manager:**
- Yarn 4.9.2 (configured as packageManager in `package.json`)
- Node-modules linker enabled in `.yarnrc.yml`
- Lockfile: `yarn.lock` present

## Frameworks

**Core:**
- Next.js 16.0.7 - Full-stack React framework with App Router
  - Server Components and Route Handlers for backend
  - API routes for proxying to backend
  - Built-in image optimization with remote patterns
  - React Strict Mode enabled

**Frontend:**
- React 18.3.1 - UI library with React DOM 18.3.1
- Tailwind CSS 3.4.18 - Utility-first CSS framework
  - @tailwindcss/typography plugin for prose styling
  - Custom design tokens via CSS variables in `tailwind.config.ts`
  - Opacity support via color-mix() function
  - Dark mode support via class strategy

**State Management:**
- Zustand 4.5.7 - Lightweight state management
  - Stores: `authStore`, `requestStore`, `filterStore`, `searchStore`, `profileStore`, `transitionStore`
  - Location: `lib/stores/*.ts`

**Data Fetching & Caching:**
- React Query (TanStack) 5.90.11 - Server state management
  - @tanstack/react-query-devtools 5.91.1 for development
  - Query caching and synchronization
  - Configuration: 5-minute default stale time

**Animation & Interaction:**
- GSAP 3.13.0 + @gsap/react 2.1.2 - DOM animation and timeline orchestration
- Motion 12.23.12 - Declarative component animations
- Lenis 1.3.15 - Smooth scroll library
- @use-gesture/react 10.3.1 - React gesture handling
- Three.js 0.167.1 + @types/three 0.181.0 - 3D graphics library

**UI Components & Icons:**
- Radix UI primitives (@radix-ui/react-slot 1.2.4)
- Lucide React 0.555.0 - Icon library
- React Icons 5.5.0 - Additional icon sets
- Sonner 2.0.7 - Toast notification library
- class-variance-authority 0.7.1 - Component variant system
- shadcn 3.5.0 - Component library generator

**Utilities:**
- clsx 2.1.1 - Classname builder
- tailwind-merge 3.4.0 - Tailwind class conflict resolution
- browser-image-compression 2.0.2 - Client-side image compression for uploads
- react-markdown 10.1.0 - Parse and render Markdown
- next-themes 0.4.6 - Dark mode theme management

**Database & Auth:**
- @supabase/supabase-js 2.86.0 - PostgreSQL and auth client
- @supabase/auth-helpers-nextjs 0.15.0 - Server-side auth utilities with cookie handling

**Monorepo:**
- @decoded/web - Main web application (packages/web)
- @decoded/shared - Shared types, hooks, utilities (packages/shared)
  - Exports: supabase/*, hooks/*, stores/*, data/*, react-query/*, types

## Build Tools & Code Quality

**Build:**
- Next.js 16.0.7 - Built-in webpack-based build system
- PostCSS 8.5.6 - CSS processing pipeline
- Autoprefixer 10.4.22 - CSS vendor prefixes

**Linting & Formatting:**
- ESLint 9.39.1 - JavaScript/TypeScript linter
  - Config: `packages/web/eslint.config.mjs` (flat config format)
  - Plugins: @next/eslint-plugin-next, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-prettier
  - Extends: @eslint/js, typescript-eslint recommended, Next.js core-web-vitals
  - Rules: prettier/prettier as error, unused vars warning (leading underscore allowed)

- Prettier 3.6.2 - Code formatter
  - Config: `packages/web/.prettierrc`
  - Settings: semi true, trailingComma es5, singleQuote false, printWidth 80, tabWidth 2, useTabs false, arrowParens always

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
- Component library (35 components total including tokens.ts and index.ts):
  - Typography: `Heading`, `Text` with responsive size variants
  - Inputs: `Input`, `SearchInput` with CVA variants
  - Card family: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardSkeleton`, `ProductCard`, `GridCard`, `FeedCardBase`, `ProfileHeaderCard`, `ArtistCard`, `SpotCard`, `SpotDetail`, `ShopCarouselCard`, `StatCard`, `RankingItem`, `LeaderItem`, `SkeletonCard`
  - Navigation: `NavBar`, `NavItem`, `SectionHeader`, `DesktopHeader`, `MobileHeader`, `DesktopFooter`
  - Buttons: `ActionButton`, `OAuthButton`, `GuestButton`
  - Feedback: `Tag`, `Badge`, `Divider`, `Tabs`, `StepIndicator`, `LoadingSpinner`, `LoginCard`, `BottomSheet`, `Hotspot`
- Integration: CSS variables → Tailwind config → `globals.css` → components

**Pattern:**
- Barrel exports from `index.ts` for clean imports: `import { Card } from "@/lib/design-system"`
- CVA for variant management with `componentVariants` pattern
- Skeleton states for all major components (e.g., `CardSkeleton`)
- Brand color utility: `brandToColor` for deterministic color generation via string hash

## Key Dependencies

**Critical (Direct Integration):**
- Next.js 16.0.7 - Runtime framework
- @supabase/supabase-js 2.86.0 - PostgreSQL + Auth
- @supabase/auth-helpers-nextjs 0.15.0 - Server-side auth
- TypeScript 5.9.3 - Type checking

**Infrastructure & Build:**
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.22 - CSS vendor prefixes
- Tailwind CSS 3.4.18 - CSS framework

**State & Data:**
- Zustand 4.5.7 - Client state
- @tanstack/react-query 5.90.11 - Server state
- @tanstack/react-query-devtools 5.91.1 - Query debugging

## Configuration

**Environment Files:**
- `.env.local` - Local development (gitignored)
- `.env.local.example` - Template
- `.yarnrc.yml` - Yarn v4 configuration

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
- Node.js (no specific version pinned)
- Yarn 4.9.2 (must use Yarn, not npm)

**Production:**
- Node.js 18+ (recommended)
- Deployment target: Vercel or Node.js runtime supporting Next.js 16

**External Services (Required):**
- Supabase project (PostgreSQL, Auth)
- Backend API server at `API_BASE_URL`

**Optional Services:**
- Cloudflare R2 (image storage)
- OAuth providers: Google, Apple, Kakao (via Supabase)

---

*Stack analysis: 2026-02-12*
