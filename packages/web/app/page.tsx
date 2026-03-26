import {
  MasonryGrid,
  DecodeShowcase,
  VirtualTryOnTeaser,
  CommunityLeaderboard,
  EditorialMagazine,
} from "@/lib/components/main-renewal";
import type {
  MainHeroData,
  GridItemData,
  HeroSpotAnnotation,
  DecodeShowcaseData,
  VTONTeaserData,
  CommunityLeaderboardData,
  EditorialMagazineData,
} from "@/lib/components/main-renewal";
import {
  DomeGallerySection,
  MainFooter,
  HeroItemSync,
  EditorialSection,
  TrendingListSection,
  ForYouSection,
} from "@/lib/components/main";
import type { StyleCardData } from "@/lib/components/main";
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
  type PersonalizedPostData,
} from "@/lib/supabase/queries/personalization.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  await searchParams;
  // Resolve auth user for personalization
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Parallel fetch: all section data
  const [
    featuredPost,
    weeklyBestPosts,
    whatsNewData,
    decodedPick,
    artistSpotlight,
    bestItems,
    trendingKeywords,
    forYouPosts,
    trendingPosts,
    rankingUsersResult,
  ] = await Promise.all([
    fetchFeaturedPostServer(),
    fetchWeeklyBestPostsServer(30),
    fetchWhatsNewPostsServer(30),
    fetchDecodedPickServer(),
    fetchArtistSpotlightServer(30),
    fetchBestItemsServer(6),
    fetchTrendingKeywordsServer(8),
    userId ? fetchForYouPosts(userId, 9) : fetchTrendingPosts(9),
    fetchTrendingPosts(9),
    supabase
      .from("users")
      .select("id, username, avatar_url, total_points, style_dna")
      .order("total_points", { ascending: false })
      .limit(10),
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

  const forYouStyles = forYouPosts.map(toStyleCard);
  const trendingStyles = trendingPosts.map(toStyleCard);

  // Editorial feature: use first whatsNew style with items
  const editorialStyle: StyleCardData | undefined =
    whatsNewStyles.length > 0 ? whatsNewStyles[0] : undefined;

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

  // Section 2: DecodeShowcase — use first whatsNew post with items + real spot coordinates
  const showcaseSource = whatsNewData.find(
    (w) => w.post.imageUrl && w.items.length >= 2
  );
  const decodeShowcaseData: DecodeShowcaseData = showcaseSource
    ? {
        sourceImageUrl: `/api/v1/image-proxy?url=${encodeURIComponent(showcaseSource.post.imageUrl!)}`,
        artistName:
          showcaseSource.post.artistName ||
          showcaseSource.post.groupName ||
          "DECODED",
        tagline: "See how it's Decoded",
        detectedItems: showcaseSource.items.slice(0, 4).map((item, i) => ({
          id: String(item.id),
          label: item.name || item.label,
          brand: item.brand || undefined,
          imageUrl: item.imageUrl
            ? `/api/v1/image-proxy?url=${encodeURIComponent(item.imageUrl)}`
            : undefined,
          bbox: {
            // Use real spot coordinates when available (position_left/top are percentage strings)
            x: Math.max(
              5,
              Math.min(
                70,
                parseFloat(
                  showcaseSource.spots?.[i]?.position_left ??
                    String([15, 55, 10, 50][i % 4])
                )
              )
            ),
            y: Math.max(
              5,
              Math.min(
                70,
                parseFloat(
                  showcaseSource.spots?.[i]?.position_top ??
                    String([20, 15, 55, 60][i % 4])
                )
              )
            ),
            width: [28, 24, 26, 22][i % 4],
            height: [32, 28, 30, 24][i % 4],
          },
        })),
      }
    : {
        sourceImageUrl: "",
        artistName: "DECODED",
        tagline: "See how it's Decoded",
        detectedItems: [],
      };

  // Section 4: EditorialMagazine — whatsNew + spotlight cards with image proxy
  const editorialMagazineData: EditorialMagazineData = {
    cards: [
      ...whatsNewStyles.slice(0, 4).map((s) => ({
        id: `wn-${s.id}`,
        imageUrl: s.imageUrl
          ? `/api/v1/image-proxy?url=${encodeURIComponent(s.imageUrl)}`
          : "",
        title: s.title,
        subtitle: s.description,
        artistName: s.artistName,
        category: "What's New",
        link: s.link,
      })),
      ...spotlightStyles.slice(0, 4).map((s) => ({
        id: `sp-${s.id}`,
        imageUrl: s.imageUrl
          ? `/api/v1/image-proxy?url=${encodeURIComponent(s.imageUrl)}`
          : "",
        title: s.title,
        subtitle: s.description,
        artistName: s.artistName,
        category: "Spotlight",
        link: s.link,
      })),
    ],
  };

  // Section 5: VirtualTryOnTeaser — bestItems with image proxy
  const vtonTeaserData: VTONTeaserData = {
    pairs: bestItems.slice(0, 3).map((bi) => ({
      id: String(bi.item.id),
      beforeImageUrl: bi.imageUrl
        ? `/api/v1/image-proxy?url=${encodeURIComponent(bi.imageUrl)}`
        : "",
      afterImageUrl: bi.imageUrl
        ? `/api/v1/image-proxy?url=${encodeURIComponent(bi.imageUrl)}`
        : "",
      itemName: bi.item.product_name || "Product",
      itemBrand: bi.item.brand || undefined,
    })),
    ctaLabel: "나의 스타일 DNA에 입혀보기",
  };

  // Section 8: CommunityLeaderboard — top users by total_points + trending tags
  const rankingUsers = rankingUsersResult.data ?? [];
  const leaderboardData: CommunityLeaderboardData = {
    trendingUsers: rankingUsers
      .filter((u) => u.username)
      .map((u) => {
        const dna = u.style_dna as Record<string, unknown> | null;
        const styleTags: string[] = Array.isArray(dna?.tags)
          ? (dna.tags as unknown[])
              .filter((t): t is string => typeof t === "string")
              .slice(0, 3)
          : [];
        return {
          id: u.id,
          username: u.username!,
          avatarUrl: u.avatar_url ?? undefined,
          styleTags,
          score: u.total_points,
        };
      }),
    trendingTags: resolvedTrendingKeywords.map((k) =>
      typeof k === "string" ? k : k.label
    ),
  };

  // DomeGallery images — real post images from heroPosts
  const domeImages = heroPosts
    .filter((hp) => hp.galleryImage)
    .slice(0, 20)
    .map((hp) => ({
      src: hp.galleryImage!,
      alt: hp.galleryLabel || "Style",
    }));

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ─── 1. Hero Collage ─── */}
      <HeroItemSync posts={heroPosts} />

      {/* ─── 2. The Magic: AI Detection Showcase ─── */}
      <DecodeShowcase data={decodeShowcaseData} />

      {/* ─── 3. Editorial + Trending (combo row) ─── */}
      <section className="py-10 lg:py-14 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
          <EditorialSection style={editorialStyle} embedded />
          <TrendingListSection
            keywords={resolvedTrendingKeywords}
            embedded
          />
        </div>
      </section>

      {/* ─── 4. Editorial Magazine (Horizontal Scroll) ─── */}
      <EditorialMagazine data={editorialMagazineData} />

      {/* ─── 5. VTON Teaser: Before/After ─── */}
      <VirtualTryOnTeaser data={vtonTeaserData} />

      {/* ─── 6. Discovery Grid: DECODED PICKS ─── */}
      <section className="relative">
        <MasonryGrid items={gridItems as GridItemData[]} />
      </section>

      {/* ─── 7. For You (logged-in only) ─── */}
      {userId && (
        <ForYouSection
          forYouPosts={forYouStyles}
          trendingPosts={trendingStyles}
          followingPosts={forYouStyles}
        />
      )}

      {/* ─── 8. Style DNA & Community Rank ─── */}
      <CommunityLeaderboard data={leaderboardData} />

      {/* ─── 9. Personalize Banner (VTON CTA) ─── */}
      <DomeGallerySection images={domeImages.length > 0 ? domeImages : undefined} />

      {/* Footer */}
      <MainFooter />
    </div>
  );
}
