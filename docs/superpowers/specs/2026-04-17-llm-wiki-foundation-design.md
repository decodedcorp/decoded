---
title: LLM Wiki Foundation — Docs Consolidation & Agent Harness Schema (Phase 1)
date: 2026-04-17
owner: human
status: approved
issue: https://github.com/decodedcorp/decoded/issues/153
pr: https://github.com/decodedcorp/decoded/pull/223
phase: Sub-1 + Sub-2 (LLM Wiki Foundation)
related:
  - docs/README.md
  - docs/agent/README.md
  - .planning/codebase/ARCHITECTURE.md
  - CLAUDE.md
---

# LLM Wiki Foundation — Design (Phase 1)

## 1. Background

### Why this work

decoded-monorepo는 현재 4개 이상의 문서 소스가 공존한다. 루트 `CLAUDE.md`, `.cursor/rules/*.mdc`, `docs/agent/`, `docs/ai-playbook/`, `.planning/codebase/`. 각각 부분적으로 중복된 컨벤션·아키텍처·에이전트 규칙을 담고 있으며 "어느 파일이 정본인지"를 결정할 규칙이 없다. 이슈 #153는 이 상태를 정비하면서 Andrej Karpathy의 [LLM wiki 개념](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)(LLM이 markdown 위키를 자동 ingest/lint/update하는 3계층 구조)에서 영감을 얻어 에이전트 하네스 프로그래밍을 한 단계 업그레이드하는 것을 목표로 한다.

### Environment

- Claude Code (primary) + Cursor를 동시 사용하는 개발 환경
- solo 규모 팀, gstack / Superpowers / OMC / GSD 하네스 사용
- Next.js 16 / Rust API / Python AI 모노레포 (`packages/web`, `packages/api-server`, `packages/ai-server`, `packages/shared`, `packages/mobile`)

### Consolidated review findings (OMC critic + architect)

이 스펙은 초안 디자인에 대해 OMC `critic`과 `architect` 에이전트의 병렬 리뷰 결과를 반영해 작성되었다. 두 에이전트 모두 초안을 `REVISE` 판정했고, 공통 지적 10건을 수용했다. 주요 항목은 consolidation 계획 부재, `docs/` topic 폴더 distributed `agent.md` 패턴의 mixed-ownership 리스크, `.planning/codebase/`와의 관계 모호성, Karpathy `source/` 계층의 억지 적용, Sub-3 자동화 없는 dead scaffold 위험, ADR 누락, activity-shaped 성공 기준 등이다.

## 2. Goals & Non-goals

### Goals (Phase 1에서 반드시 달성)

1. `docs/` 내 LLM wiki의 **뼈대**(2계층: `wiki/` + `schema/`)를 세우고 SSOT 후보 파일을 확정한다.
2. 정보 카테고리별 **정본(SSOT) 매트릭스**를 `docs/wiki/schema/ownership-matrix.md`로 고정한다.
3. 기존 `CLAUDE.md`와 `.cursor/rules/*.mdc`의 중복 컨벤션을 `docs/wiki/schema/`로 **이관**하고 원 위치는 pointer로 축소한다.
4. 기존 `docs/agent/`를 topic summary 허브로 **확장**한다 (distributed `agent.md`는 채택하지 않는다).
5. 프론트매터·태그·링크 규약과 POC 샘플 1건을 포함한다.
6. Sub-3 (자동화)과 Sub-4 (하네스 전면 리팩토링)의 **계약(인터페이스)** 을 이 스펙의 부록으로 고정해 후속 phase가 규약 없이 표류하지 않게 한다.
7. ADR-0002로 본 결정을 기록해 롤백·개정 가능성을 열어 둔다.

### Non-goals (이번 phase 범위 밖)

