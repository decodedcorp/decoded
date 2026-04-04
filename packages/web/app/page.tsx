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
  // TrendingPostsSection,  // #88: temporarily disabled
  // HelpFindSection,        // #88: temporarily disabled
  EditorialSection,
  TrendingListSection,
  // DecodedPickSection,  // #91: temporarily disabled
} from "@/lib/components/main";
import type { LatestPostCardData, StyleCardData, ItemCardData } from "@/lib/components/main";
import type { TrendingKeywordItem } from "@/lib/components/main/TrendingListSection";
import type { HeroPostEntry } from "@/lib/components/main/HeroItemSync";
import type { PaginatedResponsePostListItem } from "@/lib/api/generated/models";
import type { PaginatedResponsePostListItemDataItem } from "@/lib/api/generated/models";
import { serverApiGet } from "@/lib/api/server-instance";
import {
  // fetchDecodedPickServer,  // #91: temporarily disabled
  fetchWeeklyBestPostsServer,
  fetchWhatsNewPostsServer,
  fetchMagazinePostsServer,
} from "@/lib/supabase/queries/main-page.server";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import type { ArtistProfileEntry } from "@/lib/supabase/queries/warehouse-entities.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Shorthand for post list item from REST API */
type ApiPost = PaginatedResponsePostListItemDataItem;

