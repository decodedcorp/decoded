# Harness Memory & Docs Delta Update Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** main 브랜치 기준으로 메모리, docs/agent/, .planning/codebase/, CLAUDE.md를 현재 코드베이스와 동기화

**Architecture:** 4개 독립 영역을 병렬 에이전트로 동시 실행. 각 에이전트는 기존 파일을 읽고 코드베이스 스캔 결과와 비교하여 델타만 적용.

**Tech Stack:** Markdown, Git, Supabase (schema reference)

---

## Task 1: Memory Cleanup & Update

**Files:**
- Delete: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_current_milestone_v10.md`
- Delete: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_main_page_redesign.md`
- Modify: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_current_milestone_v11.md`
- Modify: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_main_page_renewal.md`
- Create: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_seed_ops_admin.md`
- Create: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_seo_infrastructure.md`
- Modify: `~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/MEMORY.md`

- [ ] **Step 1: 빈 파일 삭제**

```bash
rm ~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_current_milestone_v10.md
rm ~/.claude-pers/projects/-Users-kiyeol-development-decoded-decoded-monorepo/memory/project_main_page_redesign.md
```

- [ ] **Step 2: project_current_milestone_v11.md 업데이트**

v1.0.1 이후 완료된 작업 반영. "다음 작업 3건" 섹션을 업데이트:
- ~~메인페이지 editorial/trending 디자인~~ → #111 editorial section redesign 완료 (slider, Style Moods, Trending Now)
- ~~관리자 페이지 마이그레이션~~ → #125 seed-ops migration 완료 (entity management, seed pipeline, audit log)
- ~~Meilisearch *_id 인덱싱~~ → 완료 (04/06)

