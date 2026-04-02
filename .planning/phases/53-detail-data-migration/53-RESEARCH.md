# Phase 53: Detail Data Migration - Research

**Researched:** 2026-04-02
**Domain:** Next.js intercepting routes, TanStack Query, GSAP, REST API adapter pattern
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DETL-01 | `usePostDetailForImage`를 REST `getPost`로 마이그레이션하여 매거진 메타데이터, AI summary, SpotDot solution 썸네일 표시 | `getPost` + `postDetailToImageDetail` adapter 이미 존재, hookup만 누락 |
| DETL-02 | Maximize 버튼이 `router.push` + GSAP exit 애니메이션으로 동작 (`window.location.href` hard reload 제거) | `handleClose` GSAP 패턴 복사 후 경로 변경 |
</phase_requirements>

---

## Summary

Phase 53의 두 계획(53-01, 53-02)은 각각 독립적이며 위험도가 낮다. 핵심 발견은 **마이그레이션 인프라가 이미 대부분 구축되어 있다**는 점이다.

첫 번째 계획(DETL-01): `packages/web/lib/hooks/useImages.ts` 파일 상단에 `getPost`와 `postDetailToImageDetail`가 이미 import되어 있으나, `usePostDetailForImage` 훅의 `queryFn`은 여전히 Supabase 직접 호출(`fetchPostWithSpotsAndSolutions`)을 사용한다. import를 실제로 연결하고 Supabase 직접 호출 코드를 제거하면 된다. `postDetailToImageDetail` adapter는 `ai_summary`, `post_magazine_id`, `artist_name`, `group_name`, `like_count` 등 확장 필드를 모두 처리하며, `SpotWithTopSolution.top_solution.thumbnail_url`을 `ItemRow.cropped_image_path`로 매핑한다. 단, SpotDot 컴포넌트는 현재 thumbnail을 표시하는 prop이 없으므로 추가가 필요하다.

두 번째 계획(DETL-02): `handleMaximize`는 현재 `window.location.href = /posts/${imageId}`로 hard reload한다. `handleClose`의 GSAP exit-then-navigate 패턴을 그대로 활용하여 `router.push`로 교체하면 된다. `useRouter`는 이미 `useImageModalAnimation` 훅에 주입되어 있다.

**Primary recommendation:** 53-01은 `usePostDetailForImage` queryFn을 `getPost(postId).then(data => postDetailToImageDetail(data, postId))`로 교체. 53-02는 `handleMaximize`에 GSAP exit timeline을 추가한 뒤 `router.push(`/posts/${imageId}`)` 호출.

---

## Current Implementation Analysis

### 53-01: `usePostDetailForImage` 현재 상태

**파일:** `packages/web/lib/hooks/useImages.ts` (lines 261-363)

현재 구현:
```
queryFn: async () => {
  const result = await fetchPostWithSpotsAndSolutions(postId);  // Supabase 직접
  // ... 수작업 매핑 (~100줄)
}
```

이미 import되어 있으나 미사용:
```typescript
import { listPosts, getPost } from "@/lib/api/generated/posts/posts";       // line 21
import { postDetailToImageDetail } from "@/lib/api/adapters/postDetailToImageDetail"; // line 22
```

**결론:** queryFn 교체 1개로 마이그레이션 완성. 기존 수작업 매핑 코드 전체 제거 가능.

### 53-01: Adapter 현재 상태

**파일:** `packages/web/lib/api/adapters/postDetailToImageDetail.ts`

Adapter는 완성 상태이며 `PostDetailResponse` → `ImageDetailWithPostOwner`를 정확히 변환한다:
- `post.ai_summary` → `result.ai_summary`
- `post.post_magazine_id` → `result.post_magazine_id`
- `post.artist_name` / `post.group_name` → 동일 필드
- `spot.top_solution.thumbnail_url` → `item.cropped_image_path`
- `spot.top_solution.metadata` → `item.metadata`
- `post.user?.id` → `result.post_owner_id`

