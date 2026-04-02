import {
  MasonryGrid,
  EditorialMagazine,
} from "@/lib/components/main-renewal";
import type {
  MainHeroData,
  GridItemData,
  HeroSpotAnnotation,
  EditorialMagazineData,
} from "@/lib/components/main-renewal";
import {
  DomeGallerySection,
  HeroItemSync,
  EditorialSection,
  TrendingListSection,
} from "@/lib/components/main";
import type { StyleCardData } from "@/lib/components/main";
import type { HeroPostEntry } from "@/lib/components/main/HeroItemSync";
import {
  fetchFeaturedPostServer,
  fetchWeeklyBestPostsServer,
  fetchWhatsNewPostsServer,
  fetchDecodedPickServer,
  fetchArtistSpotlightServer,
  fetchTrendingKeywordsServer,
  fetchMagazinePostsServer,
} from "@/lib/supabase/queries/main-page.server";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import type { ArtistProfileEntry } from "@/lib/supabase/queries/warehouse-entities.server";
import defaultHeroData from "@/lib/components/main-renewal/mock/main-hero.json";
import defaultGridItems from "@/lib/components/main-renewal/mock/main-grid-items.json";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  await searchParams;

  // Parallel fetch: all section data
  const [
    featuredPost,
    weeklyBestPosts,
    whatsNewData,
    decodedPick,
    artistSpotlight,
    trendingKeywords,
    magazinePosts,
    artistProfileMap,
  ] = await Promise.all([
    fetchFeaturedPostServer(),
    fetchWeeklyBestPostsServer(30),
    fetchWhatsNewPostsServer(30),
    fetchDecodedPickServer(),
    fetchArtistSpotlightServer(30),
    fetchTrendingKeywordsServer(8),
    fetchMagazinePostsServer(8),
    buildArtistProfileMap(),
  ]);

  /**
   * Enriches a raw artist/group name with warehouse entity data.
   * Falls back gracefully to the original name when no warehouse match found.
   */
  function enrichArtistName(
    name: string | null
  ): { displayName: string; profileImageUrl: string | null } {
    if (!name) return { displayName: "", profileImageUrl: null };
    const entry: ArtistProfileEntry | undefined = artistProfileMap.get(name.toLowerCase());
    return {
      displayName: entry?.name ?? name,
      profileImageUrl: entry?.profileImageUrl ?? null,
    };
  }

  // --- Data transforms ---

  // Build hero spot annotations from decodedPick items
  const heroSpots: HeroSpotAnnotation[] = decodedPick
    ? buildSpots(decodedPick.items)
    : [];

  const heroData: MainHeroData =
    featuredPost && featuredPost.imageUrl
      ? {
          celebrityName: (
            featuredPost.artistName ||
            featuredPost.groupName ||
            "DECODED"
          ).toUpperCase(),
          editorialTitle:
            featuredPost.context ||
            featuredPost.mediaTitle ||
            "Today's Featured Look",
          editorialSubtitle: featuredPost.groupName
            ? `${featuredPost.groupName} — Curated by AI`
            : "AI가 큐레이션한 오늘의 에디토리얼",
          heroImageUrl: featuredPost.imageUrl,
          ctaLink: `/posts/${featuredPost.id}`,
          ctaLabel: "VIEW EDITORIAL",
          spots: heroSpots.length > 0 ? heroSpots : undefined,
        }
      : (defaultHeroData as MainHeroData);

  // MasonryGrid: use second half of weeklyBest to differ from Hero gallery
  const gridSource = weeklyBestPosts.filter((p) => p.imageUrl);
  const gridOffset = Math.min(8, Math.floor(gridSource.length / 2));
  const gridItems: GridItemData[] =
    gridSource.length > 0
      ? [...gridSource.slice(gridOffset), ...gridSource.slice(0, gridOffset)]
          .map((post, i) => {
            const { displayName } = enrichArtistName(post.artistName || post.groupName);
            return {
              id: post.id,
              imageUrl: post.imageUrl!,
              title: displayName || "Unknown",
              subtitle: post.context || post.mediaTitle || undefined,
              category: post.mediaType || "Style",
              link: `/posts/${post.id}`,
              aspectRatio: [1.25, 1.0, 1.4, 0.8, 1.2, 1.0, 1.5, 0.9][i % 8],
            };
          })
      : (defaultGridItems as GridItemData[]);

  const spotlightStyles: StyleCardData[] = artistSpotlight.map((s) => {
    const { displayName } = enrichArtistName(s.post.artistName || s.post.groupName);
    return {
      id: s.post.id,
      title: displayName || "Artist",
      description: s.post.context || s.post.mediaTitle || "",
      artistName: displayName || "Unknown",
      imageUrl: s.post.imageUrl || undefined,
      link: `/posts/${s.post.id}`,
    };
  });

  const whatsNewStyles: StyleCardData[] = whatsNewData.map((s) => {
    const { displayName } = enrichArtistName(s.post.artistName || s.post.groupName);
    return {
      id: s.post.id,
      title: displayName || "New Style",
      description: s.post.context || s.post.mediaTitle || "",
      artistName: displayName || "Unknown",
      imageUrl: s.post.imageUrl || undefined,
      link: `/posts/${s.post.id}`,
      items: s.items.map((item) => ({
        id: String(item.id),
        label: item.label,
        brand: item.brand,
        name: item.name,
        imageUrl: item.imageUrl,
      })),
    };
  });

  // --- Build HeroPostEntry[] for HeroItemSync ---

  /** Helper: build MainHeroData from a post */
  function buildHeroData(
    post: {
      id: number | string;
      imageUrl?: string | null;
      artistName?: string | null;
      groupName?: string | null;
      context?: string | null;
      mediaTitle?: string | null;
    },
    spots: HeroSpotAnnotation[]
  ): MainHeroData {
    return {
      celebrityName: (
        post.artistName ||
        post.groupName ||
        "DECODED"
      ).toUpperCase(),
      editorialTitle:
        post.context || post.mediaTitle || "Today's Featured Look",
      editorialSubtitle: post.groupName
        ? `${post.groupName} — Curated by AI`
        : "AI가 큐레이션한 오늘의 에디토리얼",
      heroImageUrl: post.imageUrl || "",
      ctaLink: `/posts/${post.id}`,
      ctaLabel: "VIEW EDITORIAL",
      spots: spots.length > 0 ? spots : undefined,
    };
  }

  /** Helper: build spots from items */
  function buildSpots(
    items: {
      id: number | string;
      name?: string | null;
      label: string;
      brand?: string | null;
      imageUrl?: string | null;
    }[]
  ): HeroSpotAnnotation[] {
    const positions = [
      { x: 25, y: 22, side: "left" as const },
      { x: 75, y: 18, side: "right" as const },
      { x: 22, y: 68, side: "left" as const },
      { x: 78, y: 65, side: "right" as const },
    ];
    return items.slice(0, 4).map((item, i) => {
      const pos = positions[i % positions.length];
      return {
        id: String(item.id),
        x: pos.x,
        y: pos.y,
        label: item.name || item.label,
        brand: item.brand || undefined,
        imageUrl: item.imageUrl || undefined,
        side: pos.side,
      };
    });
  }

  const heroPosts: HeroPostEntry[] = [];

  // 1. DecodedPick as first hero (initial)
  if (decodedPick && decodedPick.post.imageUrl) {
    heroPosts.push({
      id: String(decodedPick.post.id),
      heroData: buildHeroData(decodedPick.post, buildSpots(decodedPick.items)),
      items: decodedPick.items.map((item) => ({
        id: String(item.id),
        brand: item.brand || "Unknown",
        name: item.name || item.label,
        imageUrl: item.imageUrl || undefined,
      })),
      galleryImage: `/api/v1/image-proxy?url=${encodeURIComponent(decodedPick.post.imageUrl)}`,
      galleryLabel:
        decodedPick.post.artistName ||
        decodedPick.post.groupName ||
        "Decoded Pick",
    });
  }

  // 2. WhatsNew posts
  for (const wnPost of whatsNewData) {
    if (!wnPost.post.imageUrl) continue;
    if (decodedPick && wnPost.post.id === decodedPick.post.id) continue;
    heroPosts.push({
      id: String(wnPost.post.id),
      heroData: buildHeroData(wnPost.post, buildSpots(wnPost.items)),
      items: wnPost.items.map((item) => ({
        id: String(item.id),
        brand: item.brand || "Unknown",
        name: item.name || item.label,
        imageUrl: item.imageUrl || undefined,
      })),
      galleryImage: `/api/v1/image-proxy?url=${encodeURIComponent(wnPost.post.imageUrl)}`,
      galleryLabel:
        wnPost.post.artistName || wnPost.post.groupName || "New Style",
    });
  }

  // 3. ArtistSpotlight posts
  for (const spPost of artistSpotlight) {
    if (!spPost.post.imageUrl) continue;
    if (heroPosts.some((hp) => hp.id === String(spPost.post.id))) continue;
    heroPosts.push({
      id: String(spPost.post.id),
      heroData: buildHeroData(spPost.post, buildSpots(spPost.items)),
      items: spPost.items.map((item) => ({
        id: String(item.id),
        brand: item.brand || "Unknown",
        name: item.name || item.label,
        imageUrl: item.imageUrl || undefined,
      })),
      galleryImage: `/api/v1/image-proxy?url=${encodeURIComponent(spPost.post.imageUrl)}`,
      galleryLabel:
        spPost.post.artistName || spPost.post.groupName || "Spotlight",
    });
  }

  // 4. WeeklyBest posts (no items, image only)
  for (const wbPost of weeklyBestPosts) {
    if (!wbPost.imageUrl) continue;
    if (heroPosts.some((hp) => hp.id === String(wbPost.id))) continue;
    heroPosts.push({
      id: String(wbPost.id),
      heroData: buildHeroData(wbPost, []),
      items: [],
      galleryImage: `/api/v1/image-proxy?url=${encodeURIComponent(wbPost.imageUrl)}`,
      galleryLabel: wbPost.artistName || wbPost.groupName || "Weekly Best",
    });
  }

  // Fallback: if no heroPosts, use featuredPost
  if (heroPosts.length === 0 && featuredPost?.imageUrl) {
    heroPosts.push({
      id: String(featuredPost.id),
      heroData: heroData as MainHeroData,
      items: [],
      galleryImage: `/api/v1/image-proxy?url=${encodeURIComponent(featuredPost.imageUrl)}`,
      galleryLabel:
        featuredPost.artistName || featuredPost.groupName || "Featured",
    });
  }

  const editorialStyle: StyleCardData | undefined =
    whatsNewStyles.length > 1
      ? whatsNewStyles[1]
      : (whatsNewStyles[0] ?? undefined);

  // --- Build new section data ---

  // Trending keywords with fallback
  const resolvedTrendingKeywords =
    trendingKeywords.length > 0
      ? trendingKeywords
      : [
          ...new Map(
            weeklyBestPosts
              .filter((p) => p.artistName || p.groupName)
              .map((p) => {
                const name = (p.artistName || p.groupName)!;
                return [
                  name,
                  {
                    id: `artist-${name}`,
                    label: name,
                    href: `/search?q=${encodeURIComponent(name)}`,
                    image: p.imageUrl || undefined,
                  },
                ];
              })
          ).values(),
        ].slice(0, 8);

  // EditorialMagazine — use posts with published post_magazines, fallback to mixed sources
  const magazineCards = magazinePosts
    .filter((mp) => mp.imageUrl)
    .slice(0, 8)
    .map((mp) => {
      const { displayName } = enrichArtistName(mp.artistName || mp.groupName);
      return {
        id: `mag-${mp.id}`,
        imageUrl: `/api/v1/image-proxy?url=${encodeURIComponent(mp.imageUrl!)}`,
        title: mp.magazineTitle,
        subtitle: mp.context || "",
        artistName: displayName || "Unknown",
        category: mp.magazineKeyword || "Editorial",
        link: `/posts/${mp.id}`,
      };
    });

  // Fallback: if fewer than 4 magazine cards, fill with spotlight/whatsNew/weeklyBest
  if (magazineCards.length < 4) {
    const usedPostIds = new Set<string | number>(magazineCards.map((c) => c.id.replace("mag-", "")));
    if (editorialStyle) usedPostIds.add(editorialStyle.id);
    if (decodedPick) usedPostIds.add(decodedPick.post.id);

    for (const s of [...spotlightStyles, ...whatsNewStyles]) {
      if (!usedPostIds.has(s.id) && s.imageUrl && magazineCards.length < 8) {
        magazineCards.push({
          id: `mag-${s.id}`,
          imageUrl: `/api/v1/image-proxy?url=${encodeURIComponent(s.imageUrl)}`,
          title: s.title,
          subtitle: s.description,
          artistName: s.artistName,
          category: "Style",
          link: s.link || `/posts/${s.id}`,
        });
        usedPostIds.add(s.id);
      }
    }
    for (const p of weeklyBestPosts) {
      if (!usedPostIds.has(p.id) && p.imageUrl && magazineCards.length < 8) {
        magazineCards.push({
          id: `mag-${p.id}`,
          imageUrl: `/api/v1/image-proxy?url=${encodeURIComponent(p.imageUrl)}`,
          title: p.artistName || p.groupName || "Style",
          subtitle: p.context || "",
          artistName: p.artistName || p.groupName || "Unknown",
          category: "Weekly Best",
          link: `/posts/${p.id}`,
        });
        usedPostIds.add(p.id);
      }
    }
  }

  const editorialMagazineData: EditorialMagazineData = {
    cards: magazineCards,
  };

  // DomeGallery images — use weeklyBest posts
  const domeImages = weeklyBestPosts
    .filter((p) => p.imageUrl)
    .slice(0, 20)
    .map((p) => ({
      src: `/api/v1/image-proxy?url=${encodeURIComponent(p.imageUrl!)}`,
      alt: p.artistName || p.groupName || "Style",
    }));

  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      {/* ─── 1. Hero Collage ─── */}
      <HeroItemSync posts={heroPosts} />

      {/* ─── 2. Editorial + Trending (combo row) ─── */}
      <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
          <EditorialSection style={editorialStyle} embedded />
          <TrendingListSection keywords={resolvedTrendingKeywords} embedded />
        </div>
      </section>

      {/* ─── 3. Editorial Magazine (Horizontal Scroll) ─── */}
      <EditorialMagazine data={editorialMagazineData} />

      {/* ─── 4. Discovery Grid: DECODED PICKS ─── */}
      <section className="relative">
        <MasonryGrid items={gridItems as GridItemData[]} />
      </section>

      {/* ─── 5. For You — will migrate to Orval hooks (CSR) ─── */}

      {/* ─── 6. VTON Dome Gallery ─── */}
      <DomeGallerySection
        images={domeImages.length > 0 ? domeImages : undefined}
      />
    </div>
  );
}
