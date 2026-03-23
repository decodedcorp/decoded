# Roadmap: decoded-app

## Milestones

- [x] **v1.0 Documentation Optimization** - Phases 1-5 (shipped 2026-01-29)
- [x] **v1.1 Full API Integration** - Phase 6 + Tracks A-D (shipped 2026-01-29)
- [x] **v2.0 Design Overhaul** - v2-Phases 1-9 (shipped 2026-02-05)
- [x] **v2.1 Design System Expansion** - v2.1-Phases 1-6 (shipped 2026-02-06)
- [x] **v3.0 Admin Panel — AI Management** — v3-Phases 01-06 (shipped 2026-02-19)
- [x] **v4.0 Spec Overhaul — AI-Ready Documentation** — v4-Phases 01-09 (shipped 2026-02-20)
- [x] **v5.0 AI Magazine & Archive Expansion** — m7-Phases 01-03 (shipped 2026-03-12)
- [ ] **v6.0 Behavioral Intelligence & Dynamic UI** — m8-Phases 01-03 (paused)
- [ ] **v7.0 Sticker Canvas** — m9-Phases 01-03 (paused)
- [x] **v8.0 Monorepo Consolidation & Bun Migration** — m10-Phases 01-04 (shipped 2026-03-23)
- [ ] **v9.0 Type-Safe API Generation** — Phases 39-43 (in progress)

## Phases

<details>
<summary>v1.0 Documentation Optimization (Phases 1-5) - SHIPPED 2026-01-29</summary>

See archived roadmap: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 Full API Integration (Phase 6 + Tracks A-D) - SHIPPED 2026-01-29</summary>

See archived roadmap: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>v2.0 Design Overhaul (v2-Phases 1-9) - SHIPPED 2026-02-05</summary>

See archived roadmap: `.planning/milestones/v2.0-ROADMAP.md`

</details>

<details>
<summary>v2.1 Design System Expansion (v2.1-Phases 1-6) - SHIPPED 2026-02-06</summary>

See archived roadmap: `.planning/milestones/v2.1-ROADMAP.md`

</details>

<details>
<summary>v3.0 Admin Panel — AI Management (v3-Phases 01-06) — SHIPPED 2026-02-19</summary>

See archived roadmap: `.planning/milestones/v3.0-ROADMAP.md`

</details>

<details>
<summary>v4.0 Spec Overhaul — AI-Ready Documentation (v4-Phases 01-09) — SHIPPED 2026-02-20</summary>

See archived roadmap: `.planning/milestones/v4.0-ROADMAP.md`

</details>

<details>
<summary>✅ v5.0 AI Magazine & Archive Expansion (m7-Phases 01-03) — SHIPPED 2026-03-12</summary>

See archived roadmap: `.planning/milestones/v5.0-ROADMAP.md`

- [x] Phase m7-01: Magazine Frontend — Mock-First (5/5 plans) — completed 2026-03-05
- [x] Phase m7-02: Main Page Renewal — Playful Magazine Landing (3/3 plans) — completed 2026-03-05
- [x] Phase m7-03: The Decoded Studio — Spline Pro 3D Collection (3/3 plans) — completed 2026-03-12

</details>

### v6.0 Behavioral Intelligence & Dynamic UI (Paused)

**Milestone Goal:** 행동 데이터 수집부터 추천, 동적 UI까지 풀 파이프라인 구축 — 유저 행동 기반 개인화 경험 제공

- [x] **Phase m8-01: Event Tracking Infrastructure** - 클라이언트 이벤트 큐, API 수집 파이프라인, 소셜 UI 클린업 (completed 2026-03-12)
- [ ] **Phase m8-02: Preference Scoring & Personalized Feed** - 선호도 집계, 추천 엔드포인트, "For You" 피드
- [ ] **Phase m8-03: Dynamic UI & Magazine Personalization** - MasonryGrid 레이아웃 분기, 개인화 매거진, 검색 갭 어드민 위젯