**주의:** `cropped_image_path`는 adapter에서 매핑되지만, `ImageDetailModal.tsx`의 SpotDot 호출부에서 이 값이 아직 사용되지 않는다 (SpotDot에 thumbnail prop 없음).

### 53-01: SpotDot 현재 상태

**파일:** `packages/web/lib/components/detail/SpotDot.tsx`

현재 props: `label`, `brand`, `category`, `accentColor`, `mode/x/y` 또는 `mode/leftPx/topPx`

SpotDot에 `thumbnailUrl?: string | null` prop을 추가하면 dot 위에 썸네일 미니 이미지를 표시할 수 있다.

**ImageDetailModal의 현재 SpotDot 호출** (lines 237-246):
```tsx
<SpotDot
  key={item.id ?? idx}
  mode="pixel"
  leftPx={pixelLeft}
  topPx={pixelTop}
  label={item.product_name ?? ""}
  brand={meta?.brand as string | undefined}
  category={meta?.sub_category as string | undefined}
  accentColor={accentColor}
/>
```
`item.cropped_image_path`가 여기에 전달되지 않는다. `thumbnailUrl` prop 추가 후 `item.cropped_image_path ?? undefined`를 전달해야 한다.

### 53-02: `handleMaximize` 현재 상태

**파일:** `packages/web/lib/hooks/useImageModalAnimation.ts` (line 278-280)

```typescript
const handleMaximize = useCallback(() => {
  window.location.href = `/posts/${imageId}`;
}, [imageId]);
```

문제점:
1. `window.location.href` 할당은 full page reload를 발생시켜 React 상태가 완전히 파괴된다
2. GSAP exit 애니메이션 없이 즉시 이동
3. 브라우저 히스토리에 modal 인터셉트 경로가 남아 뒤로가기 시 modal이 다시 뜰 수 있다

`handleClose` 패턴(lines 157-217)을 참고하면: GSAP timeline을 생성하고 `onComplete` 콜백에서 `router.back()` 또는 `router.push()`를 호출하는 구조가 이미 검증되어 있다.

---

## API Endpoint Details

### GET /api/v1/posts/{post_id}

**생성 함수:** `getPost(postId: string)` in `packages/web/lib/api/generated/posts/posts.ts`

반환 타입: `PostDetailResponse`

주요 필드:
| 필드 | 타입 | 용도 |
|------|------|------|
| `id` | `string (uuid)` | Post ID |
| `image_url` | `string` | 이미지 URL |
| `ai_summary` | `string \| null` | AI 요약 (DETL-01 핵심) |
| `post_magazine_id` | `string \| null` | 매거진 연결 여부 (DETL-01 핵심) |
| `artist_name` | `string \| null` | 아티스트명 |
| `group_name` | `string \| null` | 그룹명 |
| `spots` | `SpotWithTopSolution[]` | SpotDot 위치 + 솔루션 (DETL-01 핵심) |
| `like_count` | `number` | 좋아요 수 |
| `user_has_liked` | `boolean \| null` | 현재 유저 좋아요 여부 |
| `user_has_saved` | `boolean \| null` | 현재 유저 저장 여부 |

### SpotWithTopSolution

| 필드 | 타입 | 용도 |
|------|------|------|
| `id` | `string (uuid)` | Spot ID |
| `position_left` | `string` | 위치 (퍼센트 문자열, e.g. "32.5%") |
| `position_top` | `string` | 위치 (퍼센트 문자열) |
| `status` | `string` | spot 상태 |
| `top_solution` | `TopSolutionSummary \| null` | 대표 솔루션 (썸네일 포함) |

### TopSolutionSummary

| 필드 | 타입 | 용도 |
|------|------|------|
| `id` | `string (uuid)` | Solution ID |
| `title` | `string` | 제품명 |
| `thumbnail_url` | `string \| null` | **SpotDot 썸네일용** |
| `affiliate_url` | `string \| null` | 제휴 링크 |
| `original_url` | `string \| null` | 원본 상품 URL |
| `metadata` | `unknown` | 가격, 브랜드 등 |
| `is_adopted` | `boolean` | 채택 여부 |

