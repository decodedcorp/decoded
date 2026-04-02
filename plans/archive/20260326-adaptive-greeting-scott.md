# Legacy 통합 + 실데이터 연결 계획

## Context

메인 페이지를 7-섹션 구조로 스캐폴딩했으나, 기존 `DynamicHomeFeed`가 래핑하던 legacy 섹션들(EditorialSection, TrendingListSection, ForYouSection)이 하단에 그대로 남아있고, 새 섹션들은 placeholder 상태. 이제 legacy를 새 흐름에 통합하고 실데이터를 연결한다.

## 최종 섹션 흐름

```
1. HeroItemSync               (유지)
2. DecodeShowcase              (실데이터: whatsNew spots)
3. EditorialSection + TrendingListSection  (legacy → 직접 렌더)
4. EditorialMagazine           (실데이터: whatsNew + spotlight 카드)
5. VirtualTryOnTeaser          (실데이터: bestItems)
6. MasonryGrid                 (유지)
7. ForYouSection               (legacy → 직접 렌더, 로그인 시만)
8. CommunityLeaderboard        (실데이터: rankings API + trending tags)
9. DomeGallerySection          (유지)
10. MainFooter                 (유지)
```

## 변경 사항

### 1. page.tsx 재구성 — DynamicHomeFeed 제거, 직접 렌더

**파일**: `packages/web/app/page.tsx`

변경:
- `DynamicHomeFeed` import 및 렌더 제거
- `EditorialSection`, `TrendingListSection`, `ForYouSection` 직접 import
- 기존 `sectionData` 구성 로직 중 필요한 부분만 유지
- 새 섹션 순서대로 직접 렌더

```tsx
// 제거
import { DynamicHomeFeed } from "@/lib/components/main";

// 추가 (직접 import)
import { EditorialSection, TrendingListSection, ForYouSection } from "@/lib/components/main";
```

렌더 블록:
```tsx
<div className="min-h-screen bg-[#050505]">
  {/* 1. Hero */}
  <HeroItemSync posts={heroPosts} />

  {/* 2. The Magic: AI Detection */}
  <DecodeShowcase data={decodeShowcaseData} />

  {/* 3. Editorial + Trending (legacy combo, 직접 렌더) */}
  <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
    <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
      <EditorialSection style={editorialStyle} embedded />
      <TrendingListSection keywords={trendingKeywords} embedded />
    </div>
  </section>

  {/* 4. Editorial Magazine (horizontal scroll) */}
  <EditorialMagazine data={editorialMagazineData} />

  {/* 5. VTON Teaser */}
  <VirtualTryOnTeaser data={vtonTeaserData} />

  {/* 6. DECODED PICKS */}
  <MasonryGrid items={gridItems} />

  {/* 7. For You (로그인 시만) */}
  {userId && <ForYouSection {...forYouData} />}

  {/* 8. Style DNA & Community */}
  <CommunityLeaderboard data={leaderboardData} />

  {/* 9. VTON CTA */}
  <DomeGallerySection />

  {/* Footer */}
  <MainFooter />
</div>
```

### 2. DecodeShowcase — 실제 spot 좌표 연결

**파일**: `packages/web/app/page.tsx` (데이터 변환 부분)

현재 하드코딩된 bbox → 실제 `SpotWithSolutions`의 `position_left/position_top` 사용:

```tsx
const showcaseSource = whatsNewData.find(
  (w) => w.post.imageUrl && w.items.length >= 2
);

// spots 데이터에서 실제 좌표 추출
const decodeShowcaseData: DecodeShowcaseData = showcaseSource
  ? {
      sourceImageUrl: `/api/v1/image-proxy?url=${encodeURIComponent(showcaseSource.post.imageUrl!)}`,
      artistName: showcaseSource.post.artistName || showcaseSource.post.groupName || "DECODED",
      tagline: "See how it's Decoded",
      detectedItems: showcaseSource.items.slice(0, 4).map((item, i) => ({
        id: String(item.id),
        label: item.name || item.label,
        brand: item.brand || undefined,
        imageUrl: item.imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(item.imageUrl)}` : undefined,
        bbox: {
          // 실제 spot 좌표 사용 (position_left/top은 percentage string)
          x: Math.max(5, Math.min(70, parseFloat(showcaseSource.spots?.[i]?.position_left ?? String([15,55,10,50][i%4])))),
          y: Math.max(5, Math.min(70, parseFloat(showcaseSource.spots?.[i]?.position_top ?? String([20,15,55,60][i%4])))),
          width: [28, 24, 26, 22][i % 4],
          height: [32, 28, 30, 24][i % 4],
        },
      })),
    }
  : { sourceImageUrl: "", artistName: "DECODED", tagline: "See how it's Decoded", detectedItems: [] };
