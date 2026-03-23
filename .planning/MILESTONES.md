# Project Milestones: decoded-app

## v9.0 Type-Safe API Generation (Shipped: 2026-03-23)

**Phases completed:** 41 phases, 94 plans, 21 tasks

**Key accomplishments:**

- (none recorded)

---

## v5.0 AI Magazine & Archive Expansion (Shipped: 2026-03-12)

**Delivered:** AI 매거진 프론트엔드 풀스택 구현 — LayoutJSON 렌더링 엔진, 3D Bookshelf/Spline Studio 컬렉션, Decoding Ritual 애니메이션, Cinema-to-Action 메인페이지 리뉴얼

**Phases completed:** m7-01, m7-02, m7-03 (3 phases, 11 plans)

**Key accomplishments:**

- Magazine theme system (#eafd67 neon) + LayoutJSON types + MagazineRenderer layout engine with 6 components and GSAP orchestration
- 3D Bookshelf collection page with CSS perspective + GSAP spine pop-out interactions
- Decoding Ritual animation system — particles, style keywords, glow progress, cinematic sequence
- Main page Cinema-to-Action renewal — MainHero tilt/glow/noise, MasonryGrid parallax, PersonalizeBanner suction, SmartNav
- Spline Pro 3D Studio — studioStore state machine, useSplineRuntime/Bridge/Events hooks, StudioHUD, self-hosted .splinecode
- HTML overlay system — IssueDetailPanel (responsive mobile/desktop), CollectionShareSheet, EmptyStudio CTA, BookshelfViewFallback

**Stats:**

- 200 files changed, +18,997 / -515 lines
- 3 phases, 11 plans, 53 commits
- 8 days (2026-03-05 → 2026-03-12)

**Git range:** `fae7bb3` → `94d955a`

**What's next:** Planning next milestone

---

## v4.0 Spec Overhaul — AI-Ready Documentation (Shipped: 2026-02-20)

**Delivered:** 사용자 화면 중심의 spec/docs를 현재 코드베이스 기준으로 재작성하고, AI 에이전트 컨텍스트 주입에 최적화된 포맷으로 고도화 — 14개 화면 spec, 5개 플로우 문서, 5개 공유 기반 문서, 4개 차기 버전 초안

**Phases completed:** v4-01 to v4-09 (13 plans total)

**Key accomplishments:**

- Archived v2.1.0 spec snapshot (56 files) + stale path audit (60 issues documented)
- Built 5 shared foundation docs (component-registry, data-models, api-contracts, store-map, injection-guide)
- Delivered 14 screen specs across 4 bundles (detail, discovery, creation-AI, user) with verified file paths
- Wrote 5 flow documents defining navigation contracts and state machines
- Drafted 4 next-version direction memos (VTON, Dynamic UI, Commerce Bridge, Service Identity) with guardrails
- Consolidated clean spec structure — 7-entry root, retired 8 legacy bundle dirs

**Stats:**

- 173 files created/modified
- +22,277 lines of documentation (0 code changes)
- 9 phases, 13 plans, 29 requirements (100% coverage)
- 2 days (2026-02-19 → 2026-02-20)

**Git range:** `91f2cbe` → `3657def` (88 commits)

**What's next:** Planning next milestone

---

## v3.0 Admin Panel — AI Management (Shipped: 2026-02-19)

**Delivered:** AI 분석 파이프라인을 모니터링하고 결과를 감사할 수 있는 관리자 패널 — 대시보드, AI 감사, 비용 모니터링, 파이프라인 로그, 서버 로그 5개 섹션 구축

**Phases completed:** v3-01 to v3-06 (12 plans total)

**Key accomplishments:**

- Admin route protection with Supabase middleware + is_admin defense-in-depth
- Dashboard with 5 KPI cards, Recharts traffic chart, today summary (real + mock data)
- AI Audit with paginated list, hotspot detail modal, inline editing
- AI Cost Monitoring with token charts, API call stats, model cost breakdown
- Pipeline execution viewer with accordion step timeline and retry
- Server log viewer with filtering, URL-synced pagination, terminal streaming

**Stats:**

- 97 files created/modified
- +14,605 lines of TypeScript/React
- 6 phases, 12 plans, ~38 tasks
- 1 day (2026-02-19, ~8 hours)

**Git range:** `1f1f9ff` → `310ae95` (67 commits)

**What's next:** v4.0 Spec Overhaul — AI-Ready Documentation

---

## v2.1 Design System Expansion (Shipped: 2026-02-06)

**Delivered:** decoded.pen 디자인 시스템의 23개 추가 컴포넌트 구현 및 Visual QA 자동화 인프라 구축

**Phases completed:** v2.1-01 to v2.1-06 (6 phases, 14 plans total)

**Branch:** `feature/v2-design-overhaul` (계속 사용)

**Key accomplishments:**

- **23 Design System Components Created:**
  - Core Interactive: Tag, ActionButton, StepIndicator, Hotspot
  - Navigation: NavBar, NavItem, SectionHeader, Tabs
  - Cards: ArtistCard, StatCard, SpotCard, ShopCarouselCard
  - Profile/Detail: Badge, LeaderItem, RankingItem, SpotDetail
  - Login/State: OAuthButton, GuestButton, Divider, LoginCard, LoadingSpinner, SkeletonCard, BottomSheet

- **Visual QA Automation:**
  - 40 Playwright tests covering 10 core pages at 4 breakpoints
  - 36 baseline screenshots captured and approved
  - GitHub Actions CI workflow for automated visual regression testing

- **CVA Pattern Consistency:**
  - All components use CVA (class-variance-authority) for variants
  - forwardRef pattern for component refs
  - Type-safe exports from design-system barrel

**Tech Debt Accepted:**

- 15 orphaned components (exported but not integrated into app pages)
- Integration score: 35% (8/23 actively used)
- Duplicate implementations for some components (LoginCard, StepIndicator)

**Stats:**

- 6 phases, 14 plans executed
- 149 files changed, +12,290 / -590 lines
- 5,924 lines TypeScript in design-system
- 1 day (2026-02-05 → 2026-02-06)

**Git range:** `b1a1362` → `a313700`

**What's next:** v2.2 (component integration or new features)

---

## v1.0 Documentation Optimization (Shipped: 2026-01-29)

**Delivered:** AI 에이전트가 프로젝트 컨텍스트를 최소한의 토큰으로 빠르게 이해할 수 있도록 문서화 최적화

**Phases completed:** 1-5 (5 phases total)

**Key accomplishments:**

- CLAUDE.md 최적화: codebase 참조, GSD 명령어, 핵심 파일 위치 추가
- Specs 구조 정리: 빈 폴더 삭제, README 업데이트, 일관된 네이밍
- Docs 구조 정리: API 문서 동기화, SSOT 테이블 추가
- 크로스 레퍼런스: codebase ↔ specs ↔ docs 양방향 링크
- SSOT 원칙 문서화: 단일 진실 소스 정의 및 유지보수 가이드

**Stats:**

- 14 planning files created/modified
- 8 codebase analysis files
- 5 phases, 15 requirements
- 6 days from init to ship (2026-01-23 → 2026-01-29)

**Git range:** `d2b6e1d` → `c3325f6`

**What's next:** v1.1 Full API Integration

---

## v1.1 Full API Integration (Shipped: 2026-01-29)

**Delivered:** 백엔드 API를 프론트엔드에 완전 연결하여 모든 페이지가 실제 데이터로 동작

**Phases completed:** Phase 6 (Foundation) + Tracks A-D (Parallel) = 13 plans total

**Execution Strategy:**

- Phase 6: Sequential on main branch (API client patterns)
- Tracks A-D: Parallel via git worktrees (독립 기능 영역)

**Key accomplishments:**

- **API Foundation (Phase 6):**
  - Shared API client with auth token injection
  - React Query hooks pattern for mutations
  - Next.js API proxy routes (CORS 해결)
  - Dual state sync (React Query cache + Zustand store)

- **Track A - Content CRUD (3 plans):**
  - Post edit/delete APIs
  - Spot CRUD operations
  - Solution CRUD with metadata extraction

- **Track B - Engagement (2 plans):**
  - Vote system (accurate/different, retract, adopt)
  - Comment CRUD operations

- **Track C - Gamification (2 plans):**
  - Rankings display (global, personal, category)
  - Badge system integration

- **Track D - Monetization & Search (3 plans):**
  - Click tracking and earnings dashboard
  - Settlement and withdrawal flow
  - Search suggestions (popular/recent)

**Requirements covered:** 34 requirements

- PROF-01~05, POST-01~02, SPOT-01~04, SOLN-01~06
- VOTE-01~05, CMNT-01~04, RANK-01~03, BDGE-01~03
- EARN-01~05, SRCH-01~02

**Stats:**

- 13 plans executed (Phase 6: 3, Track A: 3, Track B: 2, Track C: 2, Track D: 3)
- 4 git worktrees for parallel execution
- 1 day (2026-01-29)

**Git range:** `c3325f6` → `f8c7afe`

**What's next:** v2.0 Design Overhaul (병렬 진행 중)

---

## v2.0 Design Overhaul (Shipped: 2026-02-05)

**Delivered:** decoded.pen 디자인 시스템을 코드로 구현하여 일관된 UI/UX 제공

**Phases completed:** v2-Phase 1-9 (9 phases, 26 plans total)

**Branch:** `feature/v2-design-overhaul`

**Key accomplishments:**

- **Design System Foundation (v2-Phase 1):**
  - Typography components (Heading, Text with variants)
  - Design tokens (colors, spacing, typography, shadows)
  - Tailwind CSS configuration extension

- **Core Interactive Components (v2-Phase 2):**
  - Button with 9 variants (Primary, Secondary, Outline, Ghost, Destructive) + 3 sizes
  - Input and SearchInput with icons, validation states
  - Tag components for category filtering

- **Card Components (v2-Phase 3):**
  - Base Card with cva variants and slots
  - ProductCard, GridCard for product display
  - FeedCard, ProfileHeaderCard for social features

- **Desktop Infrastructure (v2-Phase 4):**
  - DesktopHeader with navigation (replacing sidebar)
  - MobileHeader with bottom navigation
  - DesktopFooter with responsive 4-column layout

- **Page Implementations (v2-Phase 5-8):**
  - Home: Hero, trending, best sections with celebrity grid
  - Explore: Category filter grid with fade transitions
  - Feed: Responsive grid with engagement actions
  - Profile: 2-column desktop layout with activity tabs
  - Search: Full-screen overlay with multi-tab results
  - Image Detail: Hero parallax, lightbox, shop grid
  - Request Flow: 3-step indicator, direction-aware transitions
  - Login: Google OAuth simplification

- **Documentation (v2-Phase 9):**
  - Design system docs (tokens, components, patterns)
  - Codebase analysis updates
  - CLAUDE.md design system guidelines

**Components implemented:** 25+ design system components

- Typography: Heading, Text
- Inputs: Input, SearchInput
- Cards: Card, ProductCard, GridCard, FeedCard, ProfileHeaderCard
- Headers: DesktopHeader, MobileHeader
- Footer: DesktopFooter

**Components deferred to v2.1:** ~60 (from decoded.pen analysis)

- Tags, StepIndicator, Hotspot, EmptyState, ErrorState
- OAuthButton variants, ArtistCard, StatCard, Badge
- And more specialized components

**Stats:**

- 9 phases, 26 plans executed
- 8 pages redesigned (Home, Explore, Feed, Profile, Search, Image Detail, Request, Login)
- 7 days (2026-01-29 → 2026-02-05)

**Git range:** `f8c7afe` → (current)

**What's next:** v2.1 Design System Expansion

---