### v7.0 Sticker Canvas (Paused)

**Milestone Goal:** ReactBits StickerPeel 애니메이션과 sticker-bomb 콜라주 스타일로 메인페이지 D안 구현 — `/lab/main-d` 경로에서 독립 개발

- [x] **Phase m9-01: Canvas Scaffold & Data Wiring** - 다크 캔버스 기반, 폴라로이드 카드 scatter, 실데이터 연동 (completed 2026-03-19)
- [ ] **Phase m9-02: StickerPeel Interactivity & Drag** - StickerPeel 효과, hover lift, GSAP Draggable, peel-to-reveal
- [ ] **Phase m9-03: Visual Polish** - 워드마크, 네온 악센트, 말풍선 가격태그, 테이프 데코레이터

### v8.0 Monorepo Consolidation & Bun Migration (In Progress)

**Milestone Goal:** Backend Rust/Axum 레포를 모노레포에 subtree 병합하고, Yarn 4 → bun 전환 + Turborepo 도입으로 통합 개발환경 구성 — `bunx turbo dev` 한 명령으로 프론트+백 동시 기동

- [ ] **Phase m10-01: Package Manager Migration** - Yarn 4 → bun 전환, lockfile 마이그레이션, GSAP 레지스트리 픽스
- [ ] **Phase m10-02: Backend Repository Merge** - git subtree로 backend 코드를 packages/api-server/에 병합, history 보존
- [ ] **Phase m10-03: Turborepo Integration & Unified Dev** - turbo.json 설정, backend thin wrapper, bunx turbo dev 통합 기동
- [ ] **Phase m10-04: Docker & CI/CD Unification** - docker-compose 루트 통합, path-based GitHub Actions 워크플로우

### 🚧 v9.0 Type-Safe API Generation (In Progress)

**Milestone Goal:** Orval + Zod를 사용하여 백엔드 OpenAPI spec에서 타입 안전한 API 클라이언트를 자동 생성하고, 기존 수동 API 호출 코드를 완전 교체

- [x] **Phase 39: Setup and Spec Validation** - Orval 설치, OpenAPI spec 검증, operationId/nullable 이슈 해결 (completed 2026-03-23)
- [x] **Phase 40: Codegen Pipeline and Custom Mutator** - 커스텀 mutator 구현, orval.config.ts 완성, 스모크 테스트 (completed 2026-03-23)
- [x] **Phase 41: Read Hook Migration** - GET 엔드포인트 도메인별 순차 마이그레이션 (badges → admin) (completed 2026-03-23)
- [ ] **Phase 42: Mutation Migration and Cache Wiring** - POST/PATCH/DELETE 마이그레이션, Zustand 동기화, 수동 코드 삭제
- [ ] **Phase 43: CI Hardening and Tooling** - CI drift 감지, .gitignore, Zod 검증 테스트, 에이전트 문서화

## Phase Details

### Phase m8-01: Event Tracking Infrastructure

**Goal**: 유저 행동이 비동기적으로 기록되며 UI 성능에 영향 없이 Supabase에 저장된다 — 미구현 소셜 연동 UI 제거
**Depends on**: Nothing (first phase of v6.0)
**Requirements**: TRACK-01, TRACK-02, TRACK-03, TRACK-04, CLEAN-01
**Success Criteria** (what must be TRUE):

1. 유저가 포스트를 클릭하거나 카테고리를 필터링하면 해당 이벤트가 Supabase `user_events` 테이블에 자동으로 기록된다
2. 유저가 피드 카드를 3초 이상 바라보면 체류시간 이벤트가 기록된다 (IntersectionObserver 기반)
3. 유저가 페이지를 스크롤하면 25/50/75/100% 도달 시 스크롤 깊이 이벤트가 기록된다
4. 이벤트 전송이 UI 인터랙션을 블로킹하지 않는다 — 20개 누적 또는 30초 타이머에 sendBeacon으로 일괄 전송된다
5. 프로필 페이지의 DataSourcesCard에서 인스타그램/핀터레스트 연동 버튼이 제거된다
   **Plans**: 4 plans