```

### 3. EditorialMagazine — 실데이터 + 이미지 프록시

**파일**: `packages/web/app/page.tsx`

```tsx
const editorialMagazineData: EditorialMagazineData = {
  cards: [
    ...whatsNewStyles.slice(0, 4).map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(s.imageUrl)}` : "",
      title: s.title,
      subtitle: s.description,
      artistName: s.artistName,
      category: "What's New",
      link: s.link,
    })),
    ...spotlightStyles.slice(0, 4).map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(s.imageUrl)}` : "",
      title: s.title,
      subtitle: s.description,
      artistName: s.artistName,
      category: "Spotlight",
      link: s.link,
    })),
  ],
};
```

### 4. VirtualTryOnTeaser — bestItems 실데이터

**파일**: `packages/web/app/page.tsx`

```tsx
const vtonTeaserData: VTONTeaserData = {
  pairs: bestItems.slice(0, 3).map((bi) => ({
    id: String(bi.item.id),
    beforeImageUrl: bi.imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(bi.imageUrl)}` : "",
    afterImageUrl: bi.imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(bi.imageUrl)}` : "",
    itemName: bi.item.product_name || "Product",
    itemBrand: bi.item.brand || undefined,
  })),
  ctaLabel: "나의 스타일 DNA에 입혀보기",
};
```

### 5. CommunityLeaderboard — rankings API 연결

**파일**: `packages/web/app/page.tsx`

새 서버 fetch 함수 추가 (rankings API 호출):

```tsx
// Promise.all에 추가
const rankingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/rankings?period=week&limit=10`, {
  next: { revalidate: 300 }, // 5분 캐시
}).then(r => r.ok ? r.json() : { rankings: [] }).catch(() => ({ rankings: [] }));
```

데이터 변환:
```tsx
const leaderboardData: CommunityLeaderboardData = {
  trendingUsers: (rankingsRes.rankings ?? []).slice(0, 8).map((r: any) => ({
    id: r.user_id || r.id,
    username: r.username || r.display_name || "User",
    avatarUrl: r.avatar_url,
    styleTags: r.style_tags || [],
    score: r.total_points || r.score || 0,
  })),
  trendingTags: trendingKeywords.map((k) => typeof k === "string" ? k : k.label),
};
```

### 6. ForYouSection 직접 렌더 데이터

기존 `sectionData.forYou`를 직접 props로:
```tsx
const forYouData = {
  forYouPosts: forYouStyles,
  trendingPosts: trendingStyles,
  followingPosts: forYouStyles,
};
```

### 7. 불필요한 코드 정리

- `DynamicHomeFeed` import 제거
- `HomeSectionType`, `HomeSectionData` 관련 type import 제거 (더 이상 필요 없음)
- `sectionData` 객체 구성 제거 (개별 변수로 대체)
- `newSections` 배열 제거

## 수정 대상 파일 요약

| 파일 | 변경 |
|------|------|
| `packages/web/app/page.tsx` | DynamicHomeFeed 제거, 직접 렌더, 실데이터 연결, rankings fetch 추가 |

## 검증

1. `bunx tsc --noEmit` — 타입 체크 통과
2. `bun run build` — 빌드 성공
3. `bun run dev` → localhost:3000 접속하여 모든 섹션 렌더 확인
4. 각 섹션에 실데이터 표시 여부 확인 (이미지, 텍스트, 좌표)