- 프론트매터/링크 validator, ingest 스크립트, CI hook 구현 (Sub-3)
- `CLAUDE.md`, `.cursor/rules/` 전면 리팩토링 (Sub-4. 이번 phase는 "중복 섹션 이관"만)
- 기존 `docs/ai-playbook/` 내 stale 콘텐츠 감수 (Sub-4 또는 별도 이슈)
- `.planning/codebase/*` 자동 생성물의 재생성 및 LLM-write 자동화 (`/gsd:map-codebase`는 기존 흐름 유지)
- `wiki/wiki/**`의 본격적 콘텐츠 대량 작성 (POC 1건 외)

## 3. Confirmed Decisions (brainstorm 결과)

| #   | 결정           | 선택지                                                                            | 사유                                                             |
| --- | -------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1  | 주 독자        | Agent + Human 이중 독자                                                           | repo는 팀 온보딩 대상이며 `docs/README.md`가 이미 팀원 소비 전제 |
| D2  | 호스팅         | `docs/` primary, NotebookLM/Obsidian cloud 사용 안 함                             | LLM write 자동화와 Git 버전관리에 `docs/`가 가장 친화적          |
| D3  | 구조 접근      | 축소된 하이브리드 D — `docs/wiki/` 2계층 + `docs/agent/` 확장                     | distributed `agent.md` 리스크 회피, Karpathy 컨셉을 수정 수용    |
| D4  | LLM-write 경계 | Narrow — `docs/wiki/wiki/**`, `docs/agent/*-summary.md` (생성된 요약)만 LLM write | SSOT 혼란 최소화, PR 리뷰 부담 관리                              |
| D5  | 링크 포맷      | repo 상대 경로 (Obsidian wiki-link `[[]]`는 미채택)                               | GitHub 렌더링과 lint 도구 호환                                   |

## 4. Architecture — Directory Layout

```
docs/
├── README.md                      # (Human) 인덱스·역할 헌법 (기존, 갱신)
├── adr/
│   ├── ADR-0001-ai-dev-boilerplate.md
│   └── ADR-0002-llm-wiki-foundation.md        # 🆕 본 Phase 결정 기록
├── agent/                         # (Human) 에이전트 entry 맵 — 확장
│   ├── README.md                  # INDEX 역할, 이름 유지 (CLAUDE.md에서 참조)
│   ├── monorepo.md                # 기존
│   ├── web-routes-and-features.md # 기존
│   ├── api-v1-routes.md           # 기존
│   ├── web-hooks-and-stores.md    # 기존
│   ├── design-system-llm.md       # 기존
│   ├── warehouse-schema.md        # 기존 (substantive, 유지)
│   ├── e2e-testing.md             # 기존
│   ├── wiki-entry.md              # 🆕 docs/wiki/ 진입 가이드
│   ├── architecture-summary.md    # 🆕 (🤖 LLM write target)
│   ├── api-summary.md             # 🆕 (🤖)
│   ├── database-summary.md        # 🆕 (🤖)
│   ├── design-system-summary.md   # 🆕 (🤖)
│   └── ai-playbook-summary.md     # 🆕 (🤖)
├── wiki/                          # 🆕 Karpathy (축소 2계층)
│   ├── wiki/                      # 🤖 LLM write — 하네스·운영·태스크 지식
│   │   ├── INDEX.md               # LLM이 유지하는 목차 (Sub-3 자동 갱신 대상)
│   │   └── harness/
│   │       └── claude-code.md     # POC 샘플
│   └── schema/                    # (Human) 규약 SSOT
│       ├── README.md              # schema 개요 + 사용법
│       ├── frontmatter.md         # 필수/선택 필드, 예시
│       ├── tags.md                # 고정 태그 어휘
│       ├── links.md               # 내부 링크·relative path 규약
│       ├── ownership-matrix.md    # 🆕 정보 카테고리 × 저장소 정본 매트릭스
│       ├── conventions.md         # 🆕 (이관 대상 — CLAUDE.md·.cursor/rules 중복 섹션 수렴처)
│       └── harness.md             # 🆕 (하네스 공통 규칙 — gstack·Superpowers·OMC·GSD 경계)
├── architecture/                  # 기존 유지 (Human). distributed agent.md 미채택
├── api/                           # 기존 유지 (Human)
├── database/                      # 기존 유지 (Human)
├── design-system/                 # 기존 유지 (Human)
├── ai-playbook/                   # 기존 유지 (Human)
└── …그 외 기존 폴더 유지
```