Plans:

- [ ] m8-01-01: DB 스키마 + API 인제스트 엔드포인트 (`user_events` 테이블, RLS, `/api/v1/events` route)
- [ ] m8-01-02: `behaviorStore` + `useTrackEvent` 훅 (클라이언트 큐, flush 로직, sendBeacon)
- [ ] m8-01-03: 이벤트 연결 — FeedCard 체류시간, 스크롤 깊이, 클릭/검색/필터 이벤트 삽입
- [ ] m8-01-04: DataSourcesCard 소셜 연동 UI 제거 + CLEAN-01 검증

### Phase m8-02: Preference Scoring & Personalized Feed

**Goal**: 누적된 이벤트로부터 유저 선호도가 자동 계산되며, 충분한 데이터를 가진 로그인 유저에게 메인페이지에 "For You" 개인화 피드가 표시된다
**Depends on**: Phase m8-01
**Requirements**: RECOM-01, RECOM-02, RECOM-03
**Success Criteria** (what must be TRUE):

1. 유저의 카테고리/아티스트 선호도가 30일 롤링 윈도우 기반 SQL 스코어링으로 자동 집계된다 (`user_preferences` 테이블)
2. 이벤트 20개 미만인 유저에게는 메인페이지에 에디토리얼/트렌딩 기본 피드가 표시된다 (기존 경험 유지)
3. 이벤트 20개 이상인 로그인 유저에게는 메인페이지에 "For You" 개인화 피드가 표시된다
4. 추천 API 실패 또는 데이터 부족 시 기본 피드로 자동 폴백된다 (에러 없이)
   **Plans**: TBD

Plans:

- [ ] m8-02-01: 선호도 집계 레이어 — Supabase RPC `aggregate_user_preferences`, `user_preferences` 테이블, 30일 TTL
- [ ] m8-02-02: 추천 엔드포인트 — `/api/v1/recommendations` route, `personalizationStore`, `useRecommendedFeed` 훅
- [ ] m8-02-03: `HomeClient.tsx` 피드 분기 — `isPersonalized` 플래그 기반 개인화 피드 vs 기본 피드, SSR-safe hydration

### Phase m8-03: Dynamic UI & Magazine Personalization

**Goal**: 행동 데이터 기반으로 MasonryGrid 레이아웃이 유저 성향에 맞게 분기되며, `/magazine/personal`이 목 데이터 대신 유저 선호도 기반 콘텐츠를 표시한다. 검색 갭 정보가 어드민에 노출된다
**Depends on**: Phase m8-02
**Requirements**: DYNUI-01, DYNUI-02, DYNUI-03
**Success Criteria** (what must be TRUE):

1. 행동 데이터가 충분한 유저에게 메인페이지 MasonryGrid가 `dense` 또는 `editorial` 레이아웃 중 선호도에 맞는 형태로 렌더링된다
2. `/magazine/personal` 페이지가 mock LayoutJSON 대신 유저의 선호 카테고리/아티스트 기반 실제 콘텐츠를 표시한다
3. 어드민 패널에서 결과 0건 검색어 목록을 확인할 수 있다 (콘텐츠 확보 시그널로 활용)
   **Plans**: TBD

Plans:

- [ ] m8-03-01: MasonryGrid `layoutVariant` prop 연결 — `personalizationStore` 행동 페르소나 → `dense`/`editorial` 분기
- [ ] m8-03-02: `/magazine/personal` 실데이터 연결 — mock LayoutJSON 교체, 선호도 기반 콘텐츠 시퀀스
- [ ] m8-03-03: 어드민 검색 갭 위젯 — 0건 검색어 집계 쿼리 + 어드민 대시보드 노출

### Phase m9-01: Canvas Scaffold & Data Wiring

