import { MasonryGrid, PersonalizeBanner } from "@/lib/components/main-renewal";
import type {
  MainHeroData,
  GridItemData,
  PersonalizeBannerData,
  HeroSpotAnnotation,
} from "@/lib/components/main-renewal";
import {
  DynamicHomeFeed,
  DomeGallerySection,
  MainFooter,
  HeroItemSync,
} from "@/lib/components/main";
import type {
  StyleCardData,
  HomeSectionData,
  HomeSectionType,
} from "@/lib/components/main";
import type { HeroPostEntry } from "@/lib/components/main/HeroItemSync";
import {
  fetchFeaturedPostServer,
  fetchWeeklyBestPostsServer,
  fetchWhatsNewPostsServer,
  fetchDecodedPickServer,
  fetchArtistSpotlightServer,
  fetchBestItemsServer,
  fetchTrendingKeywordsServer,
} from "@/lib/supabase/queries/main-page.server";
import {
  fetchForYouPosts,
  fetchTrendingPosts,
  buildHomeLayout,
  type PersonalizedPostData,
} from "@/lib/supabase/queries/personalization.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import bannerData from "@/lib/components/main-renewal/mock/personalize-banner.json";
import defaultHeroData from "@/lib/components/main-renewal/mock/main-hero.json";
import defaultGridItems from "@/lib/components/main-renewal/mock/main-grid-items.json";

