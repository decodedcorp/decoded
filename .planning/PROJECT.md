# Project: decoded-monorepo

## What This Is

AI 기반 미디어 디스커버리 플랫폼. K-POP 아이돌과 셀럽의 패션 아이템을 발견하고 공유하는 서비스. AI 매거진 시스템과 Spline 3D 스튜디오 구축 완료.

**v1.0 (2026-01-29 shipped):** 문서화 최적화
**v1.1 (2026-01-29 shipped):** 전체 API 연결 — 백엔드 API를 프론트엔드에 연결하여 실제 데이터로 동작
**v2.0 (2026-02-05 shipped):** 디자인 오버홀 — decoded.pen 디자인을 코드로 구현
**v2.1 (2026-02-06 shipped):** 디자인 시스템 확장 — 23개 추가 컴포넌트 + Visual QA 자동화
**v3.0 (2026-02-19 shipped):** Admin Panel — AI Management — 대시보드, AI 감사, 비용 모니터링, 파이프라인/서버 로그 5개 섹션
**v4.0 (2026-02-20 shipped):** Spec Overhaul — AI-Ready Documentation — 14개 화면 spec, 5개 플로우 문서, 5개 공유 기반 문서
**v5.0 (2026-03-12 shipped):** AI Magazine — LayoutJSON 매거진 렌더러, 3D Spline Studio 컬렉션, Cinema-to-Action 메인페이지 리뉴얼

## Current Milestone: v11.0 Explore & Editorial Data Integration