### 결정 이유

- **2계층(wiki + schema)** 으로 축소: `source/` 계층은 이 repo의 "source = code" 특성 때문에 억지다. 외부 레퍼런스는 개별 파일 프론트매터 `source:` 필드로 추적한다.
- **distributed `agent.md` 미채택**: topic 폴더(`docs/architecture/`, `docs/api/` …)를 mixed-ownership으로 만들면 diff 리뷰 부담과 drift가 커진다. 기존 `docs/agent/` 세그리게이션 패턴을 유지·확장한다.
- `docs/agent/README.md`는 **파일명을 유지**하고 "INDEX 역할"로 기능한다. 루트 `CLAUDE.md`가 이 파일명을 참조하고 있어 rename 시 연쇄 수정이 발생한다.

## 5. Ownership Matrix (SSOT 매트릭스)

`docs/wiki/schema/ownership-matrix.md`로 고정한다. 정본(C)은 1곳이며 pointer(P)는 정본을 링크만 한다.

| 정보 카테고리                                 | 정본 (C)                                                    | Pointer (P)                                                                  |
| --------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Stack / 버전                                  | `.planning/codebase/STACK.md`                               | `CLAUDE.md`, `docs/wiki/schema/conventions.md`, `.cursor/rules/monorepo.mdc` |
| 코딩 컨벤션 (공용)                            | `docs/wiki/schema/conventions.md`                           | `CLAUDE.md`, `.cursor/rules/monorepo.mdc`                                    |
| 빌드·명령                                     | `Justfile` + `package.json:scripts`                         | `CLAUDE.md`, `docs/wiki/schema/conventions.md`                               |
| 디렉토리 구조                                 | `.planning/codebase/STRUCTURE.md`                           | `docs/agent/monorepo.md`                                                     |
| 아키텍처 상세 (설계 의도)                     | `docs/architecture/README.md`                               | `docs/agent/architecture-summary.md`                                         |
| 아키텍처 스냅샷 (자동 분석)                   | `.planning/codebase/ARCHITECTURE.md`                        | `docs/agent/architecture-summary.md`                                         |
| API 라우트                                    | `docs/agent/api-v1-routes.md`                               | `docs/agent/api-summary.md`                                                  |
| DB 사용법                                     | `docs/database/01-schema-usage.md` 등                       | `docs/agent/database-summary.md`                                             |
| Warehouse 스키마                              | `docs/agent/warehouse-schema.md`                            | `docs/agent/database-summary.md`                                             |
| 디자인 시스템                                 | `docs/design-system/**` + `docs/agent/design-system-llm.md` | `docs/agent/design-system-summary.md`                                        |
| 에이전트 운영·Gotchas                         | `docs/wiki/wiki/**`                                         | `docs/agent/README.md`                                                       |
| 에이전트별 프로필                             | `docs/ai-playbook/*.md`                                     | `docs/agent/ai-playbook-summary.md`                                          |
| 하네스 규칙 (gstack·Superpowers·OMC·GSD 경계) | `docs/wiki/schema/harness.md`                               | `CLAUDE.md`, `.cursor/rules`                                                 |
| Git workflow                                  | `docs/GIT-WORKFLOW.md`                                      | `CLAUDE.md`                                                                  |
| React / API / Rust 코드 패턴                  | `.cursor/rules/{react-components,api-routes,rust-api}.mdc`  | `docs/wiki/schema/conventions.md` (요약 링크)                                |

### 이관 원칙

