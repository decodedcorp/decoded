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
- **Task runner:** [Justfile](../../../Justfile) — `just local-fe`, `just local-be`, `just --list`

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
- RLS 정책 변경은 반드시 review
- Type generation: 별도 typegen 명령 (`bun run generate:types` 아님)

## Next.js 16 특이사항

- `proxy.ts` 사용 (`middleware.ts` 아님)
- 자세한 repo-wide 컨벤션: [.cursor/rules/monorepo.mdc](../../../.cursor/rules/monorepo.mdc)

## Issue tracking

- 브랜치만 만들면 프로젝트 보드가 움직이지 않는다
- `scripts/start-issue.sh <이슈번호> [type]` 또는 Draft PR(`Closes #N`) 생성 필수
- [GIT-WORKFLOW](../../GIT-WORKFLOW.md) 참조

## OMC 메타데이터 (.omc/)

- `.omc/project-memory.json`만 공용으로 tracked — 팀 공유
- `sessions/`, `state/`, `plans/`, `research/`, `logs/`, `notepad.md` 등은 개인 세션, gitignored
- `project-memory.json` 커밋 시 diff 확인 필수

## Generated API code

- `packages/web/lib/api/generated/` 자동 생성, **수동 편집 금지**
- Source of truth: `packages/api-server/openapi.json`
- Generator: Orval 8.5.3 — config: `packages/web/orval.config.ts`
- Regenerate: `cd packages/web && bun run generate:api`

## Notes

- 특정 도구(React, Rust, API routes) 전용 컨벤션: `.cursor/rules/{react-components,api-routes,rust-api}.mdc` 참조. 이 파일은 공용 컨벤션만 담는다.
