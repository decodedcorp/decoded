---
title: Explore Modal Scroll Optimization
owner: human
status: draft
updated: 2026-04-04
tags: [ui]
---

# Explore Modal Scroll Optimization

**Date:** 2026-04-04
**Issue:** #86
**Branch:** fix/explore-scroll-optimization
**Type:** Bug fix only — no feature or design changes

## Problem

Explore 모달의 좌/우 패널 스크롤이 버벅거리고 타이밍이 맞지 않음.

## Root Causes (debugging 분석)

### P0: Double-scroll (50-70% 영향)

- **파일:** `ImageDetailModal.tsx:126-128`
- **원인:** `onWheel` 핸들러가 `scrollBy()` 호출하면서 `preventDefault()` 없이 브라우저 기본 스크롤도 동시 발생
- **결과:** ScrollTrigger 이중 발동 → activeIndex 빈번 변경 → 이미지 애니메이션 중단/재시작

### P1: ScrollTrigger 초기화 지연 (20-30% 영향)

- **파일:** `MagazineItemsSection.tsx:119`, `InteractiveShowcase.tsx:114`
- **원인:** 고정 `setTimeout(700ms/300ms)` — 모달 열림 후 스크롤 동기화 미작동 구간 존재
- **결과:** 초기 스크롤 시 activeIndex 업데이트 안 됨 → 이미지 점프

### P2a: Passive 리스너 미지정 (10-20% 영향)

- **파일:** `ConnectorLayer.tsx:126`
- **원인:** scroll 이벤트 리스너에 `{ passive: true }` 미지정
- **결과:** 브라우저 스크롤 렌더링 차단 가능

### P2b: GSAP 애니메이션 경쟁 (5-10% 영향)

- **파일:** `ImageCanvas.tsx`
- **원인:** `onLeave(null)` + `onEnter(newIndex)` 거의 동시 발생 시 reset과 pan/zoom 애니메이션 경쟁
- **결과:** 이미지 전환 시 깜빡거림

## Fixes

### Fix 1: Double-scroll 제거

**파일:** `ImageDetailModal.tsx`

React `onWheel` 대신 native `addEventListener('wheel', handler, { passive: false })` 사용.
`e.preventDefault()`로 왼쪽 패널의 브라우저 기본 스크롤 차단.
오른쪽 드로어에 `scrollBy({ top: e.deltaY })` 만 전파.

`useEffect`에서 등록/해제. 왼쪽 이미지 컨테이너에만 적용.

### Fix 2: ScrollTrigger 조건부 초기화

**파일:** `MagazineItemsSection.tsx`, `InteractiveShowcase.tsx`

`setTimeout(700ms)` → `ResizeObserver` 또는 `requestAnimationFrame` 루프로 드로어 크기 안정화 감지 후 ScrollTrigger 생성.
폴백: `setTimeout(400ms)` (이벤트 미발생 안전장치).

### Fix 3: Passive 리스너 추가

**파일:** `ConnectorLayer.tsx`

```
addEventListener("scroll", handler)
→ addEventListener("scroll", handler, { passive: true })
```

### Fix 4: GSAP tween 경쟁 방지

**파일:** `ImageCanvas.tsx`

activeIndex 변경 시 진행 중인 spotlight/pan tween을 `gsap.killTweensOf()` 호출 후 새 애니메이션 시작.
기존 애니메이션 로직 유지, kill 호출만 추가.

## Files to Modify

| 파일                       | 변경 내용                                        | 위험도 |
| -------------------------- | ------------------------------------------------ | ------ |
| `ImageDetailModal.tsx`     | onWheel → native wheel listener + preventDefault | 낮음   |
| `MagazineItemsSection.tsx` | setTimeout(700) → 조건부 초기화 + 폴백 400ms     | 중간   |
| `InteractiveShowcase.tsx`  | setTimeout(300) → 동일 패턴                      | 중간   |
| `ConnectorLayer.tsx`       | scroll listener에 passive: true 추가             | 낮음   |
| `ImageCanvas.tsx`          | activeIndex 변경 시 gsap.killTweensOf() 추가     | 중간   |

## Constraints

- 기존 기능 변경 없음 (스크롤 동기화, 이미지 전환, FLIP 애니메이션 모두 유지)
- 기존 디자인/레이아웃 변경 없음
- 모바일 터치 제스처 변경 없음
- LenisProvider (full page) 변경 없음

## Success Criteria

- [ ] 왼쪽 패널 휠 스크롤 → 오른쪽 드로어만 스크롤됨 (이중 스크롤 없음)
- [ ] 모달 열림 직후 스크롤 시 activeIndex 즉시 동기화
- [ ] 이미지 전환 시 깜빡거림 없음
- [ ] 기존 GSAP FLIP/ScrollTrigger 동작 유지
- [ ] 데스크톱/모바일 모두 정상 동작
- [ ] 빌드 성공