1. 각 카테고리는 **정본 1개**만 가진다.
2. Pointer 파일은 2~5줄 정도의 요약 + "Canonical: <path>" 라인 + 마지막 수정일자만 보존한다.
3. 이미 substantive한 `docs/agent/warehouse-schema.md`, `web-hooks-and-stores.md`, `api-v1-routes.md`는 해당 카테고리의 정본 지위를 유지한다. 확장된 `*-summary.md`는 이들을 링크만 한다.
4. `.cursor/rules/*.mdc`는 Cursor 네이티브 포맷 특성을 유지하되, `conventions.md`에서 이미 다룬 내용은 "→ `docs/wiki/schema/conventions.md` 참조" 한 줄로 수렴한다.

## 6. Schema 규약

### 6.1 Frontmatter (agent-consumable 파일 필수)

```yaml
---
title: 사람이 읽는 제목
owner: llm | human # write 주체
status: draft | approved | stale | deprecated
updated: 2026-04-17 # YYYY-MM-DD (Sub-3 자동화 전까진 수동)
tags: # tags.md 고정 어휘만 허용
  - harness
  - agent
related: # repo 상대 경로, 없으면 생략
  - docs/agent/monorepo.md
source: # 외부 URL, 선택
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
---
```

- **필수 필드**: `title`, `owner`, `status`, `updated`, `tags`
- **옵션 필드**: `related`, `source`, `issue`, `pr`, `phase`
- H1은 `title`과 일치하도록 작성한다 (Sub-3 linter가 검증한다).

### 6.2 Tag 고정 어휘 (`docs/wiki/schema/tags.md`)

초기 어휘: `harness`, `agent`, `architecture`, `api`, `db`, `ui`, `design-system`, `testing`, `ops`, `security`, `llm-write`, `deprecated`, `gstack`, `superpowers`, `omc`, `gsd`, `cursor`, `claude-code`.

어휘 확장은 schema/tags.md 변경 PR에서 검토한다. 새 tag를 임의로 쓰면 Sub-3 linter가 실패한다.

### 6.3 Link 규약 (`docs/wiki/schema/links.md`)

- repo 상대 경로 사용. `../../docs/agent/monorepo.md`가 아닌 `docs/agent/monorepo.md`.
- 외부 링크는 절대 URL, 프로토콜 포함.
- `related:` 프론트매터는 "의미적 인접 문서"만 5개 이하. 과다 연결 시 Sub-3 linter가 경고한다.
- Obsidian `[[]]` 문법은 사용하지 않는다 (GitHub 렌더링·CI 파서 호환).

## 7. docs/agent/ 확장 계획 (topic summary 허브)

### 7.1 신규 파일 역할

| 파일                       | 역할                                                 | 정본 링크                                                           |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `architecture-summary.md`  | Architecture 영역에서 에이전트가 먼저 읽을 요약·지도 | `docs/architecture/README.md`, `.planning/codebase/ARCHITECTURE.md` |
| `api-summary.md`           | `/api/v1/*`와 Rust API의 진입점 요약                 | `docs/agent/api-v1-routes.md`, `packages/api-server/AGENT.md`       |
| `database-summary.md`      | public · warehouse 스키마의 입구                     | `docs/database/**`, `docs/agent/warehouse-schema.md`                |
| `design-system-summary.md` | DS 토큰·컴포넌트 사용 입구                           | `docs/design-system/**`, `docs/agent/design-system-llm.md`          |
| `ai-playbook-summary.md`   | 에이전트별 프로필(Claude/Cursor/Gemini) 빠른 참조    | `docs/ai-playbook/*.md`                                             |
| `wiki-entry.md`            | `docs/wiki/` 사용법·진입 가이드                      | `docs/wiki/schema/**`                                               |

### 7.2 템플릿 (모든 `*-summary.md`에 공통)

```markdown
---
title: <Topic> — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [agent, <topic-tag>]
related:
  - <정본 경로>
---

## Purpose

<3~4 문장으로 이 영역에서 에이전트가 가장 먼저 알아야 할 것>

## Canonical sources

- <정본 링크 1>
- <정본 링크 2>

## Key files / concepts

- <핵심 파일 1> — <한 줄 설명>
- <핵심 파일 2> — …

## Gotchas

- <에이전트가 자주 틀리는 포인트>

## Recent changes

- 2026-04-17: 초기 작성
```

