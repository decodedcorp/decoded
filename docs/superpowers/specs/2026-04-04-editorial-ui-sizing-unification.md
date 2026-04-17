---
title: Editorial UI Sizing Unification
owner: human
status: draft
updated: 2026-04-04
tags: [ui]
---

# Editorial UI Sizing Unification

**Date:** 2026-04-04
**Scope:** explore-preview (right panel), full editorial page, mobile/desktop
**Branch:** feat/phase1-remaining

## Problem

아티스트 프로필, 아이템 이미지, 브랜드 로고의 크기가 작고, explore-preview(오른쪽 패널)와 full page 간 사이즈 불일치.
Similar Items가 메인 아이템보다 시각적으로 큰 문제.

## Design Decisions

### 1. Artist Profile — 가운데 정렬 + 크기 확대

**대상 파일:** `packages/web/lib/components/detail/ImageDetailContent.tsx`
**대상 위치:** 2곳 (explore-preview 라인 288-313, full page 라인 347-372)

| 속성            | Before                                          | After                                                      |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| 레이아웃        | `flex items-center gap-3 px-6 py-3` (왼쪽 수평) | `flex flex-col items-center gap-2 px-6 py-5` (가운데 수직) |
| 이미지 크기     | `w-8 h-8` (32px)                                | `w-12 h-12` (48px)                                         |
| 이름 폰트       | `text-sm font-semibold` (14px)                  | `text-lg font-semibold` (18px)                             |
| 라벨 폰트       | `text-[10px]`                                   | `text-[11px]`                                              |
| Fallback 아바타 | `w-8 h-8 text-xs`                               | `w-12 h-12 text-base`                                      |

두 위치 모두 동일한 스타일 적용 (explore-preview와 full page 통일).

### 2. Magazine Items — 아이템 이미지 확대

**대상 파일:** `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx`

| 속성           | Before (compact)  | Before (full)         | After (compact)       | After (full)                 |
| -------------- | ----------------- | --------------------- | --------------------- | ---------------------------- |
| 이미지 wrapper | `md:w-36 lg:w-40` | `md:w-60 lg:w-64`     | `md:w-48 lg:w-52`     | `md:w-60 lg:w-64` (유지)     |
| 브랜드 로고    | `w-5 h-5` (20px)  | `w-5 h-5` (20px)      | `w-7 h-7` (28px)      | `w-7 h-7` (28px)             |
| 브랜드 텍스트  | `text-[10px]`     | `typography-overline` | `typography-overline` | `typography-overline` (통일) |

### 3. Similar Items — 변경 없음

현재 compact에서 `size="thumbnail"` (56px), full에서 `size="card"`.
메인 아이템이 커지면 자연스럽게 비율 해결.

## Files to Modify

1. **`packages/web/lib/components/detail/ImageDetailContent.tsx`**
   - 아티스트 프로필 섹션 2곳: 가운데 정렬 + 크기 증가

2. **`packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx`**
   - compact 모드 아이템 이미지 wrapper 크기 증가
   - 브랜드 로고 크기 증가 (compact + full 모두)
   - 브랜드 텍스트 통일

## Out of Scope

- ShopGrid (non-magazine post) — 이번 변경 대상 아님
- ShopCarouselSection — 별도 컴포넌트, 이번 대상 아님
- Similar Items 크기 — 메인 아이템 확대로 자연 해결
- compact/full 분기 구조 자체 — 유지
- 애니메이션/GSAP — 변경 없음

## Success Criteria

- [ ] 아티스트 프로필: 48px 이미지, 18px 이름, 가운데 정렬 (모든 뷰)
- [ ] 메인 아이템 이미지: compact md:w-48, full md:w-60 유지
- [ ] 브랜드 로고: 28px (모든 뷰)
- [ ] 브랜드 텍스트: typography-overline 통일
- [ ] 오른쪽 패널 / full page / 모바일 / 데스크탑 모두 일관된 사이즈
- [ ] 기존 GSAP 애니메이션 깨지지 않음
- [ ] 빌드 성공
