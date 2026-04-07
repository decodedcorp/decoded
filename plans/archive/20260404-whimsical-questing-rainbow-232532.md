# Vercel React Best Practices Phase 2 — 후속 최적화

## Context

PR #96 (`chore/deploy-optimizations`)에 3개 추가 최적화를 커밋한다.
Phase 1에서 dynamic import, React.cache, Set dedup 등 완료. Phase 2는 남은 CRITICAL/HIGH 항목.

## 커밋 3개로 분리

### Commit 3: 배럴 파일 직접 import 전환

**목표:** `lib/design-system/index.ts` (21파일) + `lib/components/main-renewal/index.ts` (2파일) 배럴 → 직접 import

**수정 파일 (23개):**

design-system 배럴 (21파일):
- `lib/components/ConditionalNav.tsx` — NavBar, MobileNavBar 등
- `lib/components/ConditionalFooter.tsx` — FooterMinimal
- `lib/components/main-renewal/HeroSpotMarker.tsx` — SpotMarker
- `lib/design-system/section-header.tsx` — re-export (SectionHeader)
- `lib/components/explore/ExploreHeader.tsx`
- `lib/components/explore/ExploreFilterBar.tsx`
- `lib/components/explore/ArtistBadge.tsx`
- `lib/components/search/SearchBar.tsx`
- `lib/components/search/SearchResults.tsx`
- `lib/components/feed/FeedCard.tsx`
- `lib/components/detail/ShopGrid.tsx`
- `lib/components/detail/ImageDetailContent.tsx`
- `lib/components/detail/magazine/MagazineCelebSection.tsx`
- `lib/components/request/SubmitPreview.tsx`
- `lib/components/request/DetectedItemCard.tsx`
- `lib/components/request/RequestStepper.tsx`
- `lib/components/profile/ProfileHeader.tsx`
- `lib/components/profile/ProfileEditModal.tsx`
- `lib/components/auth/LoginCard.tsx`
- `app/explore/ExploreClient.tsx`
- `app/feed/FeedClient.tsx`

main-renewal 배럴 (2파일 — page.tsx는 이미 직접 import 전환됨):
- `lib/components/main/HeroItemSync.tsx` — types import
- (page.tsx — 이미 수정됨)

**패턴:** `import { X, Y } from "@/lib/design-system"` → `import { X } from "@/lib/design-system/x"` (같은 소스 파일이면 합침)

**주요 매핑:**
- `NavBar, NavItem, NavLogo` → `@/lib/design-system/nav-bar`
- `MobileNavBar` → `@/lib/design-system/mobile-nav-bar`
- `MobileHeader` → `@/lib/design-system/mobile-header`
- `FooterMinimal` → `@/lib/design-system/footer-minimal`
- `SectionHeader` → `@/lib/design-system/section-header`
- `Heading, Text` → `@/lib/design-system/typography`
- `Input` → `@/lib/design-system/input`
- `Button` → `@/lib/design-system/button`
- `Tabs, TabsList, TabsTrigger` → `@/lib/design-system/tabs`
- `Badge` → `@/lib/design-system/badge`
- `Chip, ChipGroup` → `@/lib/design-system/chip`
- `Card, CardContent` → `@/lib/design-system/card`
- `SpotMarker` → `@/lib/design-system/spot-marker`
- `Sheet, SheetContent, SheetTitle` → `@/lib/design-system/sheet`
- `Avatar, AvatarFallback, AvatarImage` → `@/lib/design-system/avatar`
- `Skeleton` → `@/lib/design-system/skeleton`
- `IconButton` → `@/lib/design-system/icon-button`

**실행:** 병렬 서브에이전트 2개 (design-system 파일 절반씩) + 본체에서 main-renewal 처리

---

### Commit 4: Suspense 스트리밍 (홈페이지)

**목표:** page.tsx를 3개 async 서버 컴포넌트로 분리, Suspense 경계 추가

**데이터 의존성:**
```
HeroItemSync       → recentPosts + popularPosts (독립, 가장 빠름 ~200ms)
Editorial+Trending  → popularPosts + recentPosts + artistProfileMap (~800ms)
Magazine           → magazinePosts + artistProfileMap (~600ms)
Masonry+Dome       → 이미 ssr:false dynamic (클라이언트 lazy)
```

