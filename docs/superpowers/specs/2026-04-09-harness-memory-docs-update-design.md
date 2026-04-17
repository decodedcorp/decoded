---
title: Harness Memory & Docs Update Design
owner: human
status: draft
updated: 2026-04-09
tags: [harness, agent]
---

# Harness Memory & Docs Update Design

**Date:** 2026-04-09
**Scope:** 메모리 정리, docs/agent/, .planning/codebase/, CLAUDE.md 델타 업데이트

## Context

v1.0.1 이후 main에 10+ 커밋이 머지되었으나 메모리/문서가 미반영 상태.
주요 신규 기능: seed-ops admin (#125), SEO (#115), editorial redesign (#111), news pipeline (#117), Ollama vision (#106), image optimization (#122), hero hotfix (#124).

## Approach

병렬 에이전트 4개로 동시 실행, 델타(변경분만) 업데이트.

## 1. Memory Cleanup

### 삭제

- `project_current_milestone_v10.md` (빈 파일)
- `project_main_page_redesign.md` (빈 파일)

### 업데이트

- `project_current_milestone_v11.md` — v1.0.1 이후 완료 작업 반영
- `project_main_page_renewal.md` — editorial redesign 반영

### 신규

- seed-ops admin 마이그레이션 메모리
- SEO 인프라 메모리

### MEMORY.md

- 빈 파일 제거, 신규 항목 추가

## 2. docs/agent/ Delta

코드 스캔 후 변경분 반영:

- `web-routes-and-features.md` — 신규 라우트 (admin entities, auth, og, sitemap)
- `api-v1-routes.md` — search route 변경, admin API 추가
- `web-hooks-and-stores.md` — 신규 훅/스토어
- `warehouse-schema.md` — seed-ops 테이블 변경

## 3. .planning/codebase/ Delta

3/27 이후 변경분:

- `STACK.md` — 의존성 버전
- `ARCHITECTURE.md` — SEO, admin layers
- `STRUCTURE.md` — 신규 디렉토리/파일
- 나머지는 변경 필요시만

## 4. CLAUDE.md Verification

- docs/agent/ 테이블 참조 정확성
- Tech stack one-line
- Overview에 신규 기능 영역 반영
- Generated API Code 섹션

## Execution

4개 영역을 background agent로 병렬 실행.
각 에이전트가 변경 리포트 제출 → 메인에서 취합 리뷰 → 적용.