**Goal**: `/lab/main-d` 경로에 다크 캔버스 기반이 완성되고 실제 포스트/트렌딩 데이터가 폴라로이드 스티커 카드로 캔버스에 흩뿌려진다
**Depends on**: Nothing (first phase of v7.0)
**Requirements**: CANV-01, CANV-02, CANV-03, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):

1. `/lab/main-d` 경로를 방문하면 #0d0d0d 다크 배경에 SVG feTurbulence grain 텍스처가 적용된 캔버스가 렌더링된다
2. 실제 포스트 이미지가 흰 테두리 폴라로이드 카드 형태로 캔버스에 표시되며, 카드마다 고유한 회전 각도와 그림자가 적용된다
3. 페이지를 새로고침해도 카드 위치와 회전이 동일하게 유지된다 (djb2 시드 기반 deterministic scatter, SSR hydration-safe)
4. 하단 네비게이션이 표시되며 기존 `/lab/main-b` LabBottomNav 패턴을 재사용한다
5. 기존 서버 쿼리(posts, items, trending keywords)로 실제 데이터가 표시된다

**Plans**: 2 plans

Plans:

- [ ] m9-01-01-PLAN.md — Types, djb2 scatter engine, multi-post server query (CANV-03, DATA-01)
- [ ] m9-01-02-PLAN.md — Page route, MainPageD, PolaroidCard, BottomNav + visual verification (CANV-01, CANV-02, DATA-02)

### Phase m9-02: StickerPeel Interactivity & Drag

**Goal**: featured 카드에 StickerPeel 벗기기 효과가 적용되고, 모든 카드를 hover/드래그할 수 있으며 peel 뒷면에 아이템 정보가 표시된다
**Depends on**: Phase m9-01
**Requirements**: STKR-01, STKR-02, STKR-03, STKR-04
**Success Criteria** (what must be TRUE):

1. featured 카드 1~3장에 마우스를 올리면 ReactBits StickerPeel 벗기기 애니메이션이 실행된다
2. 모든 카드에 hover 시 카드가 위로 떠오르는 효과(scale + 그림자 강화 + z-index 상승)가 적용된다
3. 카드를 클릭하고 드래그하면 캔버스 내 위치가 변경되며, 놓으면 inertia throw로 자연스럽게 멈춘다 (GSAP Draggable + InertiaPlugin)
4. StickerPeel로 스티커를 벗기면 뒷면에 아이템 브랜드명, 가격, CTA 버튼이 표시된다

**Plans**: 2 plans

Plans:

- [ ] m9-02-01: ReactBits `StickerPeel` 컴포넌트 copy-paste 통합 + featured 카드 선정 로직
- [ ] m9-02-02: hover lift CSS 효과 + GSAP Draggable/InertiaPlugin 드래그 구현
- [ ] m9-02-03: peel-to-reveal 뒷면 — 아이템 상세 정보 레이아웃 + CTA 버튼

### Phase m9-03: Visual Polish

**Goal**: DECODED 워드마크, 네온 악센트, 말풍선 가격태그, 테이프 데코레이터가 적용되어 sticker-bomb 콜라주 미학이 완성된다
**Depends on**: Phase m9-02
**Requirements**: VISL-01, VISL-02, VISL-03, VISL-04
**Success Criteria** (what must be TRUE):