**Goal:** Explore/Editorial 페이지의 데이터 연동과 상세페이지 연결을 완성하여 콘텐츠 탐색 → 상세 뷰 플로우 제공 (GitHub #40)

**Target features:**
- Editorial 데이터 검증 — magazine_id 있는 post 반환 확인, editorial 자동화(#38) 연동
- Explore → 상세페이지 연결 — 사이드 드로어 + 크게보기 풀 디스플레이 플로우
- Editorial/Explore 카드에 spot/solution 정보 표시
- (후순위) 아티스트 프로필 카드, 트렌딩 섹션, 매거진 전용 레이아웃

## Core Value

**완전한 사용자 경험** — 모든 페이지가 실제 데이터로 동작하며 일관된 디자인 시스템 적용

## Current State

### Codebase

- **Tech Stack**: Next.js 16 + React 18 + TypeScript 5.9 + Supabase + Zustand + React Query
- **Structure**: Monorepo (packages/web, packages/shared)
- **Design System**: 45+ components in `lib/design-system/` (5,924 LOC)
- **3D Integration**: Spline Pro (@splinetool/react-spline) for 3D Studio collection
- **Animation Stack**: GSAP 3.13 + Motion 12 + Lenis smooth scroll
- **Codebase Map**: `.planning/codebase/` (8 files, 3,250+ lines)

### AI Magazine System (v5.0 shipped)

- **MagazineRenderer**: LayoutJSON-driven layout engine with 6 component types
- **Magazine Pages**: /magazine (daily editorial), /magazine/personal (Decoding Ritual), /collection (3D Studio)
- **3D Studio**: Spline Pro scene with studioStore state machine, data/event bridges, HTML overlays
- **Main Page**: Cinema-to-Action renewal with Hero tilt/glow, MasonryGrid parallax, SmartNav

### Spec System (v4.0 shipped)

- **14 screen specs** across 4 bundles (detail, discovery, creation-AI, user)
- **5 flow documents** (discovery, detail, creation, user, VTON draft)
- **5 shared foundation docs** (component-registry, data-models, api-contracts, store-map, injection-guide)
- **4 next-version drafts** (service identity, VTON, dynamic UI, commerce bridge)
- **Spec format**: EARS syntax, mobile-first, 200-line target, verified file paths

### Visual QA

- **Playwright Tests**: 40 tests covering 10 pages at 4 breakpoints
- **Baseline Screenshots**: 36 approved
- **CI Pipeline**: GitHub Actions workflow on PRs

## Requirements

### Validated

**v1.0 Documentation:**

- ✓ CLAUDE.md에 codebase 참조 추가 — v1.0
- ✓ specs/README.md 업데이트 — v1.0
- ✓ docs/README.md 업데이트 — v1.0
- ✓ 빈 스펙 폴더 정리 — v1.0
- ✓ 크로스 레퍼런스 추가 — v1.0
- ✓ SSOT 원칙 문서화 — v1.0

**v1.1 API Integration:**

- ✓ 프로필 API 연결 (GET/PATCH, activities, stats) — v1.1
- ✓ Posts/Spots/Solutions CRUD API — v1.1
- ✓ 투표/댓글 시스템 API — v1.1
- ✓ 랭킹/배지 시스템 API — v1.1
- ✓ 수익 대시보드/정산 API — v1.1
- ✓ 검색 API (popular, recent) — v1.1

**v2.0 Design Overhaul:**

- ✓ 디자인 토큰 추출 (색상, 타이포그래피, 간격) — v2.0
- ✓ 타이포그래피 컴포넌트 구현 (Heading, Text) — v2.0
- ✓ Tailwind CSS 설정 확장 — v2.0
- ✓ 버튼, 입력, 태그 컴포넌트 — v2.0
- ✓ 카드 컴포넌트 (Product, Feed, Profile) — v2.0
- ✓ 데스크탑 레이아웃 (Header, Footer) — v2.0
- ✓ 페이지별 디자인 적용 (8개 페이지) — v2.0

**v2.1 Design System Expansion:**

- ✓ Tag 컴포넌트 (6 category variants) — v2.1
- ✓ ActionButton 컴포넌트 (3 variants) — v2.1
- ✓ StepIndicator (3 size, 3 visual variants) — v2.1
- ✓ Hotspot 컴포넌트 (3 variants with animation) — v2.1
- ✓ NavBar, NavItem, SectionHeader, Tabs — v2.1
- ✓ ArtistCard, StatCard, SpotCard, ShopCarouselCard — v2.1
- ✓ Badge, LeaderItem, RankingItem, SpotDetail — v2.1
- ✓ OAuthButton, GuestButton, Divider, LoginCard — v2.1
- ✓ LoadingSpinner, SkeletonCard, BottomSheet — v2.1
- ✓ Visual QA with Playwright — v2.1

**v3.0 Admin Panel:**

- ✓ Admin route protection (middleware + is_admin) — v3.0
- ✓ Admin layout (dark sidebar, 5 nav links) — v3.0
- ✓ Dashboard (KPI cards, traffic chart, today summary) — v3.0
- ✓ AI Audit (list, detail modal, inline editing, status filter) — v3.0
- ✓ AI Cost Monitoring (token charts, API calls, model cost table) — v3.0
- ✓ Pipeline Logs (accordion detail, retry, status filter) — v3.0
- ✓ Server Logs (log table, filters, terminal streaming) — v3.0

**v4.0 Spec Overhaul — AI-Ready Documentation:**

- ✓ 기존 spec 아카이빙 (specs/\_archive/v2.1.0/) — v4.0
- ✓ spec 포맷/구조 재설계 (EARS 구문, mobile-first, 200-line limit) — v4.0
- ✓ 5개 공유 기반 문서 (component-registry, data-models, api-contracts, store-map, injection-guide) — v4.0
- ✓ 5개 유저 플로우 문서 (discovery, detail, creation, user, VTON draft) — v4.0
- ✓ 14개 화면 spec 재작성 (detail 4, discovery 4, creation 3, user 3) — v4.0
- ✓ 4개 차기 버전 초안 (service identity, VTON, dynamic UI, commerce bridge) — v4.0
- ✓ 기존 번들 spec 파일 retire + clean structure — v4.0

**v5.0 AI Magazine:**

- ✓ Magazine theme system (#eafd67) + LayoutJSON types + mock data — v5.0
- ✓ MagazineRenderer layout engine + 6 magazine components (GSAP orchestration) — v5.0
- ✓ Daily editorial page (/magazine) + NavBar integration — v5.0
- ✓ 3D Bookshelf collection page (/collection) with CSS perspective — v5.0
- ✓ Decoding Ritual animation (/magazine/personal) — v5.0
- ✓ Main page Cinema-to-Action renewal (Hero tilt/glow, MasonryGrid parallax, SmartNav) — v5.0
- ✓ Spline Pro 3D Studio collection room (studioStore, bridges, overlays, WebGL fallback) — v5.0

**v8.0 Monorepo Consolidation & Bun Migration:**

- ✓ Backend subtree 병합 (packages/api-server/, git history 보존) — v8.0
- ✓ Yarn 4 → bun 1.3.10 패키지 매니저 전환 — v8.0
- ✓ Turborepo 빌드 오케스트레이션 도입 — v8.0
- ✓ 통합 개발환경 구성 — v8.0

### Active

**v9.0 Type-Safe API Generation (Shipped):**

- [x] Orval + Zod 코드 생성 파이프라인 구축 — Phase 39-40 완료
- [x] 백엔드 OpenAPI spec 기반 타입/클라이언트 자동 생성 — Phase 40 완료
- [x] 기존 수동 API 호출 코드를 생성 코드로 교체 — Phase 41-42 완료
- [x] CI hardening + tooling — Phase 43 완료

**v10.0 Profile Page Completion (Shipped):**

- ✓ Tries/Saved 활동 탭 구현 — Phase 48-50 완료
- ✓ 팔로우 시스템 (Followers/Following) — Phase 46-47 완료
- ✓ 다른 유저 프로필 페이지 (/profile/[userId]) — Phase 45 완료
- ✓ Auth guard — 미로그인 시 리다이렉트 — Phase 44 완료

**v11.0 Explore & Editorial Data Integration:**

- [ ] Editorial 데이터 검증 — magazine_id post 반환 확인, 자동화 연동
- [ ] Explore/Editorial 상세페이지 연결 — 사이드 드로어 → 풀 디스플레이
- [ ] 카드에 spot/solution 정보 표시

**v7.0 Sticker Canvas (paused):**

- [ ] Sticker-bomb 콜라주 레이아웃 (다크 캔버스, 폴라로이드/스티커 카드)
- [ ] ReactBits StickerPeel 인터랙션 (스티커 벗기기 효과)
- [ ] 매거진 컷아웃 타이포 + 네온 악센트 + 말풍선 가격태그
- [ ] 기존 데이터 연동 (/lab/main-d 독립 경로)

### Out of Scope

- 태그/키워드 관리 (A-01) — v3.1로 미루기
- 콘텐츠 모더레이션 (A-02) — v3.1로 미루기
- 지급 관리 (A-03) — v3.1로 미루기
- 실시간 알림 — 별도 마일스톤
- 컴포넌트 통합 (15 orphaned) — v2.2로 미루기
- spec 자동 검증 도구 — v4.1로 미루기
- VTON 기능 구현 — PoC 결과 후 별도 마일스톤에서 진행

## Context

- **프로젝트 초기화**: 2026-01-23
- **v1.0 shipped**: 2026-01-29
- **v1.1 shipped**: 2026-01-29
- **v2.0 shipped**: 2026-02-05
- **v2.1 shipped**: 2026-02-06
- **v3.0 shipped**: 2026-02-19
- **v4.0 shipped**: 2026-02-20
- **v5.0 shipped**: 2026-03-12
- **코드베이스**: Next.js 16 + React 18 + TypeScript 5.9 + Supabase + Spline Pro
- **백엔드**: Rust 1.91 (Axum 0.8, SeaORM 1.1, Meilisearch, Cloudflare R2, gRPC)
- **백엔드**: packages/api-server/ (Rust/Axum, subtree merged from decodedcorp/backend)
- **백엔드 API**: https://dev.decoded.style (OpenAPI spec 완비)
- **패키지 매니저**: bun 1.3.10 + Turborepo
- **레포**: https://github.com/decodedcorp/decoded-monorepo

## Constraints

- **호환성**: gstack + Superpowers 하네스 워크플로우 준수
- **API 우선**: 백엔드 API 스펙을 따름 (프론트엔드 맞춤)
- **점진적 마이그레이션**: Supabase 직접 쿼리 → REST API로 전환

## Key Decisions

| Decision                                           | Rationale                                          | Outcome    |
| -------------------------------------------------- | -------------------------------------------------- | ---------- |
| .planning/codebase/를 진실 소스로                  | AI 생성, 최신 상태 유지                            | ✓ Good     |
| 빈 스펙 폴더 정리                                  | 혼란 감소, 유지보수성 향상                         | ✓ Good     |
| CLAUDE.md 간결화                                   | 토큰 효율성                                        | ✓ Good     |
| SSOT 원칙 확립                                     | 문서 충돌 방지                                     | ✓ Good     |
| CVA 패턴 사용                                      | 일관된 컴포넌트 variant 시스템                     | ✓ Good     |
| Playwright Visual QA                               | 디자인 일관성 자동 검증                            | ✓ Good     |
| Tech debt 수용 (v2.1)                              | 컴포넌트 생성이 주 목표, 통합은 점진적             | ⚠️ Revisit |
| Admin layout separate from main app                | 독립 레이아웃 — 공유 header/footer 없음            | ✓ Good     |
| Defense-in-depth admin auth                        | Middleware + layout server-side double-check       | ✓ Good     |
| djb2 deterministic mock data                       | 새로고침 시 flickering 방지                        | ✓ Good     |
| Admin API: bare entity response                    | No { data: } wrapper — hook generic 매칭           | ✓ Good     |
| Admin API: no NODE_ENV bypass                      | 모든 환경에서 인증 강제                            | ✓ Good     |
| Recharts for admin charts                          | AreaChart, BarChart 시각화                         | ✓ Good     |
| Supabase MCP 연결                                  | API 탐색 및 타입 생성 용이                         | — Pending  |
| Pencil MCP로 디자인 → 코드                         | decoded.pen 디자인 시스템 구현                     | — Pending  |
| EARS syntax for spec requirements                  | 일관된 요구사항 표현 ("When/the system shall")     | ✓ Good     |
| Mobile-first spec ordering                         | 모바일 와이어프레임 우선, 데스크탑은 delta         | ✓ Good     |
| 200-line spec limit                                | 컨텍스트 윈도우 효율성, 300 max with justification | ✓ Good     |
| injection-guide as SSOT for AI loading             | README와 중복 없이 단일 소스                       | ✓ Good     |
| NEXT-\* DRAFT guardrail                            | 미승인 spec의 실수 구현 방지                       | ✓ Good     |
| Verified file paths in all specs                   | Stale path 참조 오류 원천 방지                     | ✓ Good     |
| LayoutJSON-driven magazine renderer                | 데이터로 레이아웃 정의, 컴포넌트 재사용 극대화     | ✓ Good     |
| Self-hosted Spline scene (.splinecode)             | CDN CORS 회피, 로딩 안정성                         | ✓ Good     |
| studioStore semantic actions (focusIssue/unfocus)  | Consumer API 간결화, raw setter 은닉               | ✓ Good     |
| SplineStudio as composition root                   | 3D 캔버스 + 2D HTML 오버레이 단일 컨테이너         | ✓ Good     |
| Prop-less IssueDetailPanel (studioStore 직접 참조) | Prop drilling 제거, 독립 렌더링                    | ✓ Good     |
| SmartNav via ConditionalNav                        | 라우트별 appearance 분기 (transparent/solid)       | ✓ Good     |
| Monorepo merge via git subtree                     | Git history 보존하면서 단일 레포로 통합            | ✓ Good     |
| Yarn 4 → bun migration                             | 더 빠른 설치/빌드, 통합 런타임                     | ✓ Good     |
| Turborepo for build orchestration                  | 프론트/백 독립 빌드 + 캐싱, CI 효율화              | ✓ Good     |
| Backend stays outside bun workspace                | Cargo workspace는 독립 — bun은 JS 패키지만 관리    | ✓ Good     |
| Fragment wrap for large JSX components              | TS children inference limit 우회                   | ✓ Good     |
| middleware.ts → proxy.ts                            | Next.js 16 convention                              | ✓ Good     |

---

_Last updated: 2026-04-01 after v11.0 milestone started — Explore & Editorial Data Integration_
