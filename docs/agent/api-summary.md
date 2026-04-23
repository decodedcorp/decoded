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