/** Convert PersonalizedPostData to StyleCardData */
function toStyleCard(post: PersonalizedPostData): StyleCardData {
  return {
    id: post.id,
    title: post.artistName || post.groupName || "Style",
    description: post.context || post.mediaTitle || "",
    artistName: post.artistName || post.groupName || "Unknown",
    imageUrl: post.imageUrl || undefined,
    link: `/posts/${post.id}`,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  // Resolve auth user for personalization
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Parallel fetch: layout config + all section data
  const [
    layoutConfig,
    featuredPost,
    weeklyBestPosts,
    whatsNewData,
    decodedPick,
    artistSpotlight,
    bestItems,
    trendingKeywords,
    forYouPosts,
    trendingPosts,
  ] = await Promise.all([
    buildHomeLayout(userId),
    fetchFeaturedPostServer(),
    fetchWeeklyBestPostsServer(30),
    fetchWhatsNewPostsServer(30),
    fetchDecodedPickServer(),
    fetchArtistSpotlightServer(30),
    fetchBestItemsServer(6),
    fetchTrendingKeywordsServer(8),
    userId ? fetchForYouPosts(userId, 9) : fetchTrendingPosts(9),
    fetchTrendingPosts(9),
  ]);

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

  const gridItems: GridItemData[] =
    weeklyBestPosts.length > 0
      ? weeklyBestPosts
          .filter((p) => p.imageUrl)
          .map((post, i) => ({
            id: post.id,
            imageUrl: post.imageUrl!,
            title: post.artistName || post.groupName || "Unknown",
            subtitle: post.context || post.mediaTitle || undefined,
            category: post.mediaType || "Style",
            link: `/posts/${post.id}`,
            aspectRatio: [1.25, 1.0, 1.4, 0.8, 1.2, 1.0, 1.5, 0.9][i % 8],
          }))
      : (defaultGridItems as GridItemData[]);

  const decodedPickStyle: StyleCardData | undefined = decodedPick
    ? {
        id: decodedPick.post.id,
        title: decodedPick.post.context || "Decoded's Pick",
        description: decodedPick.post.mediaTitle || "",
        artistName:
          decodedPick.post.artistName ||
          decodedPick.post.groupName ||
          "Unknown",
        imageUrl: decodedPick.post.imageUrl || undefined,
        link: `/posts/${decodedPick.post.id}`,
        items: decodedPick.items.map((item) => ({
          id: String(item.id),
          label: item.label,
          brand: item.brand,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
      }
    : undefined;

  const spotlightStyles: StyleCardData[] = artistSpotlight.map((s) => ({
    id: s.post.id,
    title: s.post.artistName || s.post.groupName || "Artist",
    description: s.post.context || s.post.mediaTitle || "",
    artistName: s.post.artistName || s.post.groupName || "Unknown",
    imageUrl: s.post.imageUrl || undefined,
    link: `/posts/${s.post.id}`,
  }));

  const whatsNewStyles: StyleCardData[] = whatsNewData.map((s) => ({
    id: s.post.id,
    title: s.post.artistName || s.post.groupName || "New Style",
    description: s.post.context || s.post.mediaTitle || "",
    artistName: s.post.artistName || s.post.groupName || "Unknown",
    imageUrl: s.post.imageUrl || undefined,
    link: `/posts/${s.post.id}`,
    items: s.items.map((item) => ({
      id: String(item.id),
      label: item.label,
      brand: item.brand,
      name: item.name,
      imageUrl: item.imageUrl,
    })),
  }));

  const bestItemCards = bestItems.map((item) => ({
    id: String(item.item.id),
    brand: item.item.brand || "Unknown",
    name: item.item.product_name || "Product",
    imageUrl: item.imageUrl || undefined,
    link: `/items/${item.item.id}`,
  }));

  // --- Build HeroPostEntry[] for HeroItemSync ---
  // Each entry = a post that can become the hero, with its items

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
    // Positions at image edges — avoid center "DECODED" text
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

  // 2. WhatsNew posts (only with items/solutions)
  for (const wnPost of whatsNewData) {
    if (!wnPost.post.imageUrl) continue;
    if (wnPost.items.length === 0) continue; // items 있는 것만
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

  // 3. ArtistSpotlight posts (only with items/solutions)
  for (const spPost of artistSpotlight) {
    if (!spPost.post.imageUrl) continue;
    if (spPost.items.length === 0) continue; // items 있는 것만
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

  // 4. WeeklyBest posts (only with items/solutions)
  for (const wbPost of weeklyBestPosts) {
    if (!wbPost.imageUrl) continue;
    if (heroPosts.some((hp) => hp.id === String(wbPost.id))) continue;
    // WeeklyBest doesn't have items data — skip (items-only filter)
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

  const weeklyBestStyles = weeklyBestPosts.slice(0, 4).map((post) => ({
    id: post.id,
    artistName: post.artistName || post.groupName || "Unknown",
    imageUrl: post.imageUrl || undefined,
    link: `/posts/${post.id}`,
  }));

  const forYouStyles = forYouPosts.map(toStyleCard);
  const trendingStyles = trendingPosts.map(toStyleCard);

  // Editorial feature: use first whatsNew style with items
  const editorialStyle: StyleCardData | undefined =
    whatsNewStyles.length > 0 ? whatsNewStyles[0] : undefined;

  // --- Assemble section data for DynamicHomeFeed ---

  const sectionData: HomeSectionData = {
    decodedPickStyle,
    editorialStyle,
    forYou: {
      forYouPosts: forYouStyles,
      trendingPosts: trendingStyles,
      followingPosts: forYouStyles,
    },
    spotlightStyles,
    whatsNewStyles,
    bestItemCards,
    weeklyBestStyles,
    trendingKeywords:
      trendingKeywords.length > 0
        ? trendingKeywords
        : // Fallback: derive from weeklyBestPosts artist names
          [
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
          ].slice(0, 8),
  };

  // Layout: Hero → TopItems → Editorial+Trending → ForYou(logged in) → MasonryGrid → DomeGallery → Footer
  const newSections: HomeSectionType[] = [
    "editorial-feature",
    "trending-list",
    ...(userId ? (["for-you"] as const) : []),
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero + Items Strip + CircularGallery — post gallery changes hero */}
      <HeroItemSync posts={heroPosts} />

      {/* Editorial + Trending + ForYou(logged in) */}
      <DynamicHomeFeed
        sections={newSections}
        layoutMode={layoutConfig.layoutMode}
        data={sectionData}
      />

      {/* DECODED PICKS — Masonry Grid */}
      <section className="relative">
        <MasonryGrid items={gridItems as GridItemData[]} />
      </section>

      {/* VTON CTA — full-bleed dome gallery */}
      <DomeGallerySection />

      {/* Footer */}
      <MainFooter />
    </div>
  );
}
