# LLM Wiki Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** decoded-monorepo에 LLM wiki 2계층 구조(`docs/wiki/{wiki,schema}/`)를 도입하고 기존 `docs/agent/`를 topic summary 허브로 확장하며, 중복된 convention들을 `docs/wiki/schema/`로 consolidate한다.

**Architecture:** Karpathy LLM wiki 컨셉을 2계층으로 축소 적용(`wiki` + `schema`). `docs/agent/`는 기존 세그리게이션 패턴을 유지하면서 topic summary 파일을 추가. `CLAUDE.md`와 `.cursor/rules/`의 중복 convention을 `docs/wiki/schema/conventions.md`로 이관하고 원 위치는 pointer화한다. Phase 1은 뼈대·규약·POC까지만 책임지고, validator/linker/ingest 자동화는 Sub-3, CLAUDE.md 전면 리팩토링은 Sub-4로 분리한다.

**Tech Stack:** Markdown + YAML frontmatter. GitHub 상대 경로 링크. 이후 Sub-3에서 Bun + TypeScript로 CLI linter 구현 (본 plan 범위 밖).

**Spec:** `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`

**Worktree & Branch:** `.worktrees/153-docs-harness-wiki`, branch `chore/153-docs-harness-wiki`, Draft PR #223.

**Migration Strategy:** 3개의 논리적 단위(Task 1/2/3)를 각각 독립 커밋으로 작성. 필요 시 각 단위를 별도 PR로 분리 (PR-A/B/C). 본 plan은 커밋 단위의 분리를 기본으로 한다.

**Commit Convention:** Conventional Commits. 본문에는 `Closes #153` 언급을 포함한다 (각 커밋 본문의 마지막 줄).

---

## Task 1: PR-A — Scaffold + Schema + ADR + POC

**Purpose:** 새 디렉토리·규약·ADR·POC 샘플만 추가한다. 기존 파일은 건드리지 않는다 (diff noise 최소화).

**Files:**

- Create: `docs/wiki/schema/README.md`
- Create: `docs/wiki/schema/frontmatter.md`
- Create: `docs/wiki/schema/tags.md`
- Create: `docs/wiki/schema/links.md`
- Create: `docs/wiki/schema/ownership-matrix.md`
- Create: `docs/wiki/schema/conventions.md`
- Create: `docs/wiki/schema/harness.md`
- Create: `docs/wiki/wiki/INDEX.md`
- Create: `docs/wiki/wiki/harness/claude-code.md`
- Create: `docs/agent/wiki-entry.md`
- Create: `docs/adr/ADR-0002-llm-wiki-foundation.md`

- [ ] **Step 1.1: 디렉토리 구조 생성**

```bash
mkdir -p docs/wiki/schema docs/wiki/wiki/harness docs/adr
```

검증: `ls -la docs/wiki/schema docs/wiki/wiki/harness docs/adr` — 3 디렉토리 모두 존재.

- [ ] **Step 1.2: `docs/wiki/schema/README.md` 작성**

```markdown
---
title: Wiki Schema — SSOT for Docs Conventions
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
  - docs/wiki/schema/tags.md
  - docs/wiki/schema/links.md
  - docs/wiki/schema/ownership-matrix.md
  - docs/wiki/schema/conventions.md
  - docs/wiki/schema/harness.md
---

# Wiki Schema

decoded-monorepo의 문서 규약 SSOT (Single Source of Truth).

## Files

| 파일                                           | 역할                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| [`frontmatter.md`](./frontmatter.md)           | agent-consumable 파일 프론트매터 필수/선택 필드          |
| [`tags.md`](./tags.md)                         | 고정 태그 어휘 (임의 태그 금지)                          |
| [`links.md`](./links.md)                       | 내부 링크 규약 (repo 상대 경로, Obsidian `[[]]` 금지)    |
| [`ownership-matrix.md`](./ownership-matrix.md) | 정보 카테고리별 정본(SSOT) 매트릭스                      |
| [`conventions.md`](./conventions.md)           | 공통 코딩·빌드 컨벤션 (CLAUDE.md · .cursor/rules 수렴처) |
| [`harness.md`](./harness.md)                   | 하네스 경계 (gstack · Superpowers · OMC · GSD)           |

## 사용 원칙

1. 규약은 여기서만 **정의**한다. 다른 파일은 이 schema를 **참조**한다.
2. 규약 개정은 schema 파일 PR로 진행한다.
3. Sub-3 linter가 도입되면 이 파일들이 검증 기준이 된다.

## 관련

- 전체 Phase 1 설계: [`docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`](../../superpowers/specs/2026-04-17-llm-wiki-foundation-design.md)
- 결정 기록: [`docs/adr/ADR-0002-llm-wiki-foundation.md`](../../adr/ADR-0002-llm-wiki-foundation.md)
```

검증: `test -f docs/wiki/schema/README.md && head -5 docs/wiki/schema/README.md` — 프론트매터 시작.

- [ ] **Step 1.3: `docs/wiki/schema/frontmatter.md` 작성**

````markdown
---
title: Frontmatter Schema
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/tags.md
  - docs/wiki/schema/links.md
---

# Frontmatter Schema

Agent-consumable 파일(`docs/wiki/wiki/**`, `docs/agent/*-summary.md`)은 다음 프론트매터를 **필수**로 가진다. Sub-3 linter가 이를 강제한다.

## 필수 필드

| 필드      | 타입                                             | 설명                                        |
| --------- | ------------------------------------------------ | ------------------------------------------- |
| `title`   | string                                           | H1과 일치하는 사람 읽기 제목                |
| `owner`   | `llm` \| `human`                                 | write 주체 (PR 리뷰 범위 결정)              |
| `status`  | `draft` \| `approved` \| `stale` \| `deprecated` | 수명 주기                                   |
| `updated` | `YYYY-MM-DD`                                     | 마지막 의미 있는 갱신 일자 (typo 고침 제외) |
| `tags`    | string[]                                         | [`tags.md`](./tags.md)의 고정 어휘만        |

## 옵션 필드

| 필드      | 타입     | 설명                                            |
| --------- | -------- | ----------------------------------------------- |
| `related` | string[] | repo 상대 경로. 의미적 인접 문서 5개 이하 권장. |
| `source`  | string[] | 외부 URL (절대 URL). 근거 자료.                 |
| `issue`   | string   | GitHub issue URL                                |
| `pr`      | string   | GitHub PR URL                                   |
| `phase`   | string   | 소속 phase 또는 sub-project 식별                |

## 예시

```yaml
---
title: Claude Code — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-17
tags: [harness, agent, claude-code]
related:
  - CLAUDE.md
  - docs/wiki/schema/harness.md
source:
  - https://docs.claude.com/en/docs/claude-code
---
```
````

## 규칙

- **H1과 `title` 일치**: 파일 내 첫 H1 텍스트는 `title` 값과 같아야 한다.
- **`updated` 갱신 기준**: 의미 있는 내용 변경 시에만. 오타·링크 수정은 제외.
- **`owner=llm` 파일**: 사람이 직접 수정하지 않는 것을 원칙으로 한다. Sub-3 ingest 파이프라인이 갱신한다. 긴급 수정 시 PR 리뷰에서 근거 명시.
- **태그 어휘**: [`tags.md`](./tags.md)에 없는 태그 사용 시 linter 실패.

````

