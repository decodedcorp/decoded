---
title: Database — Agent Summary
owner: llm
status: draft
updated: 2026-04-25
tags: [db, agent]
related:
  - docs/database/01-schema-usage.md
  - docs/architecture/assets-project.md
  - docs/database/04-supabase-cli-setup.md
---

# Database — Agent Summary

## Purpose

decoded 는 **두 개의 Supabase 프로젝트**를 사용한다 (#333):

- **prod** — 검증본 데이터 (`public.posts`, `users`, `solutions`, `artists`/`groups`/`brands` 등). 실서비스 source of truth.
- **assets** — 파이프라인 스테이징 (`public.raw_post_sources`, `public.raw_posts`, `public.pipeline_events`). admin 검증 전 raw 데이터 격리.

prod 는 assets 의 존재를 모르고, assets 도 prod 를 모른다 (cross-project FK 없음). 자세한 설계는 [`docs/architecture/assets-project.md`](../architecture/assets-project.md).

> 레거시 `warehouse` 스키마는 #335 에서 prod 에서 완전 드롭됐다. 이전 warehouse 엔티티(`artists`, `groups`, `brands`, `group_members`, `admin_audit_log`, `instagram_accounts`)는 모두 `public.*` 로 이관됨. raw_post*/seed_*/posts(legacy)/images 는 drop 또는 assets 이관.

## Canonical sources

- 스키마 사용법: [`docs/database/01-schema-usage.md`](../database/01-schema-usage.md)
- 데이터 흐름: [`docs/database/03-data-flow.md`](../database/03-data-flow.md)
- 업데이트 체크리스트: [`docs/database/02-update-checklist.md`](../database/02-update-checklist.md)
- assets 프로젝트 설계: [`docs/architecture/assets-project.md`](../architecture/assets-project.md)
- 마이그레이션 SOT: [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md)
- Supabase CLI setup: [`docs/database/04-supabase-cli-setup.md`](../database/04-supabase-cli-setup.md)

## Key files / concepts

- **prod public schema**: 앱 데이터 (posts, items, users, solutions, social 등) + 엔티티 카탈로그 (artists/groups/brands, #333)
- **assets public schema**: 파이프라인 스테이징 (raw_post_sources, raw_posts, pipeline_events) + 5-state 상태머신
- Migration 전략:
    - prod: SeaORM (테이블·컬럼) + Supabase CLI SQL (RLS·함수, `supabase/migrations` 가 SOT, #282)
    - assets: Supabase CLI SQL only (`supabase-assets/migrations/`). SeaORM 은 assets 를 건드리지 않음.
- Types: `packages/web/lib/supabase/*-types.ts` (typegen 재생성으로 drift 감지)

## Gotchas

- `solution.metadata.brand` 구조로 brand 정보 저장. FK 아님.
- assets pool 분리: api-server 의 `state.db` ≠ `state.assets_db`. raw_posts 도메인은 반드시 `assets_db` 사용.
- `APP_ENV=local` 에선 verify 가 cloud assets 에 status=VERIFIED 를 기록하지 않는다 (cloud 오염 방지).
- `bun run generate:types` 아니라 별도 typegen 명령. memory의 "Supabase typegen" 참조.

## Recent changes

- 2026-04-25: warehouse 스키마 드롭 + assets 프로젝트 분리 반영 (#333 / #335)
- 2026-04-17: 초기 작성 (Phase 1)