- 모든 `*-summary.md`는 owner=`llm`. 사람 수정은 드물고, Sub-3 자동화가 들어오면 `/ingest` 명령으로 갱신한다.
- Phase 1에서는 초기 골격만 채우고, 본격 콘텐츠 확장은 Sub-3·Sub-4·이후 작업에서 반복한다.

## 8. `.planning/codebase/` 와 `docs/wiki/wiki/**`의 역할 분리

두 자산은 granularity·lifecycle이 다르다는 점을 schema/ownership-matrix.md에 명시한다.

| 측면        | `.planning/codebase/**`                            | `docs/wiki/wiki/**`                                                       |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| 성격        | 코드베이스 구조·아키텍처 **스냅샷** (한 번에 전체) | 태스크·하네스·운영 **지식 누적** (점진적)                                 |
| 생성 트리거 | `/gsd:map-codebase` 수동 실행                      | 에이전트 작업 중 발견한 규칙·gotcha를 누적 기록                           |
| 대표 파일   | ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md      | harness/claude-code.md, ops/worktree-parallel.md, tasks/<issue>-<slug>.md |
| 갱신 주기   | 스프린트 단위 (수동)                               | 상시 (Sub-3 자동화 대상)                                                  |
| 관계        | `docs/agent/*-summary.md`가 링크한다               | `docs/agent/README.md`가 INDEX로 링크한다                                 |

두 자산은 **공존**하며 서로 덮어쓰지 않는다. 정본 매트릭스에서 "아키텍처 스냅샷" 정본은 `.planning/codebase/ARCHITECTURE.md`, "에이전트 운영" 정본은 `docs/wiki/wiki/**`로 나뉜다.

## 9. POC Sample — `docs/wiki/wiki/harness/claude-code.md`

