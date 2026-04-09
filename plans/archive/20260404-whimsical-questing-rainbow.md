# Vercel React Best Practices 수정 계획

## Context

PR #96 (`chore/deploy-optimizations`)에 Vercel React Best Practices 감사 결과 수정을 추가한다.
4개 병렬 에이전트가 발견한 47개 항목 중 **안전하고 고효과인 7개**를 이번 PR에 포함한다.
나머지(배럴 파일 제거, Suspense 스트리밍, Zustand 셀렉터 등)는 별도 이슈로 분리.

## Scope — 이번 PR에 포함할 수정 (7개)

### Step 1: DecodedLogo dynamic import (C1 — CRITICAL, ~600KB 제거)

**파일:**
- `packages/web/lib/design-system/mobile-header.tsx:6`
- `packages/web/lib/components/main-renewal/SmartNav.tsx:6`

**변경:**
```tsx
// Before
import DecodedLogo from "@/lib/components/DecodedLogo";
// After
import dynamic from "next/dynamic";
const DecodedLogo = dynamic(() => import("@/lib/components/DecodedLogo"), {
  ssr: false,
  loading: () => <span className="font-bold text-[#eafd67] tracking-tight">decoded</span>,
});
```

**위험:** 낮음. DecodedLogo는 WebGL 전용이므로 SSR 불필요. fallback은 텍스트 로고.

### Step 2: GSAP 섹션 dynamic import (C2 — CRITICAL, ~90KB 제거)

**파일:** `packages/web/app/page.tsx` (server component)

Home page에서 GSAP를 사용하는 클라이언트 컴포넌트를 dynamic import:
- `TrendingListSection` — gsap + @gsap/react
- `MasonryGrid` — gsap + ScrollTrigger
- `DomeGallerySection` — @use-gesture/react, Canvas

```tsx
import dynamic from "next/dynamic";
const TrendingListSection = dynamic(
  () => import("@/lib/components/main/TrendingListSection").then(m => ({ default: m.TrendingListSection })),
  { ssr: false }
);
const MasonryGrid = dynamic(
  () => import("@/lib/components/main-renewal/MasonryGrid").then(m => ({ default: m.MasonryGrid })),
  { ssr: false }
);
const DomeGallerySection = dynamic(
  () => import("@/lib/components/main/DomeGallerySection").then(m => ({ default: m.DomeGallerySection })),
  { ssr: false }
);
```

**주의:** page.tsx는 서버 컴포넌트이므로 `next/dynamic`을 직접 사용할 수 없다.
→ 대안: 각 섹션을 감싸는 경량 client wrapper 생성 또는 해당 컴포넌트 export를 dynamic으로 re-export하는 파일 생성.
→ 가장 간단한 방법: `app/page.tsx`에서 직접 import하되, 해당 섹션들을 별도 client component 파일로 분리.

**실제 접근:** SmartNav의 gsap import는 SmartNav 자체가 이미 client component이므로 이 파일은 그대로 두고,
page.tsx에서의 import를 `React.lazy` 대신 **별도 client wrapper**로 감싸는 방식 사용.

### Step 3: React.cache() 래핑 (H1 — HIGH, 5분)

**파일:** `packages/web/lib/supabase/queries/warehouse-entities.server.ts:84,130`

```tsx
import { cache } from "react";

export const buildArtistProfileMap = cache(async (): Promise<Map<string, ArtistProfileEntry>> => {
  // 기존 구현 유지
});

export const buildBrandProfileMap = cache(async (): Promise<Map<string, BrandProfileEntry>> => {
  // 기존 구현 유지
});
```

**위험:** 제로. React.cache()는 같은 렌더 패스 내에서만 디듑.

### Step 4: Hero 중복 제거 Set 전환 (H10 — HIGH, 5분)

**파일:** `packages/web/app/page.tsx:151-169`

```tsx
// Before
for (const post of recentPosts) {
  if (heroPosts.some((hp) => hp.id === post.id)) continue;
// After
const heroIds = new Set<string>();
for (const post of recentPosts) {
  if (heroIds.has(post.id)) continue;
  heroIds.add(post.id);
```

### Step 5: enrichArtistName 중복 호출 제거 (H-HIGH, 5분)

**파일:** `packages/web/app/page.tsx:330-343`

editorial style 빌드 시 같은 인자로 enrichArtistName을 2회 호출하는 패턴 수정.
`.map()` 내부에서도 동일 인자 2회 호출 → 1회로 통합.

### Step 6: 프로필 맵 필터링 (H2 — HIGH, 15분)

**파일:**
- `packages/web/app/posts/[id]/page.tsx:21-29`
- `packages/web/app/@modal/(.)posts/[id]/page.tsx` (동일 패턴)

1000+ 엔트리 전체를 클라이언트로 보내는 대신, 해당 포스트에 필요한 프로필만 전달.
→ 단, 클라이언트 컴포넌트(ImageDetailPage)에서 어떤 아티스트가 필요한지 서버에서 미리 알 수 없음.
→ **대안:** 프로필 맵 직렬화를 제거하고, 클라이언트에서 필요 시 API 호출로 전환하는 것은 범위 초과.
→ **실용적 수정:** 현재 forEach 대신 Object.fromEntries로 간소화 + TODO 주석 추가.

### Step 7: params/searchParams 병렬화 (MEDIUM, 5분)

**파일:** `packages/web/app/@modal/(.)posts/[id]/page.tsx:18-19`

```tsx
// Before
const { id } = await params;
const { from } = await searchParams;
// After
const [{ id }, { from }] = await Promise.all([params, searchParams]);
```

## Scope 외 — 별도 이슈로 분리

| 항목 | 이유 |
|------|------|
| C3: 배럴 파일 제거 | 25+ 파일 수정, 별도 리팩토링 PR |
| C4: Suspense 스트리밍 | page.tsx 대규모 구조 변경 |
| H3: Zustand 셀렉터 | 6+ 컴포넌트, 동작 검증 필요 |
| H6: 조건부 EventFlush/VtonModal | 동작 변경 리스크 |
| MEDIUM 이하 | 점진적 개선 |

## 실행 순서

1. Step 3 (React.cache) + Step 4 (Set) + Step 5 (enrichArtistName) — 독립, 병렬 가능
2. Step 1 (DecodedLogo dynamic) — 2파일 수정
3. Step 2 (GSAP dynamic) — page.tsx 구조 확인 필요, 가장 복잡
4. Step 7 (params 병렬화)
5. 빌드 검증 (`bun run build`)
6. 커밋 + PR #96에 push

## 검증

1. `bun run build` — 빌드 성공, 에러/경고 0
2. 로컬 `bun run dev` 확인 — 홈페이지 정상 렌더링
3. DecodedLogo fallback → WebGL 로드 후 애니메이션 전환 확인
4. 포스트 상세 페이지 정상 동작 확인
