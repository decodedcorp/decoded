# Task 4: 스케치 디자인 — 네온 그린 손그림 요소 구현

## Context

Main Page B (`/lab/main-b`)의 마지막 레이어. 디자인 이미지의 네온 그린(#eafd67) 펜 드로잉 느낌 요소들:
- 곡선 화살표 (아이템→중앙)
- 동그라미 낙서 (이미지 주변 타원)
- 지그재그 스크래치 (마커 낙서)
- 소용돌이 장식 (이미지 모서리)

**원칙**: rough.js 없이 수동 SVG path perturbation으로 손그림 느낌. CSS-only 애니메이션.

## 변경 파일

| 파일 | 작업 |
|------|------|
| `main-b/NeonDoodles.tsx` | **신규** (NeonArrows 대체) |
| `main-b/NeonArrows.tsx` | **삭제** |
| `main-b/MainPageB.tsx` | import 변경 |
| `main-b/index.ts` | export 변경 |

## NeonDoodles.tsx 설계

### SVG 구조
```
<svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
  <defs>
    <filter id="doodle-neon" ...> (feGaussianBlur 3+8 merge)
  </defs>
  <style> .doodle-path draw-in + prefers-reduced-motion </style>
  <g filter="url(#doodle-neon)"> <!-- 화살표 4개 --> </g>
  <g filter="url(#doodle-neon)"> <!-- 동그라미 4개 --> </g>
  <g filter="url(#doodle-neon)"> <!-- 지그재그 3개 --> </g>
  <g filter="url(#doodle-neon)"> <!-- 소용돌이 4개 --> </g>
</svg>
```

### 손그림 기법
- Bezier 제어점에 ±5~8px offset → 흔들리는 선
- 동그라미: 시작/끝 5px 안 맞음 (열린 타원)
- 이중 선 겹침 (opacity 낮은 두 번째 선) → 덧칠 느낌
- strokeWidth 2~2.5px, strokeLinecap="round"

### 요소 배치 (총 ~15 path)
- **화살표 4개**: 아이템→중앙, 화살촉 포함
- **동그라미 4개**: item 0,2,5,6 주변 타원
- **지그재그 3개**: 하단좌, 상단중앙, 우측중간
- **소용돌이 4개**: item 1,2,4,7 모서리

### 애니메이션
- `stroke-dasharray: 1000; stroke-dashoffset: 1000` → 0
- `animation: doodle-draw-in 1.5s ease-out forwards`
- 0.3s 간격 stagger (화살표 0~0.9s → 동그라미 1.2~2.1s → 지그재그 2.4~3.0s → 소용돌이 3.3~4.2s)
- `@media (prefers-reduced-motion: reduce)` → 즉시 표시

### 성능
- filter는 `<g>` 그룹(4개)에만 적용
- 총 SVG < 5KB
- pointer-events-none, aria-hidden

## 구현 순서
1. NeonDoodles.tsx 생성
2. NeonArrows.tsx 삭제
3. MainPageB.tsx / index.ts import 변경
4. 브라우저 검증

## 검증
- `/lab/main-b` 에서 순차 draw-in 애니메이션 확인
- 네온 글로우 확인
- prefers-reduced-motion 동작 확인