const proxyImg = (url: string) =>
  `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;

/** Convert Supabase PostData to ApiPost shape */
function toApiPost(p: { id: string; imageUrl: string | null; artistName: string | null; groupName: string | null; context: string | null; mediaTitle: string | null; viewCount: number; createdAt: string }): ApiPost {
  return {
    id: p.id, image_url: p.imageUrl || "", artist_name: p.artistName,
    group_name: p.groupName, context: p.context, title: p.mediaTitle,
    view_count: p.viewCount, created_at: p.createdAt, status: "published" as const,
    comment_count: 0, spot_count: 0, media_source: {} as any, user: {} as any,
  };
}

/** Convert MagazinePostData to ApiPost shape */
function magazineToApiPost(p: { id: string; imageUrl: string | null; artistName: string | null; groupName: string | null; context: string | null; magazineTitle: string; magazineKeyword: string | null }): ApiPost {
  return {
    id: p.id, image_url: p.imageUrl || "", artist_name: p.artistName,
    group_name: p.groupName, context: p.context, title: p.magazineTitle,
    post_magazine_title: p.magazineTitle, view_count: 0, created_at: "", status: "published" as const,
    comment_count: 0, spot_count: 0, media_source: {} as any, user: {} as any,
  };
}

/** REST API fetch with Supabase fallback when backend unavailable */
async function fetchPosts(params: string, fallback?: () => Promise<ApiPost[]>): Promise<ApiPost[]> {
  try {
    const res = await serverApiGet<PaginatedResponsePostListItem>(`/api/v1/posts?${params}`);
    return res.data ?? [];
  } catch {
    if (fallback) return fallback();
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  await searchParams;

  // Parallel fetch: REST API (with Supabase fallback) + Supabase-only
  const [
    popularPosts,
    recentPosts,
    magazinePosts,
    // decodedPick,  // #91: temporarily disabled
    artistProfileMap,
  ] = await Promise.all([
    fetchPosts("sort=popular&per_page=30", async () =>
      (await fetchWeeklyBestPostsServer(30)).map(toApiPost)
    ),
    fetchPosts("sort=recent&per_page=50", async () =>
      (await fetchWhatsNewPostsServer(50)).map((s) => toApiPost(s.post))
    ),
    fetchPosts("has_magazine=true&per_page=30", async () =>
      (await fetchMagazinePostsServer(30)).map(magazineToApiPost)
    ),
    // fetchDecodedPickServer(),  // #91: temporarily disabled
    buildArtistProfileMap(),
  ]);

  // --- Helpers ---

  function enrichArtistName(
    name: string | null | undefined
  ): { displayName: string; profileImageUrl: string | null } {
    if (!name) return { displayName: "", profileImageUrl: null };
    const entry: ArtistProfileEntry | undefined = artistProfileMap.get(name.toLowerCase());
    return {
      displayName: entry?.name ?? name,
      profileImageUrl: entry?.profileImageUrl ?? null,
    };
  }

  function buildHeroFromApiPost(post: ApiPost, spots?: HeroSpotAnnotation[]): MainHeroData {
    return {
      celebrityName: (post.artist_name || post.group_name || "DECODED").toUpperCase(),
      editorialTitle: post.context || post.title || "Today's Featured Look",
      editorialSubtitle: post.group_name
        ? `${post.group_name} — Curated by AI`
        : "AI가 큐레이션한 오늘의 에디토리얼",
      heroImageUrl: post.image_url,
      ctaLink: `/posts/${post.id}`,
      ctaLabel: "VIEW EDITORIAL",
      spots: spots && spots.length > 0 ? spots : undefined,
    };
  }

  function buildSpots(
    items: { id: number | string; name?: string | null; label: string; brand?: string | null; imageUrl?: string | null }[]
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
        id: String(item.id), x: pos.x, y: pos.y,
        label: item.name || item.label,
        brand: item.brand || undefined,
        imageUrl: item.imageUrl || undefined,
        side: pos.side,
      };
    });
  }

  // --- Hero ---

  const heroPosts: HeroPostEntry[] = [];

  for (const post of recentPosts) {
    if (heroPosts.some((hp) => hp.id === post.id)) continue;
    heroPosts.push({
      id: post.id, heroData: buildHeroFromApiPost(post), items: [],
      galleryImage: proxyImg(post.image_url),
      galleryLabel: post.artist_name || post.group_name || "New Style",
    });
  }

  for (const post of popularPosts) {
    if (heroPosts.some((hp) => hp.id === post.id)) continue;
    heroPosts.push({
      id: post.id, heroData: buildHeroFromApiPost(post), items: [],
      galleryImage: proxyImg(post.image_url),
      galleryLabel: post.artist_name || post.group_name || "Popular",
    });
  }

  if (heroPosts.length === 0) {
    const fallback = popularPosts[0] || recentPosts[0];
    if (fallback) {
      heroPosts.push({
        id: fallback.id, heroData: buildHeroFromApiPost(fallback), items: [],
        galleryImage: proxyImg(fallback.image_url),
        galleryLabel: fallback.artist_name || "Featured",
      });
    }
  }

  // --- Trending on Decoded --- (#88: temporarily disabled)
  // const trendingPostCards: LatestPostCardData[] = popularPosts.slice(0, 16).map((p) => {
  //   const { displayName } = enrichArtistName(p.artist_name || p.group_name);
  //   return {
  //     id: p.id, imageUrl: proxyImg(p.image_url), artistName: displayName || "Unknown",
  //     context: p.context || p.title || "", createdAt: p.created_at,
  //     createdWithSolutions: p.created_with_solutions ?? null, link: `/posts/${p.id}`,
  //   };
  // });

  // --- 아이템 찾아주세요 --- (#88: temporarily disabled)
  // const helpFindCards: LatestPostCardData[] = recentPosts
  //   .filter((p) => p.created_with_solutions === false)
  //   .slice(0, 12)
  //   .map((p) => {
  //     const { displayName } = enrichArtistName(p.artist_name || p.group_name);
  //     return {
  //       id: p.id, imageUrl: proxyImg(p.image_url), artistName: displayName || "Unknown",
  //       context: p.context || p.title || "", createdAt: p.created_at,
  //       createdWithSolutions: false, link: `/posts/${p.id}`,
  //     };
  //   });

  // --- Magazine (artist-specific) ---

  const allMagazineCards = magazinePosts
    .filter((mp) => mp.post_magazine_title)
    .map((mp) => {
      const { displayName } = enrichArtistName(mp.artist_name || mp.group_name);
      return {
        id: `mag-${mp.id}`, imageUrl: proxyImg(mp.image_url),
        title: mp.post_magazine_title!, subtitle: mp.context || "",
        artistName: displayName || "Unknown", category: "Editorial",
        link: `/posts/${mp.id}?from=explore`,
      };
    });

  const magazineArtistCounts = new Map<string, { count: number; displayName: string }>();
  for (const c of allMagazineCards) {
    const key = c.artistName.toLowerCase();
    const existing = magazineArtistCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      magazineArtistCounts.set(key, { count: 1, displayName: c.artistName });
    }
  }
  const eligibleArtists = [...magazineArtistCounts.values()]
    .filter(({ count }) => count >= 3)
    .map(({ displayName }) => displayName);
  const featuredArtist = eligibleArtists.length > 0
    ? eligibleArtists[Math.floor(Math.random() * eligibleArtists.length)]
    : undefined;

  const magazineCards = featuredArtist
    ? allMagazineCards.filter((c) => c.artistName.toLowerCase() === featuredArtist.toLowerCase())
    : allMagazineCards.slice(0, 8);

  const editorialMagazineData: EditorialMagazineData = {
    cards: magazineCards,
    featuredArtist,
  };

  // --- Decoded Pick --- (#91: temporarily disabled)

  // const pickStyleData: StyleCardData | undefined =
  //   decodedPick && decodedPick.post.imageUrl
  //     ? {
  //         id: decodedPick.post.id,
  //         title: enrichArtistName(decodedPick.post.artistName || decodedPick.post.groupName).displayName || "Decoded Pick",
  //         description: decodedPick.post.context || "",
  //         artistName: enrichArtistName(decodedPick.post.artistName || decodedPick.post.groupName).displayName || "Unknown",
  //         imageUrl: proxyImg(decodedPick.post.imageUrl),
  //         link: `/posts/${decodedPick.post.id}`,
  //         spots: decodedPick.spots?.map((s) => ({
  //           id: s.id, x: parseFloat(s.position_left) || 50, y: parseFloat(s.position_top) || 50,
  //           label: s.solutions?.[0]?.title || "Item",
  //         })),
  //       }
  //     : undefined;

  // const pickItems: ItemCardData[] | undefined = decodedPick
  //   ? decodedPick.items.map((item) => ({
  //       id: String(item.id),
  //       brand: item.brand || "Unknown",
  //       name: item.name || item.label,
  //       imageUrl: item.imageUrl,
  //       link: `/items/${item.id}`,
  //     }))
  //   : undefined;

  // --- Editorial + Trending 2-column (#89) ---

  const artistCounts = new Map<string, { count: number; image: string }>();
  for (const p of [...popularPosts, ...recentPosts]) {
    const key = p.artist_name || p.group_name || "";
    if (!key) continue;
    const existing = artistCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      artistCounts.set(key, { count: 1, image: p.image_url });
    }
  }

  const trendingKeywords: TrendingKeywordItem[] = [...artistCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, { image }]) => ({
      id: `artist-${name}`,
      label: enrichArtistName(name).displayName || name,
      href: `/search?q=${encodeURIComponent(name)}`,
      image: proxyImg(image),
    }));

  const editorialPool = popularPosts.length > 0
    ? [...popularPosts].sort(() => Math.random() - 0.5)
    : [];
  const editorialMain = editorialPool[0];
  const editorialStyle: StyleCardData | undefined = editorialMain
    ? {
        id: editorialMain.id,
        title: enrichArtistName(editorialMain.artist_name).displayName || "Featured",
        description: editorialMain.context || editorialMain.title || "",
        artistName: enrichArtistName(editorialMain.artist_name).displayName || "Unknown",
        imageUrl: proxyImg(editorialMain.image_url),
        link: `/posts/${editorialMain.id}`,
        items: editorialPool.slice(1, 4).map((p) => ({
          id: p.id,
          label: enrichArtistName(p.artist_name).displayName || "Item",
          name: enrichArtistName(p.artist_name).displayName || "Item",
          brand: p.group_name || "",
          imageUrl: proxyImg(p.image_url),
        })),
      }
    : undefined;

  // --- MasonryGrid ---

  const gridItems: GridItemData[] = popularPosts.slice(0, 16).map((post, i) => {
    const { displayName } = enrichArtistName(post.artist_name || post.group_name);
    return {
      id: post.id, imageUrl: post.image_url,
      title: displayName || "Unknown",
      subtitle: post.context || post.title || undefined,
      category: "Style", link: `/posts/${post.id}`,
      aspectRatio: [1.25, 1.0, 1.4, 0.8, 1.2, 1.0, 1.5, 0.9][i % 8],
    };
  });

  // --- DomeGallery ---

  const domeImages = popularPosts.slice(0, 20).map((p) => ({
    src: proxyImg(p.image_url),
    alt: p.artist_name || p.group_name || "Style",
  }));

  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      <HeroItemSync posts={heroPosts} />

      {/* #89: 2-column Editorial + Trending */}
      <section className="py-14 lg:py-20 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:min-h-[520px]">
          <EditorialSection style={editorialStyle} embedded />
          <TrendingListSection keywords={trendingKeywords} embedded />
        </div>
      </section>

      <EditorialMagazine data={editorialMagazineData} />

      {/* #91: Decoded's Pick temporarily disabled */}
      {/* <DecodedPickSection
        styleData={pickStyleData}
        items={pickItems}
        pickDate={decodedPick?.pickDate ?? null}
        curatedBy={decodedPick?.curatedBy ?? null}
        note={decodedPick?.note ?? null}
      /> */}

      <section className="relative">
        <MasonryGrid items={gridItems as GridItemData[]} />
      </section>

      {domeImages.length > 0 && (
        <DomeGallerySection images={domeImages} />
      )}
    </div>
  );
}
