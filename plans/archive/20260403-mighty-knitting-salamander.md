# Issue #61 리뷰 이슈 수정 계획

## Context

코드 리뷰에서 발견된 8개 이슈를 우선순위별로 수정. 특히 search SQL injection(Critical)과 스크롤 성능(사용자 체감 최대 문제)에 집중.

## 수정 순서 (우선순위)

### Phase 1: Critical — SQL Injection 수정
**파일:** `packages/web/app/api/v1/search/route.ts:78-81`

`.or()` 문자열 보간에서 사용자 입력 `q`가 그대로 들어감. PostgREST 구문 특수문자(`,`, `.`, `(`, `)`)를 escape.

```typescript
// Before
query = query.or(`artist_name.ilike.%${q}%,...`);

// After — special chars escaped
const sanitized = q.replace(/[%.,()"'\\]/g, '');
query = query.or(`artist_name.ilike.%${sanitized}%,...`);
```

### Phase 2: Performance — ScrollTrigger 근본 수정
**파일:** `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx`

현재 800ms setTimeout은 밴드에이드. 근본 원인: 모달 애니메이션 중 ScrollTrigger 위치 계산 충돌.

**접근:** IntersectionObserver로 교체 (GSAP ScrollTrigger 대신)
- 모달 scroll container에서 IntersectionObserver가 더 가벼움
- 초기화 비용 없음 (GSAP ScrollTrigger.refresh() 불필요)
- 첫 렌더 jank 해결

```typescript
// compact 모드에서 IntersectionObserver 사용
useEffect(() => {
  if (!compact || !isModal || !onActiveIndexChange) return;
  const cards = sectionRef.current?.querySelectorAll("[data-item-index]");
  if (!cards?.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = Number(entry.target.getAttribute("data-item-index"));
        if (entry.isIntersecting) onActiveIndexChange(idx);
      });
    },
    { root: scrollContainerRef?.current, threshold: 0.5 }
  );

  cards.forEach((card) => observer.observe(card));
  return () => observer.disconnect();
}, [compact, isModal, onActiveIndexChange]);
```

full 모드는 기존 GSAP ScrollTrigger 유지 (full page에서는 잘 동작).

### Phase 3: Warning — DOM 직접 조작 개선
**파일:** `packages/web/lib/hooks/useImageModalAnimation.ts:166`

`display: none` → `visibility: hidden`으로 변경 (레이아웃 영향 최소화):

```typescript
if (containerRef.current) {
  containerRef.current.style.visibility = "hidden";
}
```

### Phase 4: Warning — 좌표 정규화 강화
**파일:** `packages/web/lib/components/detail/types.ts:131-134`, `packages/web/lib/hooks/useImages.ts:390-395`

값 clamp 추가:

```typescript
const normalizePos = (v: number) => {
  const n = v > 1 ? v / 100 : v;
  return Math.max(0, Math.min(1, n));
};
```

### Phase 5: Cleanup — 죽은 prop 제거 + SpotDot fallback 정리
**파일:**
- `packages/web/lib/components/detail/EditorialPreviewHeader.tsx` — `description` prop 제거
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — SpotDot fallback이 좌표 수정 후에도 필요한지 확인, 불필요시 제거

## 수정하지 않는 것 (후속 이슈)
- Search infinite scroll 미지원 → 별도 이슈
- ScrollTrigger `onOpenComplete` 이벤트 연동 → Phase 2에서 IntersectionObserver로 대체

## 검증
1. `bunx --bun tsc --noEmit` — 타입 에러 0
2. `bun run build` — 빌드 성공
3. 브라우저: explore → 카드 클릭 → 모달 첫 렌더 jank 없음
4. 브라우저: 모달 스크롤 → spot 하이라이트 부드러움
5. 브라우저: 모달 닫기 → 깜빡임 없음
6. search route에 특수문자 입력 → 에러 없이 빈 결과