v1.0.1 이후 추가 완료 항목 추가:
- SEO 인프라 (#115): sitemap, robots, metadata, structured data, OG image
- News reference pipeline (#117): 뉴스 참조 기반 에디토리얼 생성
- 이미지 최적화 (#122): Next.js 최적화, 블러 중복 로드 제거
- Hero hotfix (#124): 진입 애니메이션 race condition 수정
- Auto-extract context (#106): Ollama Gemma4 vision으로 post context/style_tags 자동 추출
- CI: Claude Code auto PR review (#116)
- decoded_picks 테이블 추가 (picks 큐레이션)

현재 상태를 "v1.0.1 이후 안정화 완료, 다음 마일스톤 미정"으로 업데이트.

- [ ] **Step 3: project_main_page_renewal.md 업데이트**

editorial section redesign (#111) 반영:
- Editorial Slider 추가
- Style Moods 섹션 추가
- Trending Now 카루셀 추가
- home-dynamic-sections.tsx 분리
- SEO: sitemap.ts, robots.ts, OG image route 추가

- [ ] **Step 4: project_seed_ops_admin.md 신규 생성**

```markdown
---
name: Seed-ops admin migration
description: seed-ops에서 모노레포로 이관된 admin 기능 — entity management, seed pipeline, audit log, decoded picks
type: project
---

## Admin Entity Management (2026-04-09 기준)

PR #125로 seed-ops → 모노레포 마이그레이션 완료.

### 신규 Admin 페이지
- /admin/entities/artists — 아티스트 CRUD (paginated, searchable)
- /admin/entities/brands — 브랜드 CRUD
- /admin/entities/group-members — 그룹 멤버 목록
- /admin/seed/candidates — 시드 후보 관리
- /admin/seed/candidates/[id] — 개별 후보 승인/거절
- /admin/seed/post-images — 시드 포스트 이미지
- /admin/seed/post-spots — 시드 포스트 스팟
- /admin/review — 콘텐츠 리뷰
- /admin/audit-log — 감사 로그 뷰어
- /admin/picks — Decoded Picks 큐레이션

### 신규 Admin API
- /api/admin/entities/{artists,brands,group-members} — Entity CRUD
- /api/admin/candidates/* — 후보 관리 (approve/reject)
- /api/admin/bulk — 벌크 작업
- /api/admin/audit-log — 감사 로그
- /api/admin/post-images, post-spots — 이미지/스팟 관리
- /api/admin/review — 리뷰

### decoded_picks 테이블
public.decoded_picks — 날짜별 큐레이션 픽 (post_id FK, pick_date unique, curated_by default 'ai')

**Why:** decoded-seed-ops 별도 앱에서 관리하던 기능을 모노레포로 통합하여 단일 배포 파이프라인으로 운영.

**How to apply:** Admin 기능 추가/수정 시 /api/admin/ 패턴 따르고, checkIsAdmin() 인증 필수. audit log 자동 기록.
```

- [ ] **Step 5: project_seo_infrastructure.md 신규 생성**

```markdown
---
name: SEO infrastructure
description: Next.js SEO 인프라 — sitemap, robots, metadata, structured data, OG image 동적 생성
type: project
---

## SEO Infrastructure (2026-04-07, PR #115)

### 구성 요소
- `app/sitemap.ts` — 동적 XML sitemap (active posts + 정적 페이지)
- `app/robots.ts` — robots.txt (allow: /, /posts/, /explore, /search; disallow: /api/, /admin/, /lab/)
- `app/api/og/route.tsx` — OG image 동적 생성 (title, artist, background image)
- `app/layout.tsx` — 글로벌 metadata 강화
- `app/posts/[id]/page.tsx` — 포스트별 structured data (JSON-LD)

### 패턴
- sitemap은 Supabase에서 active 포스트 목록 fetch
- OG image는 Edge Runtime에서 동적 렌더링
- 각 페이지에 metadata export로 title/description/og 설정

**Why:** decoded.style 검색엔진 노출을 위한 기본 SEO 인프라 구축.

**How to apply:** 새 공개 페이지 추가 시 sitemap.ts에 URL 추가, metadata export 포함, 필요시 structured data 추가.
```

- [ ] **Step 6: MEMORY.md 인덱스 업데이트**

빈 파일 2개 제거, 신규 2개 추가, v11 설명 업데이트:

```markdown
- [Secrets handling](feedback_secrets_handling.md) — 민감 정보는 채팅에 붙여넣지 않도록 안내, gh secret set 등 사용
- [Parallel agents](feedback_parallel_agents.md) — 독립 작업은 병렬 background agent로 동시 실행 선호
- [Harness tool guidance](feedback_harness_usage.md) — 작업별 하니스 추천 (gstack/Superpowers/OMC/GSD)
- [Monorepo backend + DB schema](project_monorepo_backend.md) — FK DTO 노출 완료, warehouse RLS 주의, brand=solution.metadata
- [Orval+Zod pipeline](project_orval_zod_pipeline.md) — Orval 8.5.3 + Zod, bun run generate:api로 타입 재생성
- [Main page structure](project_main_page_renewal.md) — Editorial slider, Style Moods, Trending Now 카루셀 (04/09)
- [v11.0 shipped → 안정화 완료](project_current_milestone_v11.md) — v11.0+v1.0.1 출시, 잔여작업 모두 완료
- [Seed-ops admin](project_seed_ops_admin.md) — entity management, seed pipeline, audit log, decoded picks
- [SEO infrastructure](project_seo_infrastructure.md) — sitemap, robots, OG image, structured data
- [PRD 배포 환경](project_prd_deployment.md) — Supabase(womgfy)/Vercel, v1.0.1 PRD gotcha 목록
- [Git workflow v2](project_git_workflow_v2.md) — main=프로덕션, dev에서 작업 후 PR 머지
- [Meilisearch 검색](project_meilisearch_search.md) — 한글 검색, *_id 인덱싱, synonyms fallback
- [Supabase typegen](project_supabase_typegen.md) — types.ts 재생성 명령어, drift 해소 완료
- [gstack sprint workflow](reference_gstack_workflow.md) — Garry Tan gstack 30+ 스킬, Think→Ship 사이클
- [ECC 비교 결과](reference_ecc_comparison.md) — 70% 적용됨, bash audit log만 미적용
```

---

## Task 2: docs/agent/ Delta Update

**Files:**
- Modify: `docs/agent/web-routes-and-features.md`
- Modify: `docs/agent/api-v1-routes.md`
- Modify: `docs/agent/web-hooks-and-stores.md`
- Modify: `docs/agent/warehouse-schema.md`

- [ ] **Step 1: web-routes-and-features.md 업데이트**

기존 파일을 읽고 아래 신규 라우트를 적절한 섹션에 추가:

**Admin 섹션에 추가:**
- `/admin/login` — Admin 로그인
- `/admin/picks` — Decoded Picks 큐레이션
- `/admin/audit-log` — 감사 로그 뷰어
- `/admin/review` — 콘텐츠 리뷰
- `/admin/seed/candidates` — 시드 후보 목록
- `/admin/seed/candidates/[id]` — 개별 후보 상세
- `/admin/seed/post-images` — 시드 포스트 이미지
- `/admin/seed/post-spots` — 시드 포스트 스팟
- `/admin/entities/artists` — 아티스트 관리
- `/admin/entities/brands` — 브랜드 관리
- `/admin/entities/group-members` — 그룹 멤버 관리

**SEO 섹션 신규 추가:**
- `/sitemap.ts` — 동적 sitemap
- `/robots.ts` — robots.txt
- `/api/og` — OG image 동적 생성

**Auth 섹션 신규 추가:**
- `/api/auth/callback` — OAuth 콜백
- `/api/auth/session` — 서버 세션 설정

- [ ] **Step 2: api-v1-routes.md 업데이트**

기존 파일을 읽고 변경분 반영:

**변경:**
- `/api/v1/search` → `/api/v1/search/[[...path]]` (catch-all proxy)

**신규 추가:**
- `/api/v1/admin/picks` — Decoded Picks 목록
- `/api/v1/admin/picks/[pickId]` — 개별 Pick CRUD

**Admin API 섹션에 추가 (별도 /api/admin/ 라우트):**
- `/api/admin/entities/*` — Entity CRUD
- `/api/admin/candidates/*` — 후보 관리
- `/api/admin/bulk` — 벌크 작업
- `/api/admin/audit-log/*` — 감사 로그
- `/api/admin/post-images`, `/api/admin/post-spots` — 시드 관리
- `/api/admin/review` — 리뷰

- [ ] **Step 3: web-hooks-and-stores.md 업데이트**

기존 파일을 읽고 최근 수정/추가된 훅 반영:

**확인 대상 (4/4 이후 수정):**
- `useAdminPicks` — 신규 admin 훅
- `useSolutions` — 업데이트
- `useImages` — 업데이트
- `useFlipTransition` — 업데이트

스토어 섹션은 변경 없음 확인 (10개 스토어 동일).

- [ ] **Step 4: warehouse-schema.md 업데이트**

기존 파일을 읽고 seed-ops 관련 변경 확인:
- `decoded_picks` 테이블 추가 (public schema)
- seed_posts 관련 테이블/뷰 변경 여부 확인

---

## Task 3: .planning/codebase/ Delta Update

**Files:**
- Modify: `/.planning/codebase/STACK.md`
- Modify: `/.planning/codebase/ARCHITECTURE.md`
- Modify: `/.planning/codebase/STRUCTURE.md`

- [ ] **Step 1: STACK.md 버전 확인 및 업데이트**

기존 파일을 읽고 현재 package.json 버전과 비교:

| 패키지 | 현재 버전 |
|--------|----------|
| next | ^16.2.1 |
| react | 19 |
| @tanstack/react-query | ^5.90.11 |
| zustand | ^5.0.12 |
| tailwindcss | ^3.4.18 |
| gsap | ^3.13.0 |
| motion | ^12.23.12 |
| @supabase/supabase-js | ^2.86.0 |
| @playwright/test | ^1.58.1 |
| eslint | 10 |

변경된 버전만 업데이트.

- [ ] **Step 2: ARCHITECTURE.md 업데이트**

기존 파일을 읽고 신규 레이어/모듈 추가:
- **SEO Layer**: sitemap, robots, OG image, structured data
- **Admin Entity Management**: seed-ops에서 이관된 entity CRUD, seed pipeline, audit log
- **Auth Flow**: OAuth callback + server session 패턴
- **News Reference Pipeline**: 뉴스 참조 기반 에디토리얼 생성
- **AI Vision**: Ollama Gemma4로 post context/style_tags 자동 추출

- [ ] **Step 3: STRUCTURE.md 업데이트**

기존 파일(4/2 작성)을 읽고 이후 추가된 디렉토리/파일 반영:
- `app/api/admin/entities/` — Entity CRUD routes
- `app/api/admin/candidates/` — Candidate management
- `app/api/admin/audit-log/` — Audit log
- `app/api/admin/bulk/` — Bulk operations
- `app/api/auth/` — Auth routes
- `app/api/og/` — OG image
- `app/sitemap.ts`, `app/robots.ts`
- `app/admin/entities/`, `app/admin/seed/`, `app/admin/audit-log/`, `app/admin/review/`, `app/admin/picks/`

---

## Task 4: CLAUDE.md Verification & Update

**Files:**
- Modify: `/CLAUDE.md` (project root)

- [ ] **Step 1: Overview 섹션 검증**

현재 Overview:
> "image/item discovery and curation with behavioral intelligence, editorial magazine system, virtual try-on (VTON), admin dashboard, and design system (v2.0). AI-powered item detection, social actions, personalization, collection/studio."

추가 필요 여부 확인: SEO, seed pipeline, news reference pipeline — 이미 "admin dashboard"에 포함되는지 판단. 필요시 간결하게 추가.

- [ ] **Step 2: Tech stack one-line 검증**

현재:
> "Next.js 16.2 / React 19 / TypeScript 5.9 · Tailwind 3.4 · Zustand · TanStack Query 5.90 · Supabase · GSAP/Motion · Playwright 1.58 · ESLint v10 flat · bun · Node 22+ · Rust API (Axum 0.8) · Python AI (gRPC)"

package.json 기준으로 버전 정확성 확인. 변경 필요시 업데이트.

- [ ] **Step 3: docs/agent/ 테이블 참조 검증**

현재 테이블이 실제 파일과 1:1 매칭되는지 확인. 누락된 문서 없는지 체크.

- [ ] **Step 4: Generated API Code 섹션 검증**

Orval 버전, config 경로, gitignore 상태 등이 현재와 맞는지 확인.

---

## Execution Strategy

4개 Task를 **병렬 background agent**로 동시 실행:
- Task 1 (Memory) — 메모리 파일은 git 외부이므로 독립 실행
- Task 2 (docs/agent/) — 코드 스캔 후 문서 수정
- Task 3 (.planning/codebase/) — 코드 스캔 후 문서 수정
- Task 4 (CLAUDE.md) — 검증 후 필요시 수정

완료 후 메인에서 취합 리뷰 → git commit.