---

## Component Data Flow

### 현재 (Supabase 직접)

```
usePostDetailForImage(postId)
  └─ fetchPostWithSpotsAndSolutions(postId)   [Supabase: posts + spots + solutions 3회 쿼리]
       └─ 수작업 매핑 (~100줄)
            └─ ImageDetail (top_solution 없음, ai_summary/post_magazine_id 부분 지원)
```

### 목표 (REST API)

```
usePostDetailForImage(postId)
  └─ getPost(postId)                          [REST: GET /api/v1/posts/{id} 1회]
       └─ postDetailToImageDetail(data, postId)  [adapter, 이미 완성]
            └─ ImageDetailWithPostOwner (모든 필드 포함)
```

### 컴포넌트 의존 트리

```
ImageDetailModal.tsx
├── usePostDetailForImage(imageId)          ← 교체 대상
├── usePostMagazine(magazineId)             ← 변경 없음 (Supabase 유지 가능)
├── useImageModalAnimation(...)
│     └── handleMaximize()                 ← 교체 대상
├── SpotDot (per item)                     ← thumbnailUrl prop 추가 필요
├── ImageDetailPreview (non-magazine)      ← ai_summary 이미 처리
└── ImageDetailContent (magazine)          ← 변경 없음
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase → REST 데이터 변환 | 새 변환 로직 | `postDetailToImageDetail` (이미 존재) | 완성된 adapter, 재구현 불필요 |
| GSAP exit 애니메이션 | 새 타임라인 | `handleClose` 패턴 복사 | 동일 ctx, 동일 refs 재사용 |
| `getPost` 타입 | 직접 정의 | 생성된 `PostDetailResponse` | orval 생성, 변경 금지 |

---

## Common Pitfalls

### Pitfall 1: queryKey 충돌
**What goes wrong:** `usePostDetailForImage` queryKey가 `["posts", "detail", "image", postId]`이다. 다른 훅(예: `useGetPost`)이 `["/api/v1/posts/${postId}"]`를 사용하면 같은 데이터가 두 캐시 엔트리로 분리된다.
**How to avoid:** `usePostDetailForImage`의 queryKey를 변경하지 않는다. TanStack Query 캐시 키는 소비 컴포넌트가 사용하는 키와 일치해야 하며, 기존 키를 유지하면 UI 레이어 변경 없음.

### Pitfall 2: Supabase import 잔존
**What goes wrong:** `fetchPostWithSpotsAndSolutions` import를 제거하면 다른 훅에서 사용 중일 경우 컴파일 에러가 발생한다.
**How to avoid:** `fetchPostWithSpotsAndSolutions`가 `useImages.ts`의 다른 함수에서 사용되지 않는지 확인 후 import 제거. 현재 분석 결과 `useImages.ts`에서 `usePostDetailForImage` 외 사용처 없음. 단, `fetchPostWithSpotsAndSolutions`는 `supabase/queries/posts.ts`에 유지 (삭제 대상 아님).

### Pitfall 3: `window.location.href` 교체 시 히스토리 처리
**What goes wrong:** `router.push`로 교체 후 intercepting route 레이어가 URL stack에 남아 뒤로가기 시 modal이 재등장할 수 있다.
**How to avoid:** `router.push`는 새 history 엔트리를 쌓으므로 `/posts/${imageId}` full page가 스택 최상단이 된다. 뒤로가기는 modal이 열렸던 `/explore` 또는 `/editorial`로 돌아간다. `router.replace` 대신 `router.push`를 사용해야 성공 기준 #5를 만족한다.

### Pitfall 4: SpotDot thumbnail — overflow:hidden 클리핑
**What goes wrong:** SpotDot이 `absolute` 위치의 overflow:hidden 컨테이너 내에 있으면 thumbnail 이미지가 클리핑될 수 있다.
**How to avoid:** tooltip과 동일하게 thumbnail을 dot 아래에 표시 (tooltip과 같은 `z-[100]` 레이어). 이미 tooltip이 같은 위치에 렌더링되므로 thumbnail을 tooltip 내부에 통합하는 것이 안전하다.

### Pitfall 5: GSAP context에서 `router.push` 호출
**What goes wrong:** `handleClose`와 동일하게 `ctxRef.current.add()` 내에서 타임라인을 생성해야 한다. ctxRef 없이 직접 gsap 호출하면 cleanup 시 revert 대상이 되지 않아 메모리 누수 가능.
**How to avoid:** `handleMaximize` 내부에서 `ctxRef.current.add(() => { ... })` 패턴을 사용. `handleClose` 구현과 동일한 패턴.

---

## Architecture Patterns

### Pattern 1: TanStack Query + REST Adapter
**What:** queryFn에서 생성된 REST 함수 호출 후 adapter로 변환
**Example:**
```typescript
// packages/web/lib/hooks/useImages.ts
export function usePostDetailForImage(postId: string) {
  return useQuery<ImageDetail | null>({
    queryKey: ["posts", "detail", "image", postId],
    queryFn: async () => {
      const data = await getPost(postId);        // generated REST fn
      return postDetailToImageDetail(data, postId); // existing adapter
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}
```

### Pattern 2: GSAP exit-then-navigate
**What:** GSAP timeline `onComplete`에서 navigation 실행
**Based on:** 기존 `handleClose` 패턴 (useImageModalAnimation.ts lines 157-217)
```typescript
const handleMaximize = useCallback(() => {
  if (!ctxRef.current) {
    router.push(`/posts/${imageId}`);
    return;
  }
  ctxRef.current.add(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.05, () => {
          reset();
          router.push(`/posts/${imageId}`);
        });
      },
    });
    // drawer + backdrop exit
    tl.to([backdropRef.current, drawerRef.current], {
      opacity: 0,
      duration: 0.25,
      ease: "power3.in",
    });
    // floating image fade out (desktop)
    if (leftImageContainerRef.current) {
      tl.to(leftImageContainerRef.current, { opacity: 0, duration: 0.2 }, 0);
    }
  });
}, [imageId, router, reset]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Pattern 3: SpotDot thumbnail 확장
**What:** 기존 hover tooltip에 thumbnail 추가
```tsx
// SpotDot.tsx — thumbnailUrl prop 추가
type SpotDotProps = {
  label: string;
  brand?: string;
  category?: string;
  accentColor?: string;
  thumbnailUrl?: string | null;  // new
} & (...)
```
tooltip 내부에 thumbnail 이미지를 조건부 렌더링:
```tsx
{hovered && (
  <div className="...tooltip wrapper...">
    {thumbnailUrl && (
      <img src={thumbnailUrl} alt={label} className="w-12 h-12 object-cover rounded mb-1" />
    )}
    {/* 기존 brand / label / category */}
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase 직접 3회 쿼리 | REST 단일 엔드포인트 | Phase 53 (이번) | 네트워크 요청 감소, 인증 토큰 자동 포함 |
| `window.location.href` hard reload | GSAP exit + `router.push` | Phase 53 (이번) | 애니메이션 유지, SPA 탐색 |
| SpotDot hover: 텍스트만 | SpotDot hover: thumbnail + 텍스트 | Phase 53 (이번) | 솔루션 미리보기 UX 개선 |

**Deprecated/outdated:**
- `fetchPostWithSpotsAndSolutions` in `usePostDetailForImage`: Supabase 직접 접근. `getPost` REST로 대체됨. (함수 자체는 다른 용도로 유지)
- `usePostDetailForImage` 내 수작업 매핑 코드 (~100줄): adapter로 대체됨

---

## Open Questions

1. **`usePostMagazine`도 REST로 마이그레이션해야 하는가?**
   - What we know: 현재 Supabase 직접 접근 (`post_magazines` 테이블). Phase 53 요구사항에 명시 없음.
   - What's unclear: REST endpoint 존재 여부 불명확 (openapi.json에서 미확인).
   - Recommendation: Phase 53 범위 밖. 현재 Supabase 구현 유지.

2. **`SpotDot` thumbnail 표시 방법 — tooltip 내부 vs. 별도 미니 카드?**
   - What we know: 성공 기준 #3이 "SpotDot 위에 top_solution 썸네일 표시"를 요구.
   - What's unclear: 정확한 UI 디자인 명세 없음.
   - Recommendation: 기존 tooltip 내부에 통합 (간단, 기존 hover 인터랙션 재사용). hover tooltip을 확장하는 형태.

3. **`handleMaximize` — `isClosing` 상태 플래그 필요 여부?**
   - What we know: `handleClose`는 `isClosing` 상태로 중복 클릭을 방지한다.
   - Recommendation: `handleMaximize`도 동일 패턴 적용. `isClosing` 또는 별도 `isMaximizing` 플래그로 중복 클릭 방지.

---

## Validation Architecture

> `workflow.nyquist_validation` 키가 config.json에 없으므로 enabled 처리.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (packages/web/playwright.config.ts) |
| Config file | packages/web/playwright.config.ts |
| Quick run command | `cd packages/web && bun run test:e2e --grep "ImageDetail"` |
| Full suite command | `cd packages/web && bun run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETL-01 | 드로어에 ai_summary 렌더링 | smoke/manual | 수동 확인 (Playwright snapshot) | ❌ Wave 0 |
| DETL-01 | post_magazine_id → 매거진 타이틀 표시 | smoke/manual | 수동 확인 | ❌ Wave 0 |
| DETL-01 | SpotDot에 thumbnail 표시 | smoke/manual | 수동 확인 | ❌ Wave 0 |
| DETL-02 | Maximize → router.push (no full reload) | smoke | `bun run test:e2e --grep "maximize"` | ❌ Wave 0 |
| DETL-02 | 뒤로가기 → /explore 또는 /editorial | smoke/manual | 수동 확인 | ❌ Wave 0 |

