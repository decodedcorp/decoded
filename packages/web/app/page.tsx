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
  TrendingPostsSection,
  HelpFindSection,
  EditorialSection,
  TrendingListSection,
  DecodedPickSection,
} from "@/lib/components/main";
import type { LatestPostCardData, StyleCardData, ItemCardData } from "@/lib/components/main";
import type { HeroPostEntry } from "@/lib/components/main/HeroItemSync";
import type { PaginatedResponsePostListItem } from "@/lib/api/generated/models";
import type { PaginatedResponsePostListItemDataItem } from "@/lib/api/generated/models";
import { serverApiGet } from "@/lib/api/server-instance";
import {
  fetchDecodedPickServer,
  fetchWeeklyBestPostsServer,
  fetchWhatsNewPostsServer,
  fetchMagazinePostsServer,
} from "@/lib/supabase/queries/main-page.server";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import type { ArtistProfileEntry } from "@/lib/supabase/queries/warehouse-entities.server";

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
    decodedPick,
    artistProfileMap,
  ] = await Promise.all([
    fetchPosts("sort=popular&per_page=30", async () =>
      (await fetchWeeklyBestPostsServer(30)).map(toApiPost)
    ),
    fetchPosts("sort=recent&per_page=50", async () =>
      (await fetchWhatsNewPostsServer(50)).map((s) => toApiPost(s.post))
    ),
    fetchPosts("has_magazine=true&per_page=8", async () =>
      (await fetchMagazinePostsServer(8)).map(magazineToApiPost)
    ),
    fetchDecodedPickServer(),
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

  // --- Trending on Decoded ---

  const trendingPostCards: LatestPostCardData[] = popularPosts.slice(0, 16).map((p) => {
    const { displayName } = enrichArtistName(p.artist_name || p.group_name);
    return {
      id: p.id,
      imageUrl: proxyImg(p.image_url),
      artistName: displayName || "Unknown",
      context: p.context || p.title || "",
      createdAt: p.created_at,
      createdWithSolutions: p.created_with_solutions ?? null,
      link: `/posts/${p.id}`,
    };
  });

  // --- 아이템 찾아주세요 (created_with_solutions = false) ---

  const helpFindCards: LatestPostCardData[] = recentPosts
    .filter((p) => p.created_with_solutions === false)
    .slice(0, 12)
    .map((p) => {
      const { displayName } = enrichArtistName(p.artist_name || p.group_name);
      return {
        id: p.id,
        imageUrl: proxyImg(p.image_url),
        artistName: displayName || "Unknown",
        context: p.context || p.title || "",
        createdAt: p.created_at,
        createdWithSolutions: false,
        link: `/posts/${p.id}`,
      };
    });

  // --- Magazine ---

  const magazineCards = magazinePosts
    .filter((mp) => mp.post_magazine_title)
    .slice(0, 8)
    .map((mp) => {
      const { displayName } = enrichArtistName(mp.artist_name || mp.group_name);
      return {
        id: `mag-${mp.id}`, imageUrl: proxyImg(mp.image_url),
        title: mp.post_magazine_title!, subtitle: mp.context || "",
        artistName: displayName || "Unknown", category: "Editorial",
        link: `/posts/${mp.id}`,
      };
    });

  if (magazineCards.length < 4) {
    const usedIds = new Set(magazineCards.map((c) => c.id.replace("mag-", "")));
    for (const p of [...recentPosts, ...popularPosts]) {
      if (!usedIds.has(p.id) && magazineCards.length < 8) {
        const { displayName } = enrichArtistName(p.artist_name || p.group_name);
        magazineCards.push({
          id: `mag-${p.id}`, imageUrl: proxyImg(p.image_url),
          title: displayName || p.title || "Style", subtitle: p.context || "",
          artistName: displayName || "Unknown", category: "Style",
          link: `/posts/${p.id}`,
        });
        usedIds.add(p.id);
      }
    }
  }

  const editorialMagazineData: EditorialMagazineData = { cards: magazineCards };

  // --- Decoded Pick ---

  const pickStyleData: StyleCardData | undefined =
    decodedPick && decodedPick.post.imageUrl
      ? {
          id: decodedPick.post.id,
          title: enrichArtistName(decodedPick.post.artistName || decodedPick.post.groupName).displayName || "Decoded Pick",
          description: decodedPick.post.context || "",
          artistName: enrichArtistName(decodedPick.post.artistName || decodedPick.post.groupName).displayName || "Unknown",
          imageUrl: proxyImg(decodedPick.post.imageUrl),
          link: `/posts/${decodedPick.post.id}`,
          spots: decodedPick.spots?.map((s) => ({
            id: s.id, x: parseFloat(s.position_left) || 50, y: parseFloat(s.position_top) || 50,
            label: s.solutions?.[0]?.title || "Item",
          })),
        }
      : undefined;

  const pickItems: ItemCardData[] | undefined = decodedPick
    ? decodedPick.items.map((item) => ({
        id: String(item.id),
        brand: item.brand || "Unknown",
        name: item.name || item.label,
        imageUrl: item.imageUrl,
        link: `/items/${item.id}`,
      }))
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

      <TrendingPostsSection posts={trendingPostCards} />

      <HelpFindSection posts={helpFindCards} />

      <EditorialMagazine data={editorialMagazineData} />

      <DecodedPickSection
        styleData={pickStyleData}
        items={pickItems}
        pickDate={decodedPick?.pickDate ?? null}
        curatedBy={decodedPick?.curatedBy ?? null}
        note={decodedPick?.note ?? null}
      />

      <section className="relative">
        <MasonryGrid items={gridItems as GridItemData[]} />
      </section>

      {domeImages.length > 0 && (
        <DomeGallerySection images={domeImages} />
      )}
    </div>
  );
}
