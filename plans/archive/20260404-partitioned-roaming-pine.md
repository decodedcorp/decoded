# 메인 페이지 섹션 정리 + 검색 수정 실행 계획

## Context
메인 페이지 섹션 재구성 + 데이터 필터링 + 한글 검색 오류 수정. 하나의 브랜치(`fix/main-page-sections-and-search`)에서 이슈별 커밋으로 진행.

## 브랜치
`fix/main-page-sections-and-search` (main 기반)

---

## Commit 1: #88 — Trending on Decoded, 아이템 찾아주세요 주석처리

**파일:** `packages/web/app/page.tsx`

- line 296 `<TrendingPostsSection>` 주석처리
- line 298 `<HelpFindSection>` 주석처리
- line 178-209: `trendingPostCards`, `helpFindCards` 데이터 준비 코드 주석처리 (불필요한 연산 방지)
- import문에서 `TrendingPostsSection`, `HelpFindSection` 주석처리

---

## Commit 2: #89 — 기존 2열 EditorialSection + TrendingListSection 복구

**파일:** `packages/web/app/page.tsx`

### 데이터 준비 추가 (기존 commit 4651a9a5 참조)
1. **Trending Keywords** — `popularPosts`에서 artist 출현 빈도 카운트 → 상위 8개 → `TrendingKeywordItem[]` 빌드
   ```ts
   const artistCounts = new Map<string, { count: number; image: string }>();
   for (const p of [...popularPosts, ...recentPosts]) {
     const key = p.artist_name || p.group_name || "";
     if (!key) continue;
     const existing = artistCounts.get(key);
     if (existing) { existing.count++; }
     else { artistCounts.set(key, { count: 1, image: p.image_url }); }
   }
   const trendingKeywords = [...artistCounts.entries()]
     .sort((a, b) => b[1].count - a[1].count)
     .slice(0, 8)
     .map(([name, { image }]) => ({
       id: `artist-${name}`,
       label: enrichArtistName(name).displayName || name,
       href: `/search?q=${encodeURIComponent(name)}`,
       image: proxyImg(image),
     }));
   ```

2. **Editorial Style** — `popularPosts[0]`에서 `StyleCardData` 빌드 (이미지 + 상위 3 아이템)
   ```ts
   const editorialStyle: StyleCardData | undefined = popularPosts[0]
     ? {
         id: popularPosts[0].id,
         title: enrichArtistName(popularPosts[0].artist_name).displayName || "Featured",
         artistName: enrichArtistName(popularPosts[0].artist_name).displayName || "Unknown",
         imageUrl: proxyImg(popularPosts[0].image_url),
         link: `/posts/${popularPosts[0].id}`,
         items: popularPosts.slice(1, 4).map(p => ({
           id: p.id, name: enrichArtistName(p.artist_name).displayName || "Item",
           brand: p.group_name || undefined, imageUrl: proxyImg(p.image_url),
         })),
       }
     : undefined;
   ```

### JSX 렌더링
- `<HeroItemSync>` 아래에 2열 grid 추가:
  ```tsx
  <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
    <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
      <EditorialSection style={editorialStyle} embedded />
      <TrendingListSection keywords={trendingKeywords} embedded />
    </div>
  </section>
  ```

### Import 추가
```ts
import { EditorialSection, TrendingListSection } from "@/lib/components/main";
import type { TrendingKeywordItem } from "@/lib/components/main/TrendingListSection";
```

---

## Commit 3: #90 — The Magazine → Artist's Magazine 변경

**파일:** `packages/web/lib/components/main-renewal/EditorialMagazine.tsx`

- 헤더 타이틀 `"The Magazine"` → `"Artist's Magazine"` 변경 (line ~120 근처)

---

## Commit 4: #91 — Decoded's Pick 섹션 주석처리

**파일:** `packages/web/app/page.tsx`

- line 302-308 `<DecodedPickSection>` 주석처리
- line 244-270: `pickStyleData`, `pickItems` 데이터 준비 코드 주석처리
- line 93 `fetchDecodedPickServer()` 호출 주석처리 (Promise.all에서 제거)
- import문에서 `DecodedPickSection` 주석처리

---

## Commit 5: #92 — post_magazines published 필터 추가

**파일:** `packages/api-server/src/domains/posts/service.rs`

2곳에서 post_magazines 조회 시 published 필터 누락:
- **line 790-797**: `PostMagazines::find().filter(Id.is_in(ids))` → `.filter(Status.eq("published"))` 추가
- **line 1077-1084**: 동일 패턴 → `.filter(Status.eq("published"))` 추가

---

## Commit 6: #93 — 한글 검색 오류 수정

**파일들:**
- `packages/api-server/src/services/search/index_config.rs` — `localizedAttributes` 설정 추가
- `packages/api-server/src/services/search/meilisearch.rs` — index 설정 시 localized attributes 적용

### 작업 내용
1. Meilisearch `localizedAttributes` 에 Korean(`kor`) locale 설정
   ```rust
   // artist_name, group_name, title 필드에 한국어 locale 지정
   localized_attributes: [
     { attributePatterns: ["artist_name", "group_name", "title"], locales: ["kor", "eng"] }
   ]
   ```
2. `ensure_index()` 또는 index 초기화 함수에서 localized attributes 설정 호출 추가
3. 필요시 Meilisearch 버전 확인 (localizedAttributes는 v1.3+ 지원)

---

## 검증

1. `cd packages/web && bun run build` — 프론트엔드 빌드 성공 확인
2. `cd packages/api-server && cargo check` — Rust 타입 체크
3. 로컬 dev 서버 실행 후 메인 페이지 확인:
   - Trending/HelpFind/DecodedPick 섹션 미노출
   - 2열 Editorial+Trending 레이아웃 표시
   - Magazine 섹션 "Artist's Magazine" 타이틀
4. 검색 페이지에서 한글 쿼리 테스트 (가능한 경우)