**새 파일 3개:**
1. `app/_sections/HeroSection.tsx` — async 서버 컴포넌트, fetchPosts 2개
2. `app/_sections/EditorialTrendingSection.tsx` — async 서버 컴포넌트, fetchPosts + artistProfileMap + spots 쿼리
3. `app/_sections/MagazineSection.tsx` — async 서버 컴포넌트, fetchMagazinePosts + artistProfileMap

**스켈레톤 3개:**
1. `lib/components/skeletons/HeroSkeleton.tsx` — 히어로 높이 예약
2. `lib/components/skeletons/EditorialTrendingSkeleton.tsx` — 2컬럼 레이아웃
3. `lib/components/skeletons/MagazineSkeleton.tsx` — 카드 그리드

**page.tsx 변환:**
```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<EditorialTrendingSkeleton />}>
        <EditorialTrendingSection />
      </Suspense>
      <Suspense fallback={<MagazineSkeleton />}>
        <MagazineSection />
      </Suspense>
      <section className="relative">
        <MasonryGrid items={[]} /> {/* client-only, no server data needed? */}
      </section>
    </div>
  );
}
```

**주의:** MasonryGrid와 DomeGallery는 `popularPosts` 데이터가 필요하지만 이미 `ssr: false`임.
→ 이들도 서버 컴포넌트 안에서 데이터를 받아야 함.
→ **실용적:** EditorialTrendingSection 또는 별도 BelowFoldSection에 포함시킴.

**실제 구조:**
```tsx
<Suspense fallback={<HeroSkeleton />}>
  <HeroSection />        {/* recentPosts + popularPosts */}
</Suspense>
<Suspense fallback={<EditorialTrendingSkeleton />}>
  <EditorialTrendingSection />  {/* popularPosts + recentPosts + artistProfileMap + spots */}
</Suspense>
<Suspense fallback={<MagazineSkeleton />}>
  <MagazineSection />    {/* magazinePosts + artistProfileMap */}
</Suspense>
<Suspense fallback={<div className="min-h-[600px]" />}>
  <BelowFoldSection />   {/* popularPosts + artistProfileMap → Masonry + Dome */}
</Suspense>
```

---

### Commit 5: Zustand 셀렉터 최적화

**목표:** 6개 컴포넌트의 전체 스토어 구독 → 개별 셀렉터 전환

**Phase 1 (authStore — 셀렉터 일부 존재):**
- `lib/components/auth/LoginCard.tsx` — 5필드 → 개별 셀렉터
- `lib/components/profile/ProfileHeader.tsx` — 2필드 → 개별 셀렉터
- `lib/stores/authStore.ts` — `selectLoadingProvider`, `selectError`, `selectLogout` 추가

**Phase 2 (transitionStore — 셀렉터 없음, useShallow 사용):**
- `lib/components/detail/ImageDetailModal.tsx` — 3필드 → useShallow
- `lib/hooks/useFlipTransition.ts` — 2-3필드 → useShallow

**Phase 3 (studioStore + magazineStore — 셀렉터 없음):**
- `lib/components/collection/IssueDetailPanel.tsx` — 5필드 → useShallow
- `lib/components/collection/studio/SplineStudio.tsx` — 8필드 → useShallow

**전략:** 기존 셀렉터 있는 스토어는 셀렉터 추가, 없는 스토어는 `useShallow` 사용 (zustand 5.0.12 지원)

## 실행 순서

1. **Commit 3** (배럴 파일) — 서브에이전트로 병렬 처리, 가장 많은 파일이지만 기계적
2. **Commit 5** (Zustand) — 독립 작업, Commit 4와 병렬 가능
3. **Commit 4** (Suspense) — page.tsx 대규모 변경, 마지막에 단독 처리
4. 빌드 검증 → push

## 검증

1. `bun run build` — 에러/경고 0
2. `tsc --noEmit` — 타입 통과
3. 홈페이지 로드 — 각 섹션이 독립적으로 스트리밍되는지 확인 (Network 탭 chunked response)
4. 포스트 상세 — 프로필 표시 정상
5. 로그인 카드 — 리렌더 확인 (React DevTools Profiler)
