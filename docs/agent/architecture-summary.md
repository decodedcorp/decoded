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
- **두 Supabase 프로젝트 분리 (#333)**: [`docs/architecture/assets-project.md`](../architecture/assets-project.md) — prod(검증본) + assets(파이프라인 스테이징)
- 자동 분석 스냅샷: [`.planning/codebase/ARCHITECTURE.md`](../../.planning/codebase/ARCHITECTURE.md)
- 구조 스냅샷: [`.planning/codebase/STRUCTURE.md`](../../.planning/codebase/STRUCTURE.md)

## Key files / concepts

- `packages/web` — Next.js 16 프론트엔드 (메인)
- `packages/api-server` — Rust/Axum API (`AGENT.md` 참고). **두 DB 풀 보유**: prod (`db`) + assets (`assets_db`) (#333)
- `packages/ai-server` — Python AI / gRPC. raw_posts 파이프라인은 assets 에 직접 write
- `packages/shared` — 공용 TypeScript 타입·훅·Supabase 쿼리
- `packages/mobile` — Expo 앱
- `supabase/` — prod Supabase 마이그레이션 (검증본 데이터)
- `supabase-assets/` — assets Supabase 마이그레이션 (raw_posts 파이프라인) (#333)

## Gotchas

- 설계 의도(`docs/architecture/`)와 스냅샷(`.planning/codebase/`)이 충돌하면 **스냅샷이 현재 상태**다. 설계 의도는 "원래 무엇을 의도했는지"이다.
- Next.js 16은 `proxy.ts` 사용 (`middleware.ts` 아님). 상세는 `.cursor/rules/monorepo.mdc` 또는 schema의 conventions.md 참조.

## Recent changes

- 2026-04-26: Supabase 프로젝트 분리 (#333) — prod / assets 두 프로젝트, 검증(verify) 플로우, warehouse 스키마 드롭 + entities public 이관 (#335)
- 2026-04-17: 초기 작성 (Phase 1)