1. 캔버스 상단에 "DECODED" 매거진 컷아웃 워드마크가 표시되며 각 글자가 약간씩 어긋나 스티커 느낌을 준다
2. 네온 옐로우(#eafd67) 화살표, 커서, 하이라이트, 번개 SVG 데코레이터가 캔버스에 산재되어 있다
3. 아이템 카드 근처에 말풍선 형태의 가격태그 스티커가 브랜드명과 가격 정보를 표시한다
4. 카드에 테이프 스트립 또는 washi 보더 데코레이터가 적용되어 handmade 콜라주 질감이 완성된다

**Plans**: 2 plans

Plans:

- [ ] m9-03-01: `WordmarkDecoder` 컴포넌트 — 매거진 컷아웃 타이포그래피 (글자별 어긋남, 스티커 느낌)
- [ ] m9-03-02: 네온 악센트 SVG 데코레이터 세트 (화살표/커서/번개, #eafd67) + 캔버스 scatter 배치
- [ ] m9-03-03: 말풍선 가격태그 + 테이프/washi 데코레이터 컴포넌트 (카드 overlay)

### Phase m10-01: Package Manager Migration

**Goal**: Yarn 4가 완전히 제거되고 bun이 모든 JS 워크스페이스의 패키지 매니저로 자리잡는다 — bun.lock이 커밋되고 Next.js dev/build가 정상 동작한다
**Depends on**: Nothing (first phase of v8.0)
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04, PKG-05
**Success Criteria** (what must be TRUE):

1. `bun install`이 packages/web, packages/shared 전체에서 에러 없이 완료된다
2. `.yarnrc.yml`, `.yarn/` 디렉토리, `yarn.lock`이 레포에서 완전히 제거된다
3. `bun.lock` 파일이 생성되어 git에 추적되며 CI에서 `--frozen-lockfile`로 재현 가능하다
4. `bun run dev`로 Next.js dev 서버가 localhost:3000에서 정상 기동된다
5. `bun run build`로 프로덕션 빌드가 성공하고 GSAP Club 프라이빗 레지스트리 패키지가 포함된다

**Plans**: 2 plans

Plans:

- [ ] m10-01-01-PLAN.md — Config migration: root package.json, bunfig.toml, Yarn artifact removal, bun install (PKG-01, PKG-02, PKG-03)
- [ ] m10-01-02-PLAN.md — Dev/build verification + CLAUDE.md/README.md documentation update (PKG-04, PKG-05)

### Phase m10-02: Backend Repository Merge

**Goal**: Rust/Axum 백엔드 코드가 git history 보존 상태로 `packages/api-server/`에 병합되고, Cargo 빌드가 새 위치에서 독립적으로 성공한다
**Depends on**: Phase m10-01
**Requirements**: MERGE-01, MERGE-02, MERGE-03
**Success Criteria** (what must be TRUE):

1. `packages/api-server/`에 Rust 소스, Cargo.toml, Dockerfile이 존재하며 `git log packages/api-server/` 명령으로 원본 커밋 히스토리가 조회된다
2. `cd packages/api-server && cargo build`가 성공하고 백엔드 바이너리가 생성된다
3. Backend의 pre-push hooks와 justfile 경로가 모노레포 루트 기준으로 올바르게 수정되어 `cd packages/api-server && cargo test`가 실행된다

**Plans**: 2 plans

### Phase m10-03: Turborepo Integration & Unified Dev

**Goal**: Turborepo가 모든 패키지의 빌드를 오케스트레이션하며, `bunx turbo dev` 한 명령으로 Next.js 프론트엔드와 Rust 백엔드가 동시에 기동된다
**Depends on**: Phase m10-02
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, INFRA-01
**Success Criteria** (what must be TRUE):

1. `bunx turbo run build`가 shared → web/backend 순서로 전체 빌드를 실행하고 성공한다
2. `bunx turbo dev`를 실행하면 Next.js dev 서버와 Rust 백엔드가 동시에 기동된다
3. Turborepo 캐시가 packages/web과 packages/shared 빌드에서 hit되며, packages/api-server 빌드는 `cache: false`로 Cargo에 위임된다
4. packages/api-server/package.json에 `cargo build/dev/test/clippy`가 npm scripts로 선언되어 있으며 Turborepo가 이를 오케스트레이션한다
5. 통합 `.env.local.example`에 프론트엔드와 백엔드 환경변수가 모두 문서화되어 있다

**Plans**: 2 plans

### Phase m10-04: Docker & CI/CD Unification

**Goal**: 루트 docker-compose로 전체 스택을 단일 명령으로 기동할 수 있고, GitHub Actions가 변경된 패키지에 맞는 워크플로우만 실행한다
**Depends on**: Phase m10-03
**Requirements**: INFRA-02, INFRA-03, CICD-01, CICD-02, CICD-03
**Success Criteria** (what must be TRUE):

1. 루트 `docker-compose.dev.yml`에서 `docker compose up`으로 web + backend + Postgres + Meilisearch 전체 스택이 기동된다
2. Backend의 Docker 컨텍스트가 `packages/api-server/` 기준으로 동작하며 Dockerfile COPY 경로가 올바르다
3. frontend 파일만 변경된 PR에서는 backend-ci.yml이 실행되지 않고 frontend-ci.yml만 실행된다
4. backend-ci.yml에서 `cargo fmt --check`, `cargo clippy`, `cargo test`가 모두 통과한다
5. frontend-ci.yml에서 `bun install --frozen-lockfile`, `bunx turbo run build`, `bun run lint`가 모두 통과한다

**Plans**: 2 plans

### Phase 39: Setup and Spec Validation

**Goal**: OpenAPI spec이 Orval로 파싱 가능한 상태로 확인되고, 패키지가 설치되며 업로드 엔드포인트 제외 목록이 확정된다
**Depends on**: Nothing (first phase of v9.0)
**Requirements**: INFRA-01, SPEC-01, SPEC-02, SPEC-03, SPEC-05
**Success Criteria** (what must be TRUE):

1. `packages/web`에 `orval@^8.5.3`, `axios@^1.13.6`, `zod@^3.25`가 설치되고 `bun install`이 에러 없이 완료된다
2. 백엔드 OpenAPI spec의 버전(3.0 vs 3.1)이 확인되고, nullable 필드 이슈 여부가 문서화된다 — 3.1이면 전처리 스크립트 필요 여부가 결정된다
3. 전체 엔드포인트의 `operationId`가 감사되고, 중복/`Handler` suffix/`snake_case` 문제가 있으면 백엔드 PR 또는 config override로 해결 계획이 확정된다
4. 업로드/multipart 엔드포인트 목록(POST /posts/upload 등)이 명시적으로 나열되고 orval.config.ts 제외 목록 초안이 작성된다
5. 무한 스크롤 엔드포인트의 pagination 파라미터(`cursor`/`page`/`offset`)가 스펙에서 확인되어 문서화된다

**Plans**: 2 plans

Plans:

- [ ] 39-01-PLAN.md — Package installation (orval, axios, zod) + orval.config.ts skeleton with multipart exclusion (INFRA-01, SPEC-03)
- [ ] 39-02-PLAN.md — Download live spec + audit version/nullable/operationId/pagination (SPEC-01, SPEC-02, SPEC-05)

### Phase 40: Codegen Pipeline and Custom Mutator

**Goal**: 커스텀 mutator가 Supabase JWT를 주입하고 Next.js 프록시로 라우팅하며, `bun run generate:api` 한 명령으로 타입스크립트 코드가 생성되고 빌드가 통과한다
**Depends on**: Phase 39
**Requirements**: INFRA-02, INFRA-03, INFRA-04, INFRA-05, SPEC-04
**Success Criteria** (what must be TRUE):

1. `lib/api/mutator.ts`가 존재하며, 모든 생성 훅의 HTTP 요청에 Supabase JWT Bearer 토큰이 자동으로 포함된다
2. `bun run generate:api`를 실행하면 `lib/api/generated/`에 per-tag 훅 파일과 `model/` 디렉토리가 생성된다
3. `bun run typecheck`가 생성된 파일을 포함하여 에러 없이 통과한다
4. 단일 엔드포인트 스모크 테스트에서 Network 탭의 요청 URL이 이중 접두사(`/api/v1/api/v1/...`) 없이 올바르고, 응답 데이터가 기존 `lib/api/types.ts`의 타입과 일치한다
5. `turbo.json`에 `generate` 태스크가 선언되고 `build`/`typecheck` 이전에 실행되도록 파이프라인이 구성된다

**Plans**: 2 plans

Plans:

- [ ] 40-01-PLAN.md — Custom mutator + orval.config.ts hooks + .gitignore (INFRA-02, INFRA-04, INFRA-05)
- [ ] 40-02-PLAN.md — Turborepo pipeline + generate script + smoke test (INFRA-03, SPEC-04)

### Phase 41: Read Hook Migration

**Goal**: 모든 GET 엔드포인트가 생성된 `useQuery` 훅으로 교체되고, 각 도메인의 수동 API 파일이 삭제되며 타입 시스템이 `lib/api/generated/model/`을 SSOT로 사용한다
**Depends on**: Phase 40
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04, MIG-08
**Success Criteria** (what must be TRUE):

1. badges, rankings, categories 도메인에서 수동 `lib/api/*.ts` 파일이 삭제되고 해당 컴포넌트가 생성 훅으로 데이터를 표시한다
2. comments, spots, solutions 도메인에서 수동 파일이 삭제되고 생성 훅으로 교체된다 — 기존 컴포넌트 props는 변경되지 않는다
3. users, posts 도메인에서 수동 파일이 삭제되고 생성 훅으로 교체된다 — 포스트 목록, 상세, 유저 프로필이 정상 렌더링된다
4. admin 도메인(dashboard, ai-cost, audit, pipeline, server-logs)에서 수동 파일이 삭제되고 생성 훅으로 교체된다
5. `lib/api/types.ts`가 삭제되고 모든 타입이 `lib/api/generated/model/`에서 import된다 — 타입 중복 충돌이 import aliasing으로 해결된다

**Plans**: 4 plans

Plans:

- [ ] 41-01-PLAN.md — badges, rankings, categories Read 마이그레이션 + types.ts 타입 중복 감사 (MIG-01, MIG-08)
- [ ] 41-02-PLAN.md — comments, spots, solutions Read 마이그레이션 (MIG-02)
- [ ] 41-03-PLAN.md — users, posts Read 마이그레이션 (MIG-03)
- [ ] 41-04-PLAN.md — admin 도메인 Read 마이그레이션 + types.ts 삭제 (MIG-04, MIG-08)

### Phase 42: Mutation Migration and Cache Wiring

**Goal**: 모든 POST/PATCH/DELETE 훅이 생성 코드로 교체되고, Zustand 스토어 동기화와 React Query 캐시 무효화가 call site에서 올바르게 연결되며, 수동 API 코드가 완전히 제거된다
**Depends on**: Phase 41
**Requirements**: MIG-05, MIG-06, MIG-07, MIG-09
**Success Criteria** (what must be TRUE):

1. 모든 POST/PATCH/DELETE 훅이 생성된 `useMutation` 훅으로 교체되고 `onSuccess` 콜백이 call site에서 구현된다
2. `useUpdateProfile` 등 Zustand 스토어를 동기화하는 mutation의 `onSuccess`에서 스토어 업데이트가 여전히 실행된다 — 프로필 수정 후 헤더 아바타가 즉시 업데이트된다
3. `lib/api/client.ts`와 `lib/hooks/*.ts` wrapper 파일이 모두 삭제된다
4. Supabase 직접 쿼리와 Orval 생성 쿼리 간의 캐시 무효화 경계가 문서화되고 `queryClient.invalidateQueries()`가 필요한 지점에 명시적으로 배치된다

**Plans**: 2 plans

Plans:

- [ ] 42-01: Mutation 훅 마이그레이션 — POST/PATCH/DELETE, onSuccess 캐시 무효화 call site 이전 (MIG-05)
- [ ] 42-02: Zustand 스토어 동기화 패턴 보존 + 캐시 경계 문서화 (MIG-06, MIG-09)
- [ ] 42-03: 수동 코드 삭제 — lib/api/client.ts, lib/api/*.ts, lib/hooks/*.ts (MIG-07)

### Phase 43: CI Hardening and Tooling

**Goal**: spec 변경이 자동으로 감지되어 프론트엔드 CI가 실패하고, 생성 파일이 gitignore되며, Claude Code와 코드 리뷰어가 생성 파일을 올바르게 처리한다
**Depends on**: Phase 42
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05, TEST-01, TOOL-01, TOOL-02, TOOL-03
**Success Criteria** (what must be TRUE):

1. `packages/web/scripts/pre-push.sh`에 `bun run generate:api && git diff --exit-code`가 포함되어 스펙 drift가 있으면 push가 실패한다
2. `packages/web/lib/api/generated/`가 `.gitignore`에 추가되어 git에 추적되지 않으며, CI는 항상 spec에서 재생성한다
3. 백엔드 OpenAPI spec 변경 시 프론트엔드가 재생성해야 하는 트리거 프로세스가 문서화된다 (자동화 또는 수동 절차)
4. 마이그레이션 중 롤백 절차가 문서화된다 (git branching 전략 + pre-push 검증 체크포인트)
5. Zod 스키마가 실제 API 응답에 대해 검증 테스트를 통과한다 — 응답 shape mismatch가 런타임 에러 대신 Zod 에러로 포착된다
6. `lib/api/generated/`에 대한 직접 편집 시도를 감지하는 경고 메커니즘이 존재하고, CLAUDE.md에 생성 코드 규칙이 문서화된다

**Plans**: 2 plans

Plans:

- [ ] 43-01: .gitignore 업데이트 + CI drift 감지 (generate && git diff) + pre-push 통합 (CI-01, CI-02, CI-03)
- [ ] 43-02: 백엔드 spec 변경 트리거 프로세스 + 롤백 계획 문서화 (CI-04, CI-05)
- [ ] 43-03: Zod 스키마 검증 테스트 + TOOL-01/02/03 에이전트 문서화 (TEST-01, TOOL-01, TOOL-02, TOOL-03)

## Progress

**Execution Order:**
v8.0: m10-01 → m10-02 → m10-03 → m10-04
v9.0: 39 → 40 → 41 → 42 → 43

| Phase                                         | Milestone | Plans Complete | Status        | Completed  |
| --------------------------------------------- | --------- | -------------- | ------------- | ---------- |
| m8-01: Event Tracking Infrastructure          | v6.0      | 4/4            | Complete      | 2026-03-12 |
| m8-02: Preference Scoring & Personalized Feed | v6.0      | 0/3            | Not started   | -          |
| m8-03: Dynamic UI & Magazine Personalization  | v6.0      | 0/3            | Not started   | -          |
| m9-01: Canvas Scaffold & Data Wiring          | v7.0      | 0/2            | Planning done | -          |
| m9-02: StickerPeel Interactivity & Drag       | v7.0      | 0/3            | Not started   | -          |
| m9-03: Visual Polish                          | v7.0      | 0/3            | Not started   | -          |
| m10-01: Package Manager Migration             | v8.0      | 0/2            | Planning done | -          |
| m10-02: Backend Repository Merge             | v8.0      | 0/TBD          | Not started   | -          |
| m10-03: Turborepo Integration & Unified Dev   | v8.0      | 0/TBD          | Not started   | -          |
| m10-04: Docker & CI/CD Unification            | v8.0      | 0/TBD          | Not started   | -          |
| 39: Setup and Spec Validation                 | v9.0      | 0/2            | Planning done | -          |
| 40: Codegen Pipeline and Custom Mutator       | v9.0      | 0/2            | Planning done | -          |
| 41: Read Hook Migration                       | v9.0      | 0/TBD          | Not started   | -          |
| 42: Mutation Migration and Cache Wiring       | v9.0      | 0/TBD          | Not started   | -          |
| 43: CI Hardening and Tooling                  | v9.0      | 0/TBD          | Not started   | -          |

---

_Roadmap created: 2026-01-29_
_Last updated: 2026-03-23 (v9.0 Phases 39-43 added, 28 requirements mapped)_
