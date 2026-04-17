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