검증: `head -20 docs/wiki/schema/frontmatter.md | grep -c "title:"` — 2 이상 (프론트매터 + 예시).

- [ ] **Step 1.4: `docs/wiki/schema/tags.md` 작성**

```markdown
---
title: Tag Vocabulary
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
---

# Tag Vocabulary

프론트매터 `tags:` 필드에 허용되는 고정 어휘. 새 태그 추가는 이 파일의 PR로만 가능하다.

## 영역 (domain)

| 태그 | 설명 |
|------|------|
| `architecture` | 시스템 구조, 레이어, 데이터 흐름 |
| `api` | Next.js `/api/v1/*`, Rust API |
| `db` | Supabase public · warehouse schema |
| `ui` | 웹 UI, 컴포넌트 |
| `design-system` | 디자인 토큰, DS 컴포넌트 |
| `testing` | 단위·통합·E2E 테스트 |
| `ops` | 배포, 모니터링, 운영 |
| `security` | 인증, RLS, 권한 |

## 역할 (role)

| 태그 | 설명 |
|------|------|
| `harness` | 에이전트 하네스 프로그래밍 (CLAUDE.md, .cursor/rules, hooks) |
| `agent` | 에이전트용 참조 문서 |
| `llm-write` | LLM이 유지하는 문서 |

## 도구 (tool)

| 태그 | 설명 |
|------|------|
| `claude-code` | Claude Code 관련 |
| `cursor` | Cursor 관련 |
| `gstack` | gstack 스킬 |
| `superpowers` | Superpowers 스킬 |
| `omc` | oh-my-claudecode |
| `gsd` | GSD 워크플로우 |

## 수명 주기 (lifecycle)

| 태그 | 설명 |
|------|------|
| `deprecated` | 더 이상 관리하지 않음. 아카이브 예정. |

## 확장

새 태그가 필요하면 이 파일의 PR로 추가한다. 네임스페이스 충돌 방지를 위해 표 분류(영역/역할/도구/수명)에 맞춰 배치한다.
````

검증: `grep -c "^| \`" docs/wiki/schema/tags.md` — 15+ (태그 수).

- [ ] **Step 1.5: `docs/wiki/schema/links.md` 작성**

````markdown
---
title: Link Conventions
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
---

# Link Conventions

문서 내 링크 규약. Sub-3 linter가 검증 대상으로 삼는다.

## 내부 링크

- **repo 상대 경로** 사용. 예: `docs/agent/monorepo.md`.
- 디렉토리 기준 상대 경로(`../../..`)는 사용하지 않는다 (렌더러에 따라 깨짐).
- 파일 내 섹션 앵커는 `docs/agent/monorepo.md#commands` 처럼 `#`로 연결.

## 외부 링크

- 절대 URL, 프로토콜 포함: `https://...`.
- 가능한 경우 영속 경로 사용 (GitHub permalink, specific commit hash).

## Obsidian 문법 미채택

- `[[wiki-link]]` 형태는 사용하지 않는다. GitHub·CI 파서가 처리하지 못하기 때문.

## `related:` 필드

- repo 상대 경로 배열.
- 의미적 인접 문서만 포함. 5개 이하 권장.
- 양방향 일관성은 Sub-3 linker가 관리한다 (Phase 1은 수동).

## 예시

```markdown
[docs/agent/monorepo.md](docs/agent/monorepo.md)
[A 섹션](docs/agent/monorepo.md#a-section)
[LLM wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
```
````

````

검증: `test -f docs/wiki/schema/links.md`.

- [ ] **Step 1.6: `docs/wiki/schema/ownership-matrix.md` 작성**

spec의 §5 (Ownership Matrix)를 해당 파일로 그대로 작성한다. 프론트매터를 추가하고 H1을 "Ownership Matrix"로 통일한다.

```markdown
---
title: Ownership Matrix
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
  - docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md
---

# Ownership Matrix

정보 카테고리별 정본(Canonical) 파일과 pointer 파일의 매핑. 각 카테고리는 정본 1곳만 가진다.

## 매트릭스

| 정보 카테고리 | 정본 (C) | Pointer (P) |
|--------------|---------|-------------|
| Stack / 버전 | `.planning/codebase/STACK.md` | `CLAUDE.md`, `docs/wiki/schema/conventions.md`, `.cursor/rules/monorepo.mdc` |
| 코딩 컨벤션 (공용) | `docs/wiki/schema/conventions.md` | `CLAUDE.md`, `.cursor/rules/monorepo.mdc` |
| 빌드·명령 | `Justfile` + `package.json:scripts` | `CLAUDE.md`, `docs/wiki/schema/conventions.md` |
| 디렉토리 구조 | `.planning/codebase/STRUCTURE.md` | `docs/agent/monorepo.md` |
| 아키텍처 상세 (설계 의도) | `docs/architecture/README.md` | `docs/agent/architecture-summary.md` |
| 아키텍처 스냅샷 (자동 분석) | `.planning/codebase/ARCHITECTURE.md` | `docs/agent/architecture-summary.md` |
| API 라우트 | `docs/agent/api-v1-routes.md` | `docs/agent/api-summary.md` |
| DB 사용법 | `docs/database/01-schema-usage.md` 등 | `docs/agent/database-summary.md` |
| Warehouse 스키마 | `docs/agent/warehouse-schema.md` | `docs/agent/database-summary.md` |
| 디자인 시스템 | `docs/design-system/**` + `docs/agent/design-system-llm.md` | `docs/agent/design-system-summary.md` |
| 에이전트 운영·Gotchas | `docs/wiki/wiki/**` | `docs/agent/README.md` |
| 에이전트별 프로필 | `docs/ai-playbook/*.md` | `docs/agent/ai-playbook-summary.md` |
| 하네스 규칙 (gstack·Superpowers·OMC·GSD 경계) | `docs/wiki/schema/harness.md` | `CLAUDE.md`, `.cursor/rules` |
| Git workflow | `docs/GIT-WORKFLOW.md` | `CLAUDE.md` |
| React/API/Rust 코드 패턴 | `.cursor/rules/{react-components,api-routes,rust-api}.mdc` | `docs/wiki/schema/conventions.md` (요약 링크) |

## 원칙

1. 각 카테고리는 **정본 1개**만 가진다.
2. Pointer 파일은 2~5줄 요약 + "Canonical: <경로>" 라인만 가진다.
3. `docs/agent/` 내 기존 substantive 파일(`warehouse-schema.md`, `api-v1-routes.md`, `web-hooks-and-stores.md`)은 정본으로 승격된다.
4. Sub-3 linter가 카테고리별 정본 참조 일관성을 검증한다.
````

검증: `grep -c "^| " docs/wiki/schema/ownership-matrix.md` — 17 이상 (헤더 + 15 카테고리 + 알림 행).

- [ ] **Step 1.7: `docs/wiki/schema/conventions.md` 골격 작성**

Phase 1에서는 골격만 둔다. 실제 이관은 Task 3(PR-C)에서 수행한다.

```markdown
---
title: Coding & Build Conventions
owner: human
status: draft
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/ownership-matrix.md
  - CLAUDE.md
  - .cursor/rules/monorepo.mdc
---

# Coding & Build Conventions

decoded-monorepo의 공통 컨벤션. `CLAUDE.md`와 `.cursor/rules/*.mdc`의 중복 섹션은 여기로 수렴한다.

> **Status:** Phase 1 초기 골격. Task 3 (PR-C)에서 실제 내용 이관.

## 섹션 (Task 3에서 채움)

- Package manager / Task runner
- ESLint / Prettier
- Commit convention
- Git hooks
- 환경변수
- Supabase 스키마
- Next.js 16 특이사항
- Issue tracking
- OMC 메타데이터
- Generated API code 정책

## 정본 지위

이 파일은 위 섹션의 **정본**이다. `CLAUDE.md`와 `.cursor/rules/monorepo.mdc`는 이 파일을 pointer로 참조한다.
```

검증: `grep -c "^##" docs/wiki/schema/conventions.md` — 2 (섹션 · 정본 지위).

- [ ] **Step 1.8: `docs/wiki/schema/harness.md` 골격 작성**

```markdown
---
title: Harness Boundaries
owner: human
status: draft
updated: 2026-04-17
tags: [harness, agent, gstack, superpowers, omc, gsd]
related:
  - CLAUDE.md
  - docs/wiki/schema/conventions.md
---

# Harness Boundaries

decoded-monorepo에서 사용하는 에이전트 하네스 도구의 역할과 경계.

> **Status:** Phase 1 초기 골격. Sub-4(하네스 전면 리팩토링)에서 상세화.

## 도구별 역할

| 도구        | 용도                                         | 사용 시점        |
| ----------- | -------------------------------------------- | ---------------- |
| gstack      | 스프린트 워크플로우 (Think → Ship → Reflect) | 기획·배포 전반   |
| Superpowers | TDD, 코드 품질 게이트                        | 구현 단계        |
| OMC         | Claude + Gemini 듀얼 멀티프로바이더          | 대규모 병렬 작업 |
| GSD (quick) | 원자적 단발 패치                             | 유지보수         |

## 중복 회피

각 도구는 같은 작업 영역을 중복해서 수행하지 않는다. 같은 의도를 다른 도구로 수행할 때의 기본값은 Sub-4에서 정의한다.

## 세션 규율

- 복잡한 작업은 워크트리 분리 (`.worktrees/<slug>` 패턴)
- 이슈 시작은 `scripts/start-issue.sh <N> [type]` 통한 Draft PR 자동화
- main/master 직접 push 금지
```

검증: `test -f docs/wiki/schema/harness.md && grep -c "^| " docs/wiki/schema/harness.md` — 5 이상.

- [ ] **Step 1.9: `docs/wiki/wiki/INDEX.md` 초기 생성**

```markdown
---
title: LLM Wiki — Index
owner: llm
status: draft
updated: 2026-04-17
tags: [agent, llm-write]
related:
  - docs/wiki/schema/README.md
  - docs/agent/wiki-entry.md
---

# LLM Wiki — Index

`docs/wiki/wiki/**` 누적 노트의 목차. Sub-3 ingest 파이프라인이 신규/갱신 파일을 자동 등재한다. Phase 1에는 수동 항목만 존재.

## Harness

- [harness/claude-code.md](harness/claude-code.md) — Claude Code 세션 규율·worktree·Draft PR·Auto Mode

## (비어 있음)

다음 카테고리 폴더가 자동 등재 대상이다:

- `ops/` — 배포·모니터링·운영 knowledge
- `tasks/` — 이슈 단위 누적 knowledge
- `incidents/` — 장애 / post-mortem
```

검증: `test -f docs/wiki/wiki/INDEX.md && grep -c "^- \[" docs/wiki/wiki/INDEX.md` — 1 이상.

- [ ] **Step 1.10: POC — `docs/wiki/wiki/harness/claude-code.md` 작성**

spec §9의 POC Sample을 파일로 작성.

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

# Claude Code — Harness Knowledge

Claude Code에서 이 repo를 다룰 때 매 세션마다 재발견되는 규칙·gotcha를 누적 기록한다.

## Worktrees for parallel work

- `.worktrees/<issue-slug>` 규칙 (gitignored, 커밋 `5a37afb7` 이후)
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

- 2026-04-17: 초기 작성 (POC, Phase 1)
```

검증: `grep -c "^## " docs/wiki/wiki/harness/claude-code.md` — 5 (Worktrees, Draft PR, Auto Mode, Gotchas, Recent changes).

- [ ] **Step 1.11: `docs/agent/wiki-entry.md` 작성**

```markdown
---
title: Wiki Entry — How Agents Use docs/wiki
owner: human
status: approved
updated: 2026-04-17
tags: [agent, harness]
related:
  - docs/agent/README.md
  - docs/wiki/schema/README.md
  - docs/wiki/wiki/INDEX.md
---

# Wiki Entry

Claude / Cursor / 기타 에이전트가 `docs/wiki/`를 어떻게 사용하는지 진입 가이드.

## 구조

- `docs/wiki/schema/` — 규약 (SSOT). 먼저 읽는다.
- `docs/wiki/wiki/` — 누적 지식 노트. 주제별 디렉토리. INDEX.md가 목차.

## 에이전트 워크플로우

1. 세션 시작 시 `CLAUDE.md` → `docs/agent/README.md` → 이 파일 순으로 참조.
2. 주제별 knowledge는 `docs/wiki/wiki/INDEX.md`에서 진입.
3. 새 gotcha/운영 지식을 발견하면 `docs/wiki/wiki/<topic>/<note>.md`에 추가한다 (owner=llm).
4. 컨벤션 질문은 `docs/wiki/schema/conventions.md`만 참조한다 (다른 파일 중복 시 schema가 우선).

## 관련

- Ownership: [`docs/wiki/schema/ownership-matrix.md`](../wiki/schema/ownership-matrix.md)
- ADR: [`docs/adr/ADR-0002-llm-wiki-foundation.md`](../adr/ADR-0002-llm-wiki-foundation.md)
```

검증: `test -f docs/agent/wiki-entry.md`.

- [ ] **Step 1.12: `docs/adr/ADR-0002-llm-wiki-foundation.md` 작성**

```markdown
---
title: "ADR-0002: LLM Wiki Foundation"
owner: human
status: approved
updated: 2026-04-17
tags: [architecture, harness, agent]
related:
  - docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md
  - docs/wiki/schema/README.md
---

# ADR-0002: LLM Wiki Foundation

- **Status:** Accepted (2026-04-17)
- **Supersedes:** —
- **Related:** Issue #153, PR #223, Spec `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`

## Context

decoded-monorepo는 현재 4개 이상의 문서 소스가 공존한다: 루트 `CLAUDE.md`, `.cursor/rules/*.mdc`, `docs/agent/`, `docs/ai-playbook/`, `.planning/codebase/`. 각각 부분적으로 중복된 컨벤션·아키텍처·에이전트 규칙을 담고 있으며 정본(SSOT) 규칙이 없다. 이슈 #153은 이 상태를 정비하면서 Karpathy LLM wiki 컨셉(LLM이 markdown 위키를 자동 ingest/lint/update하는 구조)에서 영감을 얻어 에이전트 하네스 프로그래밍을 업그레이드한다.

## Decision

`docs/` 하위에 LLM wiki 2계층 구조(`docs/wiki/wiki/` + `docs/wiki/schema/`)를 도입한다. Karpathy의 3계층(source/wiki/schema) 중 `source`는 "source = code"인 이 repo 특성상 생략한다. 기존 `docs/agent/`는 topic summary 허브로 확장하고, 기존 topic 폴더(`docs/architecture/` 등)에 distributed `agent.md`를 두지 않는다. 컨벤션·하네스 규칙은 `docs/wiki/schema/`로 정본화하고 `CLAUDE.md`·`.cursor/rules/`는 pointer로 축소한다.

## Alternatives Considered

1. **Do nothing** — 현 상태 유지. 드리프트 지속.
2. **Flatten everything into `docs/agent/`** — Karpathy 컨셉 포기, 성장 경로 상실.
3. **Full Karpathy 3계층(source/wiki/schema)** — `source` 계층 억지 적용.
4. **Consolidation only** (schema 도입 없이 중복만 줄임) — SSOT 구조화 기회 상실.

## Rationale

에이전트 작업 지식의 누적을 허용(hybrid D 기반)하면서, OMC critic·architect 리뷰가 지적한 3가지 위험(distributed `agent.md`, `source` 계층 억지, 자동화 지연)을 동시 회피한다.

## Consequences

### Positive

- 컨벤션 조회 시 정본 1곳으로 수렴 (현재 4+).
- LLM·Cursor·Claude가 공통 규약 파일을 참조.
- 에이전트 지식 누적을 받아내는 전용 공간(`wiki/wiki/`) 확보.

### Negative

- 새 디렉토리 도입으로 초기 learning curve.
- Phase 1 산출물이 Sub-3 자동화 없이 수동 유지. Sub-3 지연 시 drift 위험.
- 기존 파일 프론트매터 추가·pointer 축소 migration 비용.

## Reversibility

Phase 1 후 2~3개월 내 이 구조가 overhead로 드러나면:

1. 이 ADR을 `Superseded`로 변경하고 사유 기록.
2. `docs/wiki/schema/**` 삭제 또는 `/archive/` 이동.
3. PR-C에서 축소한 `CLAUDE.md`·`.cursor/rules/` 컨벤션 섹션을 `git revert`로 복원.
4. `docs/agent/*-summary.md` 파일은 유지 여부를 파일별로 재평가.
5. `.planning/codebase/`와 기존 `docs/agent/` 인벤토리는 변경 없이 잔존.

## Implementation

- Plan: `docs/superpowers/plans/2026-04-17-llm-wiki-foundation.md`
- Follow-ups: Sub-3 (자동화), Sub-4 (CLAUDE.md·.cursor/rules 전면 리팩토링)
```

검증: `grep -c "^## " docs/adr/ADR-0002-llm-wiki-foundation.md` — 6 이상 (Context / Decision / Alternatives / Rationale / Consequences / Reversibility / Implementation).

- [ ] **Step 1.13: 링크 resolve 수동 검증**

Phase 1에는 linter가 없으므로 수동 검증한다.

```bash
# 새 파일들이 참조하는 모든 내부 경로를 뽑아 실제 존재 확인
for f in $(find docs/wiki docs/agent/wiki-entry.md docs/adr/ADR-0002-llm-wiki-foundation.md -type f -name '*.md'); do
  echo "=== $f ==="
  grep -Eo '\]\(([^)]+)\)' "$f" | sed 's/](//; s/)$//' | while read -r p; do
    case "$p" in
      http*) continue;;
      /*) test -e ".$p" || test -e "$p" || echo "  MISSING: $p";;
      *) test -e "$(dirname "$f")/$p" || echo "  MISSING: $p (from $f)";;
    esac
  done
done
```

검증 기대: `MISSING:` 라인이 0개이거나, 있다면 "Task 2·3에서 생성될 예정인 파일"만 (예: `docs/agent/architecture-summary.md`).

- [ ] **Step 1.14: Commit + Push**

```bash
git add docs/wiki docs/agent/wiki-entry.md docs/adr/ADR-0002-llm-wiki-foundation.md
git status --short
git commit -m "docs(#153): scaffold LLM wiki + schema + ADR-0002 + POC (PR-A)

Phase 1 PR-A: 새 디렉토리와 규약만 도입. 기존 파일 무수정.
- docs/wiki/schema/: SSOT 규약 7개 파일 (frontmatter, tags, links,
  ownership-matrix, conventions, harness, README)
- docs/wiki/wiki/: INDEX + harness/claude-code.md (POC 샘플)
- docs/agent/wiki-entry.md: 에이전트 진입 가이드
- docs/adr/ADR-0002-llm-wiki-foundation.md: 결정 기록

Spec: docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md

Closes part of #153"
git push origin chore/153-docs-harness-wiki
```

검증: `git log --oneline -3` — 신규 commit 최상단. PR #223에 반영되었는지 `gh pr view 223`.

---

## Task 2: PR-B — docs/agent/ Summary 허브 확장

**Purpose:** `docs/agent/`에 topic summary 파일 5개 추가 + `README.md` INDEX 갱신. 각 topic 폴더(`docs/architecture/` 등)는 건드리지 않는다.

**Files:**

- Create: `docs/agent/architecture-summary.md`
- Create: `docs/agent/api-summary.md`
- Create: `docs/agent/database-summary.md`
- Create: `docs/agent/design-system-summary.md`
- Create: `docs/agent/ai-playbook-summary.md`
- Modify: `docs/agent/README.md` (INDEX에 5 파일 + `wiki-entry.md` 등재)

**참고:** 모든 summary 파일은 `owner: llm`이며 템플릿(Purpose / Canonical sources / Key files & concepts / Gotchas / Recent changes)을 따른다. Phase 1에는 최소 실제 내용을 채우고 TODO 금지.

- [ ] **Step 2.1: `docs/agent/architecture-summary.md` 작성**

```markdown
---
title: Architecture — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [architecture, agent]
related:
  - docs/architecture/README.md
  - .planning/codebase/ARCHITECTURE.md
  - docs/wiki/schema/ownership-matrix.md
---

# Architecture — Agent Summary

## Purpose

Architecture 영역 진입점. 에이전트가 설계 의도(human-owned)와 자동 분석 스냅샷(LLM-owned)을 구분해 접근하도록 돕는다.

## Canonical sources

- 설계 의도: [`docs/architecture/README.md`](../architecture/README.md)
- 자동 분석 스냅샷: [`.planning/codebase/ARCHITECTURE.md`](../../.planning/codebase/ARCHITECTURE.md)
- 구조 스냅샷: [`.planning/codebase/STRUCTURE.md`](../../.planning/codebase/STRUCTURE.md)

## Key files / concepts

- `packages/web` — Next.js 16 프론트엔드 (메인)
- `packages/api-server` — Rust/Axum API (`AGENT.md` 참고)
- `packages/ai-server` — Python AI / gRPC
- `packages/shared` — 공용 TypeScript 타입·훅·Supabase 쿼리
- `packages/mobile` — Expo 앱

## Gotchas

- 설계 의도(`docs/architecture/`)와 스냅샷(`.planning/codebase/`)이 충돌하면 **스냅샷이 현재 상태**다. 설계 의도는 "원래 무엇을 의도했는지"이다.
- Next.js 16은 `proxy.ts` 사용 (`middleware.ts` 아님). 상세는 `.cursor/rules/monorepo.mdc` 또는 schema의 conventions.md 참조.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
```

검증: `grep -c "^## " docs/agent/architecture-summary.md` — 5 (Purpose / Canonical / Key / Gotchas / Recent).

- [ ] **Step 2.2: `docs/agent/api-summary.md` 작성**

```markdown
---
title: API — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [api, agent]
related:
  - docs/agent/api-v1-routes.md
  - packages/api-server/AGENT.md
  - docs/api/README.md
---

# API — Agent Summary

## Purpose

이 repo에는 두 개의 API 레이어가 있다: Next.js `/api/v1/*` (web)와 Rust/Axum API (`packages/api-server`). 각 레이어의 정본 진입점을 안내한다.

## Canonical sources

- Next.js API 라우트 표: [`docs/agent/api-v1-routes.md`](api-v1-routes.md)
- Rust API 상세: [`packages/api-server/AGENT.md`](../../packages/api-server/AGENT.md)
- API 문서 개요: [`docs/api/README.md`](../api/README.md)

## Key files / concepts

- Generated hooks: `packages/web/lib/api/generated/` (Orval 8.5.3 자동 생성, 수동 편집 금지)
- OpenAPI source: `packages/api-server/openapi.json`
- Regenerate: `cd packages/web && bun run generate:api`
- Zod schemas: `packages/web/lib/api/generated/zod/decodedApi.zod.ts`

## Gotchas

- Upload 엔드포인트 4개는 generation에서 제외된다 (multipart) — `orval.config.ts` transformer 참고.
- Custom mutator: `packages/web/lib/api/mutator/custom-instance.ts`. 여기에만 behavior 확장.
- API 추가 순서: Rust 백엔드 OpenAPI 업데이트 → `openapi.json` 복사 → `bun run generate:api`.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
```

검증: `grep -c "^## " docs/agent/api-summary.md` — 5.

- [ ] **Step 2.3: `docs/agent/database-summary.md` 작성**

```markdown
---
title: Database — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [db, agent]
related:
  - docs/database/01-schema-usage.md
  - docs/agent/warehouse-schema.md
  - docs/database/04-supabase-cli-setup.md
---

# Database — Agent Summary

## Purpose

Supabase 기반 이중 스키마 (public / warehouse) 구조의 진입점. 앱 데이터는 public, ETL·Seed 파이프라인은 warehouse.

## Canonical sources

- 스키마 사용법: [`docs/database/01-schema-usage.md`](../database/01-schema-usage.md)
- 데이터 흐름: [`docs/database/03-data-flow.md`](../database/03-data-flow.md)
- 업데이트 체크리스트: [`docs/database/02-update-checklist.md`](../database/02-update-checklist.md)
- Warehouse 스키마 인벤토리: [`docs/agent/warehouse-schema.md`](warehouse-schema.md)
- Supabase CLI setup: [`docs/database/04-supabase-cli-setup.md`](../database/04-supabase-cli-setup.md)

## Key files / concepts

- **Public schema**: 앱 데이터 (posts, items, users, solutions, social 등)
- **Warehouse schema**: ETL·Seed 파이프라인 (seed_candidates, review_queue, seed_images 등)
- Migration 전략: SeaORM (테이블·컬럼) + Supabase CLI (RLS·함수·warehouse)
- Types: `packages/shared/lib/supabase/types.ts` (typegen 재생성으로 drift 감지)

## Gotchas

- `solution.metadata.brand` 구조로 brand 정보 저장. FK 아님.
- Warehouse는 RLS 주의. 잘못된 정책은 ETL을 차단한다.
- `bun run generate:types` 아니라 별도 typegen 명령. memory의 "Supabase typegen" 참조.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
```

검증: `grep -c "^## " docs/agent/database-summary.md` — 5.

- [ ] **Step 2.4: `docs/agent/design-system-summary.md` 작성**

```markdown
---
title: Design System — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [design-system, ui, agent]
related:
  - docs/design-system/README.md
  - docs/agent/design-system-llm.md
---

# Design System — Agent Summary

## Purpose

decoded DS v2.0 진입점. 컴포넌트·토큰·사용 규칙을 에이전트가 빠르게 파악하도록 안내.

## Canonical sources

- 토큰/컴포넌트 목록: [`docs/design-system/`](../design-system/)
- LLM용 상세 인벤토리: [`docs/agent/design-system-llm.md`](design-system-llm.md)

## Key files / concepts

- `packages/web/app/globals.css` — Tailwind + DS 토큰
- `packages/web/lib/components/ds/` — DS 컴포넌트
- Pencil Screen 컨벤션: `docs/pencil-screen/` (레이아웃 레퍼런스)

## Gotchas

- DS 컴포넌트 import는 절대 경로 (`@/lib/components/ds/...`).
- `docs/agent/design-system-llm.md`가 **컴포넌트 import 경로의 정본**이다. 코드에서 추정하지 말고 이 파일을 확인.
- Tailwind 3.4 기준. v4 계열 문법 사용 금지.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
```

검증: `grep -c "^## " docs/agent/design-system-summary.md` — 5.

- [ ] **Step 2.5: `docs/agent/ai-playbook-summary.md` 작성**

```markdown
---
title: AI Playbook — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [agent, harness, claude-code, cursor]
related:
  - docs/ai-playbook/01-principles.md
  - docs/ai-playbook/02-workflow-overview.md
  - docs/ai-playbook/claude-profile.md
  - docs/ai-playbook/cursor-profile.md
---

# AI Playbook — Agent Summary

## Purpose

에이전트별(Claude / Cursor / Gemini / Codex) 사용 프로필 요약. 세션 시작 시 "어느 프로필을 읽어야 하는가"를 안내.

## Canonical sources

- 원칙: [`docs/ai-playbook/01-principles.md`](../ai-playbook/01-principles.md)
- 워크플로우: [`docs/ai-playbook/02-workflow-overview.md`](../ai-playbook/02-workflow-overview.md)
- Claude: [`docs/ai-playbook/claude-profile.md`](../ai-playbook/claude-profile.md)
- Cursor: [`docs/ai-playbook/cursor-profile.md`](../ai-playbook/cursor-profile.md)
- Gemini: [`docs/ai-playbook/gemini-profile.md`](../ai-playbook/gemini-profile.md)
- Codex: [`docs/ai-playbook/codex-profile.md`](../ai-playbook/codex-profile.md)

## Key files / concepts

- `CLAUDE.md` 루트 — Claude Code 진입점
- `.cursor/rules/*.mdc` — Cursor 규칙 (네이티브 포맷)
- `usage-log.md` — 세션 기록 (업데이트 시점에 따라 stale 가능)

## Gotchas

- Codex 프로필은 stale 가능성 있음 (구독 상태: "No Codex (미구독)"). Sub-4에서 deprecation 검토.
- Claude / Cursor는 같은 repo에서 공존. 충돌 영역은 `docs/wiki/schema/conventions.md`에서 관리.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
```

검증: `grep -c "^## " docs/agent/ai-playbook-summary.md` — 5.

- [ ] **Step 2.6: `docs/agent/README.md` INDEX 갱신**

기존 `docs/agent/README.md`를 읽고 하단의 문서 목록 표 또는 인덱스 섹션을 찾아 5개 summary 파일 + `wiki-entry.md`를 등재한다.

Read 후 Edit:

```
# 기존 파일 구조 확인
Read docs/agent/README.md
```

`wiki-entry.md`와 summary 파일 5개를 기존 테이블에 추가한다. 예시 변경 예:

```markdown
| 문서                                                                             | 용도                        |
| -------------------------------------------------------------------------------- | --------------------------- |
| [`docs/agent/README.md`](docs/agent/README.md)                                   | 목차·언제 무엇을 읽을지     |
| [`docs/agent/wiki-entry.md`](docs/agent/wiki-entry.md)                           | 🆕 `docs/wiki/` 진입 가이드 |
| [`docs/agent/architecture-summary.md`](docs/agent/architecture-summary.md)       | 🆕 아키텍처 summary         |
| [`docs/agent/api-summary.md`](docs/agent/api-summary.md)                         | 🆕 API summary              |
| [`docs/agent/database-summary.md`](docs/agent/database-summary.md)               | 🆕 DB summary               |
| [`docs/agent/design-system-summary.md`](docs/agent/design-system-summary.md)     | 🆕 DS summary               |
| [`docs/agent/ai-playbook-summary.md`](docs/agent/ai-playbook-summary.md)         | 🆕 AI playbook summary      |
| [`docs/agent/web-routes-and-features.md`](docs/agent/web-routes-and-features.md) | 웹 라우트·기능 영역         |

...
```

검증: `grep -c "summary.md\|wiki-entry.md" docs/agent/README.md` — 6 이상.

- [ ] **Step 2.7: 링크 resolve 검증**

Step 1.13과 동일한 스크립트를 Task 2 신규 파일들에 적용.

```bash
for f in docs/agent/architecture-summary.md docs/agent/api-summary.md docs/agent/database-summary.md docs/agent/design-system-summary.md docs/agent/ai-playbook-summary.md; do
  echo "=== $f ==="
  grep -Eo '\]\(([^)]+)\)' "$f" | sed 's/](//; s/)$//' | while read -r p; do
    case "$p" in
      http*) continue;;
      *) test -e "$(dirname "$f")/$p" || echo "  MISSING: $p";;
    esac
  done
done
```

검증 기대: `MISSING:` 0개.

- [ ] **Step 2.8: Commit + Push**

```bash
git add docs/agent
git status --short
git commit -m "docs(#153): add agent topic summaries + INDEX update (PR-B)

Phase 1 PR-B: docs/agent/를 topic summary 허브로 확장.
- docs/agent/architecture-summary.md
- docs/agent/api-summary.md
- docs/agent/database-summary.md
- docs/agent/design-system-summary.md
- docs/agent/ai-playbook-summary.md
- docs/agent/README.md INDEX에 6개 신규 파일 등재

Owner=llm 파일은 Sub-3 자동화 이후 주기적 갱신 대상.

Closes part of #153"
git push origin chore/153-docs-harness-wiki
```

검증: `git log --oneline -3`. PR #223 최신 커밋 반영 확인.

---

## Task 3: PR-C — Frontmatter 부여 + Consolidation Pointers

**Purpose:** 기존 `docs/agent/`·`docs/ai-playbook/` 파일에 프론트매터를 추가하고, `CLAUDE.md`·`.cursor/rules/monorepo.mdc`의 중복 convention 섹션을 `docs/wiki/schema/conventions.md`로 이관한 뒤 원 위치를 pointer로 축소한다.

**Files:**

- Modify: `docs/agent/monorepo.md` (프론트매터 추가)
- Modify: `docs/agent/api-v1-routes.md` (프론트매터)
- Modify: `docs/agent/warehouse-schema.md` (프론트매터)
- Modify: `docs/agent/web-hooks-and-stores.md` (프론트매터)
- Modify: `docs/agent/web-routes-and-features.md` (프론트매터)
- Modify: `docs/agent/design-system-llm.md` (프론트매터)
- Modify: `docs/agent/e2e-testing.md` (프론트매터)
- Modify: `docs/ai-playbook/01-principles.md` (프론트매터)
- Modify: `docs/ai-playbook/02-workflow-overview.md` (프론트매터)
- Modify: `docs/ai-playbook/claude-profile.md` (프론트매터)
- Modify: `docs/ai-playbook/cursor-profile.md` (프론트매터)
- Modify: `docs/ai-playbook/gemini-profile.md` (프론트매터)
- Modify: `docs/ai-playbook/codex-profile.md` (프론트매터)
- Modify: `docs/ai-playbook/usage-log.md` (프론트매터)
- Modify: `docs/wiki/schema/conventions.md` (실제 이관된 컨벤션 내용 채움)
- Modify: `CLAUDE.md` (컨벤션 섹션 pointer화)
- Modify: `.cursor/rules/monorepo.mdc` (중복 섹션 pointer화)
- Modify: `docs/README.md` (역할 헌법 갱신)

- [ ] **Step 3.1: 기존 `docs/agent/*.md` 7개 파일에 프론트매터 추가**

각 파일 상단에 다음 템플릿을 삽입한다 (파일별 `title`, `tags` 맞춤):

```yaml
---
title: <기존 H1 텍스트>
owner: human
status: approved
updated: 2026-04-17
tags: [agent, <domain tag>]
---
```

파일별 매핑:

| 파일                         | title                                     | tags 추가                |
| ---------------------------- | ----------------------------------------- | ------------------------ |
| `monorepo.md`                | "Monorepo — Agent Reference"              | `agent`, `architecture`  |
| `api-v1-routes.md`           | "API v1 Routes — Agent Reference"         | `agent`, `api`           |
| `warehouse-schema.md`        | "Warehouse Schema — Agent Reference"      | `agent`, `db`            |
| `web-hooks-and-stores.md`    | "Web Hooks & Stores — Agent Reference"    | `agent`, `ui`            |
| `web-routes-and-features.md` | "Web Routes & Features — Agent Reference" | `agent`, `ui`            |
| `design-system-llm.md`       | "Design System — LLM Reference"           | `agent`, `design-system` |
| `e2e-testing.md`             | "E2E Testing — Agent Reference"           | `agent`, `testing`       |

각 파일에서 `Read` → 상단 확인 → 기존 H1이 있으면 그 위에 YAML 프론트매터만 삽입 (기존 H1 보존).

검증: `head -7 docs/agent/<each>.md | grep -c "^title:"` — 각 파일마다 1.

- [ ] **Step 3.2: 기존 `docs/ai-playbook/*.md` 7개 파일에 프론트매터 추가**

동일 패턴. 파일별 매핑:

| 파일                      | title                             | tags                              |
| ------------------------- | --------------------------------- | --------------------------------- |
| `01-principles.md`        | "AI Playbook — Principles"        | `agent`, `harness`                |
| `02-workflow-overview.md` | "AI Playbook — Workflow Overview" | `agent`, `harness`                |
| `claude-profile.md`       | "Claude Profile"                  | `agent`, `claude-code`, `harness` |
| `cursor-profile.md`       | "Cursor Profile"                  | `agent`, `cursor`, `harness`      |
| `gemini-profile.md`       | "Gemini Profile"                  | `agent`, `harness`                |
| `codex-profile.md`        | "Codex Profile"                   | `agent`, `harness`, `deprecated`  |
| `usage-log.md`            | "AI Usage Log"                    | `agent`, `ops`                    |

`codex-profile.md`는 `deprecated` 태그 + `status: stale` 권장 (사용자가 "No Codex (미구독)" 명시).

검증: `grep -l "^title:" docs/ai-playbook/*.md | wc -l` — 7.

- [ ] **Step 3.3: `docs/wiki/schema/conventions.md` 실제 내용 채움**

Task 1.7의 골격을 실제 컨벤션 내용으로 대체한다. 현재 `CLAUDE.md`와 `.cursor/rules/monorepo.mdc`의 컨벤션 섹션을 읽고 교차 검증해 중복을 제거한 본문을 작성한다.

```bash
# 원본 참조
Read CLAUDE.md
Read .cursor/rules/monorepo.mdc
```

`conventions.md` 본문 (기존 프론트매터는 `status: approved`로 변경):

```markdown
---
title: Coding & Build Conventions
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/ownership-matrix.md
  - CLAUDE.md
  - .cursor/rules/monorepo.mdc
---

# Coding & Build Conventions

decoded-monorepo의 공통 컨벤션. `CLAUDE.md`와 `.cursor/rules/*.mdc`는 이 파일을 pointer로 참조한다.

## Package manager & Task runner

- **Package manager:** bun (yarn/npm 사용 금지)
- **Monorepo:** Turborepo (`turbo.json`)
- **Task runner:** [`Justfile`](../../../Justfile) — `just local-fe`, `just local-be`, `just --list`

## TypeScript / Lint

- TypeScript strict mode
- ESLint flat config (`eslint.config.mjs`), Node 22+
- Prettier

## Commit Convention

- [Conventional Commits](https://www.conventionalcommits.org/)
- Types: `feat` · `fix` · `docs` · `refactor` · `test` · `chore`

## Git hooks

- Clone 후 `just hook` 필수
- `main` 직접 push 차단
- 로컬 CI 활성화

## Environment

- `packages/web/.env.local` from `.env.local.example` (gitignored)
- 민감정보 (API keys, tokens)는 repo에 절대 포함 금지

## Supabase

- public schema (앱 데이터) + warehouse schema (ETL·Seed 파이프라인)
- RLS 정책 변경은 반드시 review.
- Type generation: 별도 typegen 명령 (`bun run generate:types` 아님)

## Next.js 16 특이사항

- `proxy.ts` 사용 (`middleware.ts` 아님)
- 자세한 repo-wide 컨벤션: [`.cursor/rules/monorepo.mdc`](../../../.cursor/rules/monorepo.mdc)

## Issue tracking

- 브랜치만 만들면 프로젝트 보드가 움직이지 않는다.
- `scripts/start-issue.sh <이슈번호> [type]` 또는 Draft PR(`Closes #N`) 생성 필수.
- [GIT-WORKFLOW](../../GIT-WORKFLOW.md) 참조.

## OMC 메타데이터 (.omc/)

- `.omc/project-memory.json`만 공용으로 tracked — 팀 공유.
- `sessions/`, `state/`, `plans/`, `research/`, `logs/`, `notepad.md` 등은 개인 세션, gitignored.
- `project-memory.json` 커밋 시 diff 확인 필수.

## Generated API code

- `packages/web/lib/api/generated/` 자동 생성, **수동 편집 금지**.
- Source of truth: `packages/api-server/openapi.json`
- Generator: Orval 8.5.3 — config: `packages/web/orval.config.ts`
- Regenerate: `cd packages/web && bun run generate:api`

## Notes

- 특정 도구(React, Rust, API routes) 전용 컨벤션: `.cursor/rules/{react-components,api-routes,rust-api}.mdc` 참조. 이 파일은 공용 컨벤션만 담는다.
```

검증: `grep -c "^## " docs/wiki/schema/conventions.md` — 10 이상.

- [ ] **Step 3.4: `CLAUDE.md` pointer화**

`CLAUDE.md`를 읽고 다음 섹션을 **축소**한다:

- "Tech stack (one line)"
- "Code style"
- "Important notes"
- "Generated API Code"
- "Git workflow" (이미 docs/GIT-WORKFLOW.md 링크 존재 — 그대로 유지)

축소된 구조:

```markdown
## Conventions (SSOT)

상세 컨벤션은 [`docs/wiki/schema/conventions.md`](docs/wiki/schema/conventions.md)를 참조한다. 이 파일은 agent routing과 docs 맵만 담는다.

주요 규칙 요약:

- bun + Turborepo
- Conventional Commits
- Next.js 16은 `proxy.ts` 사용
- `packages/web/lib/api/generated/`는 자동 생성, 수동 편집 금지
```

**주의:** "Agent reference", "Harness Workflow", "GSD Workflow", "Skill routing", "Documentation" 섹션은 건드리지 않는다 (routing 목적).

검증: `grep -c "docs/wiki/schema/conventions.md" CLAUDE.md` — 1 이상.

- [ ] **Step 3.5: `.cursor/rules/monorepo.mdc` 중복 섹션 축소**

`.cursor/rules/monorepo.mdc`를 읽고 다음 섹션을 축소한다:

- 일반적 코딩 컨벤션 (Conventional Commits, ESLint, TS strict 등)
- Package manager (bun), task runner
- Env 변수 주의사항

Cursor 네이티브 프론트매터(`globs`, `description`)와 React/Rust 등 특정 기술 패턴은 유지한다.

추가 pointer 라인:

```markdown
## Conventions (shared)

공용 컨벤션은 [`docs/wiki/schema/conventions.md`](../../docs/wiki/schema/conventions.md)를 참조한다. 이 파일은 Cursor 네이티브 규칙(globs, description)과 repo 특이사항만 유지한다.
```

검증: `grep -c "docs/wiki/schema/conventions.md" .cursor/rules/monorepo.mdc` — 1 이상.

- [ ] **Step 3.6: `docs/README.md` 역할 헌법 갱신**

기존 `docs/README.md`의 "문서 소유권 (Source of Truth)" 테이블에 새 항목을 추가한다:

```markdown
| 영역 | 위치 | 설명 |
| ---- | ---- | ---- |

...기존 행들...
| **컨벤션 (SSOT)** | `docs/wiki/schema/conventions.md` | Convention SSOT. CLAUDE.md와 .cursor/rules가 참조. |
| **태그 어휘** | `docs/wiki/schema/tags.md` | 프론트매터 tags 고정 어휘. |
| **Ownership Matrix** | `docs/wiki/schema/ownership-matrix.md` | 정본 매트릭스. |
| **LLM 누적 지식** | `docs/wiki/wiki/` | LLM이 누적하는 하네스·운영 knowledge. |
```

추가로 `docs/agent/`의 설명을 "에이전트 entry 맵 + topic summary 허브"로 갱신.

검증: `grep -c "docs/wiki/" docs/README.md` — 3 이상.

- [ ] **Step 3.7: 전체 파일 프론트매터 검사**

```bash
# 모든 신규/수정 파일의 프론트매터 필수 필드 존재 확인
for f in $(find docs/agent docs/ai-playbook docs/wiki -type f -name '*.md' -not -path '*/node_modules/*'); do
  for required in title owner status updated tags; do
    grep -q "^${required}:" "$f" || echo "  MISSING ${required} in ${f}"
  done
done
```

검증 기대: `MISSING` 0건.

- [ ] **Step 3.8: 링크 resolve 최종 검증**

```bash
# 모든 docs/ 문서의 내부 링크 resolve
for f in $(find docs -type f -name '*.md'); do
  grep -Eo '\]\(([^)h][^)]*)\)' "$f" | sed 's/](//; s/)$//' | while read -r p; do
    [ -z "$p" ] && continue
    case "$p" in
      \#*) continue;;
      http*) continue;;
      mailto:*) continue;;
      *)
        target="$(dirname "$f")/${p%%#*}"
        test -e "$target" || echo "  BROKEN: $p (from $f)"
        ;;
    esac
  done
done
```

검증 기대: `BROKEN:` 0건. 있다면 수정 후 재실행.

- [ ] **Step 3.9: Commit + Push**

```bash
git add docs CLAUDE.md .cursor/rules/monorepo.mdc
git status --short
git commit -m "docs(#153): add frontmatter + consolidate conventions (PR-C)

Phase 1 PR-C: 기존 파일 프론트매터 + CLAUDE.md / .cursor/rules 축소.
- docs/agent/*.md 7개 + docs/ai-playbook/*.md 7개에 프론트매터
- docs/wiki/schema/conventions.md에 공용 컨벤션 본문 이관
- CLAUDE.md의 컨벤션 섹션을 pointer로 축소 (routing 보존)
- .cursor/rules/monorepo.mdc 공용 섹션 pointer화 (Cursor 특이사항 유지)
- docs/README.md 역할 헌법 갱신

Closes #153"
git push origin chore/153-docs-harness-wiki
```

검증: `git log --oneline -5`. PR #223 commit 3개(Task 1·2·3) 반영 확인.

---

## Task 4: Follow-up — Sub-3 / Sub-4 이슈 등록

**Purpose:** 후속 phase 이슈를 명시적으로 등록해 plan이 "Phase 1 완료 = 프로젝트 종료"로 오인되는 것을 방지.

- [ ] **Step 4.1: Sub-3 이슈 생성 — "feat(docs): LLM wiki validator/linker/ingest CLI"**

```bash
gh issue create --repo decodedcorp/decoded \
  --title "feat(docs): LLM wiki validator/linker/ingest CLI (Sub-3)" \
  --label "enhancement,tech-debt,tooling" \
  --body "$(cat <<'EOF'
## Context

Phase 1(#153)에서 `docs/wiki/schema/` 규약과 `docs/wiki/wiki/` 누적 구조를 도입했다. Sub-3은 이를 유지하는 자동화 CLI를 구축한다.

## Scope

- `bun run wiki:lint` — 프론트매터 필수 필드 검증 (title, owner, status, updated, tags), tags.md 어휘 검증, H1/title 일치 검증, 경로 존재성 검증
- `bun run wiki:links` — `related:` 필드 역링크 반영 + 깨진 링크 목록 출력
- `bun run wiki:ingest <topic>` — LLM이 `docs/wiki/wiki/<topic>/`에 새 노트 추가 시 프론트매터·INDEX.md 자동 갱신

## Integration

- `scripts/git-pre-push.sh`에서 `wiki:lint` 실행
- CI에서도 동일

## References

- Spec: `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md` §10.1
- ADR: `docs/adr/ADR-0002-llm-wiki-foundation.md`
- Related to #153
EOF
)"
```

검증: 명령 성공 시 issue URL 출력. `gh issue list --search "LLM wiki validator"` 확인.

- [ ] **Step 4.2: Sub-4 이슈 생성 — "chore(harness): CLAUDE.md / .cursor/rules 전면 리팩토링"**

```bash
gh issue create --repo decodedcorp/decoded \
  --title "chore(harness): CLAUDE.md / .cursor/rules 전면 리팩토링 (Sub-4)" \
  --label "documentation,tech-debt" \
  --body "$(cat <<'EOF'
## Context

Phase 1(#153) PR-C에서 `CLAUDE.md`와 `.cursor/rules/monorepo.mdc`의 공용 컨벤션 섹션을 `docs/wiki/schema/conventions.md`로 이관하고 pointer화했다. Sub-4는 남은 전면 리팩토링을 수행한다.

## Scope

- `CLAUDE.md` routing·harness 섹션 재정비
- `.cursor/rules/*.mdc` (react-components, api-routes, rust-api 등) schema 참조 일관화
- `/ingest`, `/wiki` 같은 Claude Code custom slash command 정의 (`.claude/commands/`)
- `docs/ai-playbook/` stale 콘텐츠 (Codex 등) deprecation
- Sub-3 CLI와 통합 (pre-push, CI)

## References

- Spec: `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md` §10.2
- ADR: `docs/adr/ADR-0002-llm-wiki-foundation.md`
- Related to #153, 의존: Sub-3
EOF
)"
```

검증: issue URL 출력.

- [ ] **Step 4.3: Phase 1 완료 체크**

```bash
# Phase 1 3개 commit이 chore/153-docs-harness-wiki에 반영되었는지
git log --oneline dev..HEAD
# 성공 기준 파일 존재 체크
test -d docs/wiki/schema && echo "schema ok"
test -d docs/wiki/wiki && echo "wiki ok"
test -f docs/adr/ADR-0002-llm-wiki-foundation.md && echo "ADR ok"
test -f docs/agent/architecture-summary.md && echo "summary ok"
grep -q "docs/wiki/schema/conventions.md" CLAUDE.md && echo "CLAUDE.md pointer ok"
```

검증: 모든 `ok` 출력.

- [ ] **Step 4.4: Draft → Ready for review 전환**

```bash
gh pr ready 223 --repo decodedcorp/decoded
gh pr view 223 --repo decodedcorp/decoded --json state,isDraft
```

검증: `isDraft=false`, `state=OPEN`.

---

## Success Criteria (spec §12 대응)

### Activity

- [x] `docs/wiki/schema/` 7개 파일 (README, frontmatter, tags, links, ownership-matrix, conventions, harness) — Task 1
- [x] `docs/wiki/wiki/INDEX.md` + POC 1건 — Task 1
- [x] `docs/adr/ADR-0002-llm-wiki-foundation.md` — Task 1
- [x] `docs/agent/` summary 파일 5개 + `wiki-entry.md` — Task 1, 2
- [x] 기존 `docs/agent/*.md`·`docs/ai-playbook/*.md` 프론트매터 — Task 3
- [x] `CLAUDE.md`·`.cursor/rules/monorepo.mdc` pointer 축소 — Task 3
- [x] 3개 PR로 분리 (또는 chore/153 단일 브랜치의 3 commit) — Task 1·2·3
- [x] Sub-3·Sub-4 이슈 생성 — Task 4

### Outcome (측정은 후속 phase)

- **O1**: 컨벤션 조회 파일 수 4+ → 1. Phase 1 이후 `docs/wiki/schema/conventions.md` 단일 진입.
- **O2**: Topic 진입 파일 수 4 → 1. `docs/agent/<topic>-summary.md` 단일 진입.
- **O3**: Drift 감지 (Sub-3 이후 측정).
- **O4**: 새 세션 온보딩 경로 3-step 고정 (Sub-4 이후 정량).

---

## Notes

- `docs/` 내 markdown 이외 파일은 건드리지 않는다.
- 기존 파일 수정은 최소 변경 원칙. 프론트매터 삽입과 pointer 축소만 수행.
- `.planning/codebase/**`는 어느 Task에서도 수정하지 않는다 (자동 생성물 보존).
- 모든 commit은 `Closes part of #153` / `Closes #153` 지시 포함.
- 커밋 사이 push는 Auto mode에서 사용자 승인이 요구될 수 있다. 3 commit 후 일괄 push 또는 commit당 push 중 택일 (본 plan은 Task 종료 시 push).