> 대부분 브라우저 레벨 검증이 필요하므로 Playwright e2e 테스트가 적합. 단순 unit test로는 GSAP 애니메이션과 router 동작 검증 불가.

### Wave 0 Gaps

- [ ] 별도 테스트 파일 생성은 이번 Phase에서 선택 사항. 기존 테스트 인프라가 커버하지 않으므로 수동 브라우저 검증으로 대체 가능.

---

## Sources

### Primary (HIGH confidence)
- 직접 코드 분석: `packages/web/lib/hooks/useImages.ts` — 현재 구현 확인
- 직접 코드 분석: `packages/web/lib/api/adapters/postDetailToImageDetail.ts` — adapter 완성 상태 확인
- 직접 코드 분석: `packages/web/lib/hooks/useImageModalAnimation.ts` — `window.location.href` 위치 및 GSAP 패턴 확인
- 직접 코드 분석: `packages/web/lib/api/generated/models/postDetailResponse.ts` — API 응답 타입 확인
- 직접 코드 분석: `packages/api-server/openapi.json` — PostDetailResponse 스키마 확인

### Secondary (MEDIUM confidence)
- 직접 코드 분석: `packages/web/lib/components/detail/SpotDot.tsx` — 현재 props 구조 확인
- 직접 코드 분석: `packages/web/lib/components/detail/ImageDetailModal.tsx` — SpotDot 호출부 확인

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 코드베이스 직접 분석, 모든 타입 및 함수 경로 확인됨
- Architecture: HIGH — 기존 패턴(handleClose, adapter)이 완성되어 있고 그대로 적용 가능
- Pitfalls: HIGH — 실제 import/사용 불일치를 코드에서 직접 발견

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (API 스키마 변경 없을 경우)
