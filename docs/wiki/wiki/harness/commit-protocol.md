---
title: Commit Protocol — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-23
tags: [harness, agent, git, commit]
related:
  - CLAUDE.md
  - docs/GIT-WORKFLOW.md
  - docs/wiki/schema/conventions.md
  - packages/api-server/CLAUDE.md
---

# Commit Protocol

Conventional Commits + 패키지 스코프 + 사전 체크가 전제. 로컬에서 실패할 체크는 커밋하지 않는다.

## Message format

`<type>(<scope>): <subject>` — Conventional Commits 준수.

- **type**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`, `style`
- **scope**: 보통 패키지 이름. `web`, `api-server`, `ai-server`, `shared`, `mobile` 중 하나. 여러 패키지에 걸친 구조 변경은 `monorepo` / `harness` / `docs` 사용.
- **subject**: 60자 내, 명령형, 마침표 없음.

예:

- `feat(web): add editorial carousel skeleton`
- `fix(api-server): swap admin middleware layer order (#257 follow-up)`
- `chore(harness): promote *-summary.md as first-read in CLAUDE.md`

## Scope by package

- `packages/web/**` → `web`
- `packages/api-server/**` → `api-server`
- `packages/ai-server/**` → `ai-server`
- `packages/shared/**` → `shared`
- `packages/mobile/**` → `mobile`
- `docs/**`, `.cursor/**`, `CLAUDE.md` → `docs` 또는 `harness`
- 여러 패키지 동시 변경 → `monorepo`

여러 커밋으로 분할하는 편이 진단에 유리하다 — 패키지 경계를 넘어가는 단일 커밋은 지양.

## Pre-commit checks

리포의 pre-push hook(`just ci-web`, `cargo check` 등)은 로컬에서 먼저 돌린다. 실패한 채로 push하지 말 것.

### web / shared (TypeScript)

```bash
bun run lint
just ci-web   # lint + format + tsc
```

### api-server (Rust)

```bash
cargo fmt --check
cargo check
# 필요시: cargo clippy --all-targets
```

추가 규칙은 [`packages/api-server/CLAUDE.md`](../../../../packages/api-server/CLAUDE.md) §1 참고 — 라인 카운트 업데이트, REQUIREMENT.md 변경 이력 등.

### docs

- 내부 링크 깨짐 여부를 에디터 프리뷰로 확인.
- YAML frontmatter 유지(owner / status / updated / tags).

## Branch / PR 범위

- **Feature branch 1개 = PR 1개 = 이슈 1개**가 기본.
- 작은 cross-cutting chore는 묶어도 되지만, 패키지가 2개 이상 바뀌면 PR 설명에 각 패키지의 영향 범위를 명시.
- `feat`와 `refactor`를 섞지 않는다 — 리뷰어가 diff에서 기능 변경과 기계적 변경을 분리할 수 있어야 한다.
- 생성 코드(`packages/web/lib/api/generated/**`)는 **커밋하지 않는다** — diff에 등장하면 revert 대상.

## Forbidden

- `--no-verify`, `--no-gpg-sign`: 훅/서명을 의도적으로 우회하지 않는다.
- `git push --force` to `main` / `dev`: 금지. feature 브랜치에만 허용, 그마저도 `--force-with-lease`.
- Amend after push: PR 리뷰가 시작된 뒤엔 amend 대신 **새 커밋**으로 대응.
- secrets (.env, token, key) 커밋: 사고 발생 시 rotate + `git-filter-repo`로 이력 정리.

## Co-author / attribution

- AI 생성 보조가 있을 때는 trailer에 명시:
  - `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- 여러 에이전트 협업이면 각 에이전트를 trailer에 나열.

## Recent changes

- 2026-04-23: 초기 작성 (Phase 1 Finding 2 follow-up, #232)
