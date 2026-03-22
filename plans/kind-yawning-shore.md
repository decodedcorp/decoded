# NeonDoodles 개선: Halo → 테두리 원, 화살표 → 코너→center 좌표

## Context

현재 NeonDoodles에서:

- **Halo**: 아이템 div 상단 중앙에 작은 타원형 (이미지와 무관하게 공중에 떠있음)
- **화살표**: 시작점이 아이템 edge의 angle 기반 → 부정확, 끝점 `center*2` 매핑도 불안정

유저 요청:

1. 타원형 halo를 **아이템 div 테두리를 따라서** 동그라미 치도록 변경
2. 화살표를 **아이템 모서리에서 시작 → post 이미지 내 center 좌표에서 끝**

## 현재 동작 분석

### Halo (NeonDoodles.tsx L267-283)

```typescript
// 현재: 아이템 상단 중앙에 작은 타원
const hx = r.cx + rand() * 6;
const hy = r.top + r.h * 0.08;  // ← 상단 8%에 고정
const rx = r.w * 0.3;           // ← 아이템 너비의 30% (너무 작음)
const ry = rx * 0.5 * aspectRatio;
sketchOval(hx, hy, rx, ry, ...)
```

**문제**: rx가 아이템의 30%로 작고, 위치가 top 고정 → 이미지를 감싸지 않음

### Arrow (NeonDoodles.tsx L217-265)

```typescript
// 현재: 시작점 = 아이템 중심에서 angle 방향 엣지
const angle = Math.atan2(targetY - r.cy, targetX - r.cx);
const startX = r.cx + Math.cos(angle) * (r.w * 0.5); // ← angle 기반
// 끝점 = center.x * 2 (합성이미지 기준 보정)
const mappedX = Math.min(item.center[0] * 2, 1); // ← 부정확
```

**문제**: 시작점이 원 위의 점이라 모서리와 안 맞고, 끝점 매핑도 이미지 포맷에 따라 다름

### DB center 좌표

- 서버 쿼리에서 `[y, x]` → `[x, y]` swap 완료
- `center[0]` = x, `center[1]` = y (원본 전체 이미지 기준 0~1)
- 원본 이미지는 대부분 합성 (패션사진 왼쪽 ~45% + 상품정보 오른쪽 ~55%)
- 아이템 center.x 값: 보통 0.1~0.5 범위 (패션사진 영역)

## 변경 파일

`packages/web/lib/components/main-b/NeonDoodles.tsx` — 단일 파일

## 변경 사항

### 1. Halo → 아이템 div 테두리를 감싸는 원

**viewBox 좌표계 주의**: SVG viewBox는 1000x1000이지만 실제 뷰포트는 직사각형(예: 1640x749).

- SVG 가로 1단위 = W/1000 px, SVG 세로 1단위 = H/1000 px
- 시각적으로 원형이 되려면 `ry = rx * aspectRatio` (W/H)
- `r.w`, `r.h`는 이미 viewBox 기준이므로, 아이템 div를 감싸려면:
  - `rx = r.w * 0.55` (가로 반경)
  - `ry = rx * aspectRatio` (세로 반경 — 시각적 원형 보정)

```typescript
// Before (L267-273):
const hx = r.cx + rand() * 6;
const hy = r.top + r.h * 0.08 + rand() * 3;
const rx = r.w * 0.3 + rand() * 3;
const ry = rx * 0.5 * aspectRatio;

// After: 아이템 중심에서 전체를 감싸는 원
const hx = r.cx + rand() * 4;
const hy = r.cy + rand() * 4; // ← 아이템 중심
const rx = r.w * 0.55 + rand() * 3; // ← 아이템 너비의 55%
const ry = rx * aspectRatio + rand() * 3; // ← 시각적 원형 보정 (기존 패턴 유지)
```

**검증 포인트**: 아이템이 1:1 비율(ScatteredCanvas에서 aspectRatio=1/1)이므로, viewBox에서도 `r.w ≈ r.h`가 됨. `rx * aspectRatio`이면 시각적으로 약간 세로 긴 타원 → 아이템을 살짝 여유있게 감싸는 효과. ✅

### 2. 화살표 시작점 → 아이템 4 코너 중 target에 가장 가까운 코너

```typescript
// Before (L232-235):
const angle = Math.atan2(targetY - r.cy, targetX - r.cx);
const startX = r.cx + Math.cos(angle) * (r.w * 0.5);
const startY = r.cy + Math.sin(angle) * (r.h * 0.5);

// After: 4 코너 중 target에 가장 가까운 것 선택
const corners = [
  [r.left, r.top],
  [r.right, r.top],
  [r.left, r.bottom],
  [r.right, r.bottom],
];
let startX = r.cx,
  startY = r.cy,
  bestDist = Infinity;
for (const [cx, cy] of corners) {
  const d = Math.hypot(cx - targetX, cy - targetY);
  if (d < bestDist) {
    startX = cx;
    startY = cy;
    bestDist = d;
  }
}
```

### 3. 화살표 끝점 매핑 (기존 유지, 주석 개선)

현재 `mappedX = min(center.x * 2, 1)` → 합성 이미지에서 왼쪽 절반이 보이므로 `*2`는 합리적. 그대로 유지.

### 4. Corner scribble 제거 (L286-297)

halo가 아이템 전체를 감싸므로 우하단 작은 원은 불필요 → 삭제

## 수정 전후 비교

```
Before:                          After:
       ○  (작은 타원, 상단 떠있음)    ╭─────────╮  (아이템 테두리 감싸는 원)
   ┌───────┐                        │ ┌─────┐ │
   │ item  │ ──→ center*2 좌표      │ │item │─┼──→ center 좌표
   └───────┘ (angle 기반 엣지)      │ └─────┘ │   (코너에서 시작)
                                    ╰─────────╯
```

## 검증

1. `/lab/main-b` 새로고침 3회 → 다양한 데이터에서 확인
2. halo가 각 아이템 crop 이미지를 감싸듯이 그려지는지
3. 화살표가 아이템 코너에서 시작하는지
4. 화살표 끝이 post 이미지 내 적절한 위치를 가리키는지
5. 기존 zigzag, energy dash, glow, boil 효과 유지
