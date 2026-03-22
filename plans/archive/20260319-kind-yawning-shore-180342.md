# Main-B: Mock → DB 데이터 연동 + 중앙 Post 레이아웃

## Context

현재 `/lab/main-b`는 mock JSON(picsum 이미지)으로 동작. 실제 DB(Shared/PRD)에는 `post → image → item` 관계가 있고, 각 item에 `center` 좌표(0~1)와 `cropped_image_path`가 있음. 이를 활용해:

- **가운데**: post의 원본 이미지 (패션 사진, 크게)
- **양쪽**: 해당 post에서 AI가 추출한 item crop 이미지들
- **네온 화살표**: item crop → post 이미지 내 정확한 `center` 좌표를 가리킴

## DB 구조 (Shared DB — `packages/shared/supabase/`)

```
post (id, account_id, artists, created_at)
  → post_image (post_id, image_id)
    → image (id, image_url, with_items)
      → item (id, image_id, brand, product_name, center:[x,y],
              cropped_image_path, thumbnail_url, bboxes, price)
```

- `item.center`: `[0.25, 0.62]` — 이미지 내 아이템 중심 (0~1 정규화)
- `item.cropped_image_path`: R2 CDN URL (아이템 크롭)
- `image.image_url`: R2 CDN URL (원본 포스트 이미지)
- 3~6개 아이템이 있는 post가 이상적

## 변경 파일

| 파일 | 작업 |
|------|------|
| `packages/shared/supabase/queries/main-b.ts` | **신규** — post+items 쿼리 |
| `packages/web/lib/components/main-b/types.ts` | 수정 — MainBData 타입 추가 |
| `packages/web/app/lab/main-b/page.tsx` | 수정 — 서버 fetch |
| `packages/web/lib/components/main-b/MainPageB.tsx` | 수정 — props + 중앙 이미지 |
| `packages/web/lib/components/main-b/ScatteredCanvas.tsx` | 수정 — 아이템 배치 로직 |
| `packages/web/lib/components/main-b/NeonDoodles.tsx` | 수정 — center 기반 화살표 |

## 상세 설계

### 1. 쿼리 (`main-b.ts`)

```typescript
export interface MainBData {
  post: { id: string; imageUrl: string; artistName?: string };
  items: Array<{
    id: number;
    brand: string;
    productName: string;
    center: [number, number];  // 원본 이미지 내 좌표
    imageUrl: string;          // crop 이미지
  }>;
}

export async function fetchMainBPost(): Promise<MainBData | null>
// 랜덤 post 1개 (3~6 items, center NOT NULL, has crop image)
```

### 2. 레이아웃

```
┌─────────────────────────────────────────┐
│                                         │
│  [item 0]              [item 1]         │
│  left ~8%              right ~72%       │
│      ↘                    ↙             │
│              ┌────────┐                 │
│              │  POST  │   [item 2]      │
│              │ IMAGE  │   right ~75%    │
│              │(center)│                 │
│  [item 3]    │ ~35%w  │                 │
│  left ~5%    └────────┘                 │
│      ↗                    ↖             │
│                        [item 4]         │
│                        right ~78%       │
│                                         │
│       ═══ floating pill nav ═══         │
└─────────────────────────────────────────┘
```

- 중앙 post 이미지: `position: absolute, left: 50%, transform: translateX(-50%)`, width ~35%
- 아이템: `item.center[1]` (y좌표) 기반으로 상하 위치 결정, 좌/우 교대 배치
- 짝수 인덱스 → 왼쪽(5~15%), 홀수 인덱스 → 오른쪽(70~85%)

### 3. NeonDoodles 화살표 정밀 앵커

```typescript
// 화살표 끝점: post 이미지 DOM rect + item.center 좌표
const postEl = parent.querySelector('.post-hero-image');
const postRect = postEl.getBoundingClientRect();
const targetX = ((postRect.left - parentRect.left) / W * 1000)
              + (item.center[0] * postRect.width / W * 1000);
const targetY = ((postRect.top - parentRect.top) / H * 1000)
              + (item.center[1] * postRect.height / H * 1000);
```

화살표: **item crop edge → post 이미지 내 정확한 item.center 좌표**

### 4. Props 흐름

```
page.tsx (서버)
  → fetchMainBPost() from shared DB
  → <MainPageB post={...} items={...} />
    → <PostHeroImage /> (중앙, .post-hero-image 클래스)
    → <ScatteredCanvas items={...} /> (양쪽 item crops)
    → <NeonDoodles items={...} /> (center 좌표 전달)
```

## 구현 순서

1. `main-b.ts` 쿼리 생성 + SQL 테스트
2. `types.ts` — `MainBData` 타입 추가
3. `page.tsx` — 서버 fetch 연동
4. `MainPageB` — props 변경, 중앙 post 이미지 추가
5. `ScatteredCanvas` — 좌/우 교대 배치, center.y 기반 상하 위치
6. `NeonDoodles` — 화살표 끝점을 post 이미지 내 item.center로 변경
7. 브라우저 검증

## 검증

- `/lab/main-b` — 실제 DB 이미지 렌더링 (R2 CDN)
- 중앙 post 이미지 + 양쪽 item crop 배치
- 화살표가 item crop → post 이미지 내 정확한 좌표를 가리킴
- 새로고침 시 다른 post 표시 (랜덤)
- NeonDoodles 기존 효과(glow, boil, flicker) 유지
