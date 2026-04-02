# Phase 57: Editorial Layout & Detail View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 057-editorial-layout-detail-view
**Areas discussed:** Pretext 적용 범위, 동작 방식, 페이지 범위

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Pretext 적용 범위 | 상세페이지 어떤 텍스트 영역에 pretext를 적용할지 | |
| Editorial 레이아웃 스타일 | Editorial 페이지 자체의 매거진 스타일 레이아웃 | |
| Spot+Solution 풀 디스플레이 | editorial 상세 뷰에서 spot과 solution 정보 풀 디스플레이 | |
| 상세 뷰 진입 방식 | Editorial 카드 클릭 시 진입 UX | |

**User's choice:** 전체 선택했으나, "지금 상세 페이지는 잘 된거같아서 pretext 적용만 하면될거같은데" — pretext 적용에 집중

---

## Pretext 적용 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 모든 텍스트 영역 | title, subtitle, editorial paragraphs, pull_quote, item descriptions, AI summary 전체 | ✓ |
| 매거진 섹션만 | MagazineTitleSection + MagazineEditorialSection만 강화 | |
| 현재 상태 유지 | title + pull_quote 측정만 | |

**User's choice:** 모든 텍스트 영역
**Notes:** CLS 0 목표

---

## 동작 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 높이 예약 + 페이드인 | pretext로 측정한 높이를 minHeight로 설정 → 텍스트 로드 후 부드러운 페이드인 | ✓ |
| 높이 예약만 | minHeight 설정만 — 애니메이션 없이 즉시 표시 | |
| You decide | Claude가 영역별로 적합한 방식 선택 | |

**User's choice:** 높이 예약 + 페이드인 (현재 MagazineTitleSection 패턴 확장)

---

## 페이지 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 페이지 작업 제외 | Phase 57은 상세페이지 pretext 적용만 | |
| 매거진 스타일 레이아웃 | editorial 페이지를 매거진 스타일로 변경 | |
| You decide | Claude가 범위 결정 | |

**User's choice:** (직접 입력) "/editorial 페이지는 없는거야 /explore 과 post/ 상세페이지만 있는건데"
**Notes:** /editorial 라우트 자체가 없음. 실제로는 /explore와 /posts/[id]만 존재

---

## Claude's Discretion

- 각 텍스트 영역별 font/lineHeight 파라미터
- useTextLayout vs useBatchTextLayout vs useTextTruncation 훅 선택
- 페이드인 애니메이션 세부 타이밍

## Deferred Ideas

None — discussion stayed within phase scope
