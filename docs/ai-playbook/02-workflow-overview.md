---
title: AI Playbook — Workflow Overview
owner: human
status: approved
updated: 2026-04-23
tags: [agent, harness]
---

# AI Playbook — Workflow Overview

**최종 검증**: 2026-04-23
**버전**: 1.1

> 2026-04-23 (#232 Sub-4): Codex 기반 단계를 제거하고 현행 하네스 (Claude + gstack + GSD) 중심으로 재정비. 상세는 [`docs/ai-playbook/codex-profile.md`](codex-profile.md) deprecation 배너 참조.

## 기본 기능 워크플로우

새 기능을 구현하기 위한 표준 파이프라인입니다. 이 프로젝트에서 AI 도구들이 어떻게 협업하는지 이해하려면 먼저 이것을 읽으세요.

### 1. 정의

- GitHub Issue를 생성하거나 다듬습니다.
- `/gsd:discuss-phase N` → `/gsd:plan-phase N`으로 `.planning/phase-N/PLAN.md`를 생성합니다.
  - 스펙이 GitHub Issue 단위라면 gstack `/plan-eng-review`가 보조 아키텍처 검토를 제공합니다.
  - (이전에 사용하던 `Codex + docs/prompts/codex/spec-from-issue.md` 경로는 2026-04-23부로 폐기.)

### 2. 검토

- gstack의 `/plan-eng-review`를 사용하여:
  - 가정, 엣지 케이스, 위험 요소를 확인합니다.
  - `docs/ai-playbook/01-principles.md`와 정렬합니다.

### 3. 구현

- Cursor 또는 Claude Code를 메인 코딩 어시스턴트로 사용:
  - 스펙을 읽습니다.
  - `.cursor/rules/*` (base + frontend + ai-collab) 또는 `CLAUDE.md`를 적용합니다.
  - 작은 커밋으로 변경사항을 구현합니다. 커밋 규약은 [`docs/wiki/wiki/harness/commit-protocol.md`](../wiki/wiki/harness/commit-protocol.md).

### 4. 문서화

- Gemini와 `docs/prompts/gemini/feature-doc.md`를 사용하여:
  - `docs/features/<feature-id>.md`를 생성합니다.
  - 릴리스 노트용 짧은 요약을 작성합니다.

### 5. 로그 & 회고

- `docs/ai-playbook/usage-log.md`에 한 항목을 추가합니다:
  - 날짜
  - 작업
  - 사용한 도구 (그리고 사용하지 않은 도구 + 이유)
  - 잘 된 점 / 혼란스러웠던 점

이 단일 워크플로우가 대부분의 기능 작업을 커버합니다. 특정 사용 사례는 도구 프로필을 참조하세요.

## 기타 워크플로우

### 간단한 리팩토링

1. **Claude**: 코드를 분석하고 리팩토링 계획을 제안
2. **Cursor / Claude Code**: 계획에 따라 리팩토링 적용

### 버그 수정

1. **Claude / gstack `/investigate`**: 근본 원인 조사 (이전 "Codex 버그 수정 스펙 생성" 단계 대체)
2. **Cursor / Claude Code**: 수정 구현
3. **Gemini**: 수정 문서화 (선택사항)

## 통합 노트

- **Harness Workflow**: gstack(기획/QA) + Superpowers(TDD) + GSD quick(유지보수). 상세: `CLAUDE.md`의 Harness Workflow 섹션 참조.
- **Cursor Rules** (`.cursor/rules/`): Cursor 사용 시 자동 적용됩니다.
- **템플릿**: Gemini용 템플릿은 `docs/prompts/gemini/`에 있습니다. `docs/prompts/codex/`는 Codex 경로와 함께 deprecated — 새 작업에서 참조하지 않습니다.