```markdown
---
title: Claude Code — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-17
tags: [harness, agent, claude-code, gstack, superpowers, omc]
related:
  - CLAUDE.md
  - docs/wiki/schema/harness.md
  - docs/agent/ai-playbook-summary.md
source:
  - https://docs.claude.com/en/docs/claude-code
---

## Purpose

Claude Code에서 이 repo를 다룰 때 매 세션마다 재발견되는 규칙·gotcha를 누적 기록한다.

## Worktrees for parallel work

- `.worktrees/<issue-slug>` 규칙 (gitignored, #153 커밋 5a37afb7 이후)
- `git worktree add -b <type>/<N>-<slug> .worktrees/<slug> origin/dev`
- 세션 간 충돌 없이 병렬 처리 가능. 각 워크트리에 독립 상태.

## Draft PR convention

- `scripts/start-issue.sh <N> [type]` 이 브랜치 + 빈 커밋 + Draft PR까지 생성
- 프로젝트 보드(#3)가 PR 링크를 감지해 자동 In Progress 전환
- 워크트리는 이 스크립트가 만들지 않으므로 수동 `git worktree add` 필요

## Auto Mode interaction

- Auto mode는 destructive 작업(push, DB 변경, 대량 삭제) 승인만 요구
- push 권한은 세션별 1회 확인이 발생할 수 있으므로 batch 작업 시 유의

## Gotchas

- `cd` 후 다음 Bash 호출은 cwd가 초기화된다 — 항상 절대경로 사용
- `EnterWorktree`로 세션 이동 후에도 원 브랜치의 dirty 파일은 그대로 남는다
- `.cursor/rules/*.mdc`와 `CLAUDE.md`에 컨벤션 중복이 있다 — SSOT는 `docs/wiki/schema/conventions.md`

## Recent changes

- 2026-04-17: 초기 작성 (POC)
```

이 샘플은 Phase 1 이행과 동시에 실제 파일로 작성된다. 이후 Sub-3 자동화가 `wiki/wiki/INDEX.md`로 이 파일을 자동 등재한다.

## 10. Sub-3 / Sub-4 Contract (부록)

Phase 1 산출물이 **dead scaffold**로 전락하지 않도록, 후속 phase의 계약을 여기서 고정한다.

### 10.1 Sub-3 — Automation (validator / linker / ingest)

- **CLI 진입점**: `bun run wiki:lint`, `bun run wiki:links`, `bun run wiki:ingest <topic>` (packages/web/package.json scripts 또는 루트 스크립트)
- **`wiki:lint`**: 프론트매터 필수 필드 검증, tags.md 어휘 검증, H1/title 일치 검증, 경로 존재성 검증
- **`wiki:links`**: `related:` 필드에 현재 사용 빈도·역링크를 반영하고, 깨진 링크 목록 출력
- **`wiki:ingest`**: LLM이 `docs/wiki/wiki/<topic>/`에 새 노트를 추가할 때 프론트매터와 INDEX.md를 자동 갱신
- **실행 시점**: pre-push hook(`scripts/git-pre-push.sh`)에서 `wiki:lint`를 돌린다. CI에서도 동일.
- **Owner**: 이 CLI들은 `tools/wiki/` 아래 TypeScript로 구현 (별도 Sub-3 스펙에서 상세화).

### 10.2 Sub-4 — Harness Integration

- `CLAUDE.md` 전면 리팩토링: 컨벤션 섹션을 `docs/wiki/schema/conventions.md` 포인터로 축소, routing만 남김
- `.cursor/rules/*.mdc`: 중복 섹션을 `docs/wiki/schema/conventions.md` 링크로 대체
- `/ingest` 같은 Claude Code custom slash command 정의 (Sub-3 CLI 호출)
- 세부는 Sub-4 스펙에서 설계

### 10.3 의존 순서

Phase 1 (본 스펙) → Sub-3 (자동화) → Sub-4 (하네스 리팩토링). Sub-3와 Sub-4는 부분 병렬 가능하지만, Sub-4가 `docs/wiki/schema/conventions.md`를 point하려면 Sub-3의 최소 스키마 안정성이 전제된다.

## 11. Migration Strategy — 단계 분리

Phase 1 이행은 **3개 PR**로 분리해 diff noise를 최소화한다.

### PR-A (scaffold-only) — base `dev`, head `chore/153-docs-harness-wiki`

- `docs/wiki/` 디렉토리 + `schema/` 3+3개 파일 (README, frontmatter, tags, links, ownership-matrix, conventions, harness)
- `docs/wiki/wiki/INDEX.md` (비어 있는 초기 상태)
- `docs/adr/ADR-0002-llm-wiki-foundation.md`
- `docs/wiki/wiki/harness/claude-code.md` (POC 샘플)
- `docs/agent/wiki-entry.md`
- **No changes** to 기존 파일 (frontmatter 부여나 CLAUDE.md 수정 없음)

### PR-B (agent summaries) — base `dev`, head `chore/153-agent-summaries`

- `docs/agent/architecture-summary.md`, `api-summary.md`, `database-summary.md`, `design-system-summary.md`, `ai-playbook-summary.md`
- `docs/agent/README.md` 갱신 (새 summary 파일 등재)
- **No changes** to topic 폴더(`docs/architecture/` 등)

### PR-C (frontmatter + consolidation pointers) — base `dev`, head `chore/153-frontmatter-migration`

- 기존 `docs/agent/*.md`, `docs/ai-playbook/*.md`에 프론트매터 부여 (owner, tags, updated 최소 필드)
- `CLAUDE.md` 내 컨벤션·stack 섹션을 `docs/wiki/schema/conventions.md` pointer로 **축소** (routing만 남김)
- `.cursor/rules/monorepo.mdc` 중복 섹션을 pointer로 축소
- `docs/README.md` 인덱스 갱신 (역할 헌법 표 업데이트)

세 PR은 순차 머지하며, 각 PR은 독립 리뷰 가능해야 한다. 실패 시 후속 PR을 차단하지 않도록 내용 경계를 엄격히 지킨다.

## 12. Success Criteria — Outcome-shaped + Activity-shaped

### Outcome-shaped (측정 가능한 결과)

- **O1. 컨벤션 조회 파일 수**: "bun 쓰나 npm 쓰나?"를 답하려 현재 `CLAUDE.md`, `.cursor/rules/monorepo.mdc`, `docs/README.md`, `.planning/codebase/STACK.md` 4곳 이상을 확인한다. Phase 1 이후 `docs/wiki/schema/conventions.md` 1곳 + 정본 링크 1회 탐색으로 답한다.
- **O2. Topic 진입 파일 수**: 에이전트가 Architecture 영역을 처음 다룰 때 현재 `CLAUDE.md` + `docs/README.md` + `docs/architecture/README.md` + `.planning/codebase/ARCHITECTURE.md`를 순서 없이 탐색한다. Phase 1 이후 `docs/agent/architecture-summary.md` 1개 파일로 진입점이 고정된다.
- **O3. Drift 감지 가능성**: 프론트매터 `updated:` 필드가 기준값을 넘어 경과된 파일 수를 Sub-3에서 집계한다. Phase 1은 기반을 제공한다 (실측은 Sub-3 이후).
- **O4. 새 에이전트 세션 온보딩 시간**: Claude Code 세션 시작 시 `CLAUDE.md` → `docs/agent/README.md` → 해당 topic `*-summary.md`의 3-step 경로로 해결되는 비율. Sub-4 이후 정량 측정.

### Activity-shaped (산출물 체크)

- [ ] `docs/wiki/schema/` 파일 7개 (README, frontmatter, tags, links, ownership-matrix, conventions, harness)
- [ ] `docs/wiki/wiki/INDEX.md` 초기 생성
- [ ] `docs/wiki/wiki/harness/claude-code.md` POC 샘플
- [ ] `docs/agent/` 하위 summary 파일 5개 + `wiki-entry.md`
- [ ] `docs/adr/ADR-0002-llm-wiki-foundation.md`
- [ ] 기존 `docs/agent/*.md`·`docs/ai-playbook/*.md`에 프론트매터 부여
- [ ] `CLAUDE.md` 중복 섹션 pointer로 축소 (routing 보존)
- [ ] `.cursor/rules/monorepo.mdc` 중복 섹션 pointer로 축소
- [ ] 3개 PR(A/B/C)로 분리 머지
- [ ] Sub-3 / Sub-4 스펙 이슈 생성 (각 별도 GitHub issue)

## 13. ADR-0002 요약 (전체 본문은 별도 파일)

- **Status**: Accepted (Phase 1 착수와 함께)
- **Decision**: `docs/` 하위에 LLM wiki 2계층(`wiki/` + `schema/`)을 도입하고, 기존 `docs/agent/`를 topic summary 허브로 확장한다. 컨벤션·하네스 규칙은 `docs/wiki/schema/`로 정본화하고 `CLAUDE.md`·`.cursor/rules/`는 pointer화한다.
- **Alternatives considered**:
  1. Do nothing — 현 상태 유지. 드리프트 지속.
  2. Flatten everything into `docs/agent/` — Karpathy 컨셉 포기, 성장 경로 상실.
  3. Full Karpathy 3계층 (source/wiki/schema) — source가 억지 적용.
  4. Consolidation only (schema 도입 없이 중복만 줄임) — SSOT 구조화 기회 상실.
- **Rationale**: 에이전트 작업 지식의 누적을 허용하면서(Hybrid D 기반), 리뷰 실패 패턴(distributed agent.md, source 계층 억지, 자동화 지연) 3가지를 동시 회피한다.
- **Reversibility**: `docs/wiki/` 디렉토리 제거 + ADR-0002 Superseded 처리 + pointer 축소했던 `CLAUDE.md`·`.cursor/rules` 섹션 복원. PR-C의 변경을 `git revert`로 되돌리고 PR-A·B의 새 디렉토리를 삭제한다.

## 14. Rollback Plan

Phase 1 후 2~3개월 내 이 구조가 overhead로 드러나면:

1. ADR-0002를 `Superseded` 상태로 변경하고 사유 기록.
2. `docs/wiki/schema/**` 파일들을 삭제 or `/archive/` 이동.
3. PR-C에서 축소한 `CLAUDE.md`·`.cursor/rules/` 컨벤션 섹션을 복원 (git history 참조).
4. `docs/agent/*-summary.md` 파일은 유지 여부를 파일별로 재평가 (가치 있으면 `docs/agent/` 허브는 유지 가능).
5. `.planning/codebase/`와 기존 `docs/agent/` 인벤토리는 변경 없이 잔존.

## 15. Risks & Mitigations

| 리스크                                                                    | 영향 | 완화                                                                                                        |
| ------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| Sub-3 자동화가 지연되어 수동 프론트매터 `updated:` drift                  | MED  | Phase 1 PR-C 단계에서 `updated:` 필드를 최소 의무로만 요구. Sub-3 진입 시 일괄 재설정.                      |
| `docs/wiki/schema/conventions.md`와 `.cursor/rules/*.mdc` 여전히 재-drift | MED  | Sub-3 linter가 양쪽 파일을 읽어 diff 경고. Sub-4에서 생성 방향(schema → cursor rules) 자동화 검토.          |
| `docs/agent/*-summary.md`가 POC 이상으로 안 채워지고 placeholder로 rot    | LOW  | Phase 1 PR-B에서 최소 4섹션 실제 내용으로 채움 (TODO 금지). 각 summary는 정본 링크와 Gotchas 1개 이상 포함. |
| 루트 `CLAUDE.md` 축소가 에이전트 routing에 혼선                           | LOW  | PR-C에서 routing 섹션은 건드리지 않음. 컨벤션 섹션만 pointer화.                                             |
| ADR-0002가 "문서 정리 작업"에 과도한 무게                                 | LOW  | ADR 본문을 간결하게 유지 (1~2 페이지). 향후 개정 이력만 관리.                                               |

## 16. Implementation Sequencing (요약)

1. **PR-A (scaffold)** — 새 디렉토리·schema·ADR·POC. 기존 파일 무수정. (≤1일)
2. **PR-B (agent summaries)** — 5개 summary + INDEX 갱신. 기존 topic 폴더 무수정. (≤1일)
3. **PR-C (frontmatter + consolidation pointers)** — 기존 파일 프론트매터, `CLAUDE.md`·`.cursor/rules` 축소. (1~2일)
4. Sub-3 이슈 생성: validator/linker/ingest CLI.
5. Sub-4 이슈 생성: CLAUDE.md·.cursor/rules 전면 리팩토링 및 custom slash commands.

## 17. References

- Andrej Karpathy, LLM wiki gist — https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- 현재 repo docs 구조: `docs/README.md`, `docs/agent/README.md`, `.planning/codebase/README.md`
- OMC critic·architect 병렬 리뷰 결과 (2026-04-17 Phase 1 브레인스토밍 세션)
- Issue #153, PR #223 (Draft)

## 18. Open Questions (향후 이슈/스펙에서 결정)

1. `docs/ai-playbook/` 내 stale 콘텐츠(Codex 프로필 등) deprecation은 Sub-4에서 다룰지 별도 이슈로 뺄지.
2. `docs/wiki/wiki/` 하위 topic 분류 체계(`harness/`, `ops/`, `tasks/`, `incidents/`)의 고정 여부 — Sub-3 linter에서 enforce할지.
3. `related:` 필드 관리 부담 상한 (파일당 5개 권장 vs hard limit).
4. `/ingest` 같은 Claude Code custom slash command를 이 repo 어디에 두는지 (`.claude/commands/` vs npm script 호출) — Sub-4에서 결정.

---

**Status**: Design approved on 2026-04-17. 다음 단계는 superpowers:writing-plans skill로 implementation plan을 생성한다.
