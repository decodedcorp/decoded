/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase raw query results lack typed shapes */
import { EditorialMagazine } from "@/lib/components/main-renewal";
import type {
  MainHeroData,
  GridItemData,
  HeroSpotAnnotation,
  EditorialMagazineData,
} from "@/lib/components/main-renewal";
import { HeroItemSync, EditorialCarousel } from "@/lib/components/main";
import {
  DynamicStyleMoods as StyleMoods,
  DynamicEditorPicks as EditorPicks,
  DynamicDomeGallerySection as DomeGallerySection,
} from "./home-dynamic-sections";
import { TrendingListSection } from "@/lib/components/main/TrendingListSection";
import type {
  LatestPostCardData,
  StyleCardData,
  ItemCardData,
} from "@/lib/components/main";
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
  fetchEditorPicksServer,
} from "@/lib/supabase/queries/main-page.server";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import type { ArtistProfileEntry } from "@/lib/supabase/queries/warehouse-entities.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Shorthand for post list item from REST API */
type ApiPost = PaginatedResponsePostListItemDataItem;

const proxyImg = (url: string) =>
  `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;

/** Convert Supabase PostData to ApiPost shape */
function toApiPost(p: {
  id: string;
  imageUrl: string | null;
  artistName: string | null;
  groupName: string | null;
  context: string | null;
  mediaTitle: string | null;
  viewCount: number;
  createdAt: string;
}): ApiPost {
  return {
    id: p.id,
    image_url: p.imageUrl || "",
    artist_name: p.artistName,
    group_name: p.groupName,
    context: p.context,
    title: p.mediaTitle,
    view_count: p.viewCount,
    created_at: p.createdAt,
    status: "published" as const,
    comment_count: 0,
    spot_count: 0,
    media_source: {} as any,
    user: {} as any,
  };
}

/** Convert MagazinePostData to ApiPost shape */
function magazineToApiPost(
  p: import("@/lib/supabase/queries/main-page.server").MagazinePostData
): ApiPost {
  return {
    id: p.id,
    image_url: p.imageUrl || "",
    artist_name: p.artistName,
    group_name: p.groupName,
    context: p.context,
    title: p.magazineTitle,
    post_magazine_title: p.magazineTitle,
    view_count: 0,
    created_at: "",
    status: "published" as const,
    comment_count: 0,
    spot_count: 0,
    media_source: {} as any,
    user: {} as any,
    _magazineItems: p.items,
  } as any;
}

/** REST API fetch with Supabase fallback when backend unavailable */
async function fetchPosts(
  params: string,
  fallback?: () => Promise<ApiPost[]>
): Promise<ApiPost[]> {
  try {
    const res = await serverApiGet<PaginatedResponsePostListItem>(
      `/api/v1/posts?${params}`
    );
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
    rawMagazinePosts,
    // decodedPick,  // #91: temporarily disabled
    artistProfileMap,
    editorPicks,
  ] = await Promise.all([
    fetchPosts("sort=popular&per_page=30", async () =>
      (await fetchWeeklyBestPostsServer(30)).map(toApiPost)
    ),
    fetchPosts("sort=recent&per_page=50", async () =>
      (await fetchWhatsNewPostsServer(50)).map((s) => toApiPost(s.post))
    ),
    fetchMagazinePostsServer(50), // Supabase direct — includes layout_json items
    // fetchDecodedPickServer(),  // #91: temporarily disabled
    buildArtistProfileMap(),
    fetchEditorPicksServer(),
  ]);

  // --- Helpers ---

  function enrichArtistName(name: string | null | undefined): {
    displayName: string;
    profileImageUrl: string | null;
  } {
    if (!name) return { displayName: "", profileImageUrl: null };
    const entry: ArtistProfileEntry | undefined = artistProfileMap.get(
      name.toLowerCase()
    );
    return {
      displayName: entry?.name ?? name,
      profileImageUrl: entry?.profileImageUrl ?? null,
    };
  }

  function buildHeroFromApiPost(
    post: ApiPost,
    spots?: HeroSpotAnnotation[]
  ): MainHeroData {
    return {
      celebrityName: (
        post.artist_name ||
        post.group_name ||
        "DECODED"
      ).toUpperCase(),
      editorialTitle: post.context || post.title || "Today's Featured Look",
      editorialSubtitle: post.group_name
        ? `${post.group_name} — Curated by AI`
        : "Today's AI-curated editorial",
      heroImageUrl: post.image_url,
      ctaLink: `/posts/${post.id}`,
      ctaLabel: "VIEW EDITORIAL",
      spots: spots && spots.length > 0 ? spots : undefined,
    };
  }

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

  // --- Hero ---

  const heroPosts: HeroPostEntry[] = [];
  const heroIds = new Set<string>();

  for (const post of recentPosts) {
    if (heroIds.has(post.id)) continue;
    heroIds.add(post.id);
    heroPosts.push({
      id: post.id,
      heroData: buildHeroFromApiPost(post),
      items: [],
      galleryImage: proxyImg(post.image_url),
      galleryLabel: post.artist_name || post.group_name || "New Style",
    });
  }

  for (const post of popularPosts) {
    if (heroIds.has(post.id)) continue;
    heroIds.add(post.id);
    heroPosts.push({
      id: post.id,
      heroData: buildHeroFromApiPost(post),
      items: [],
      galleryImage: proxyImg(post.image_url),
      galleryLabel: post.artist_name || post.group_name || "Popular",
    });
  }

  if (heroPosts.length === 0) {
    const fallback = popularPosts[0] || recentPosts[0];
    if (fallback) {
      heroPosts.push({
        id: fallback.id,
        heroData: buildHeroFromApiPost(fallback),
        items: [],
        galleryImage: proxyImg(fallback.image_url),
        galleryLabel: fallback.artist_name || "Featured",
      });
    }
  }

  // Enrich hero posts with spots/solutions for item overlay
  try {
    const supabase = await createSupabaseServerClient();
    const heroPostIds = heroPosts.map((hp) => hp.id);
    const { data: heroSpots } = await supabase
      .from("spots")
      .select(
        "id, post_id, position_top, position_left, solutions(id, title, thumbnail_url, metadata)"
      )
      .in("post_id", heroPostIds);

    if (heroSpots) {
      const spotsByPost = new Map<string, typeof heroSpots>();
      for (const spot of heroSpots) {
        const existing = spotsByPost.get(spot.post_id) ?? [];
        existing.push(spot);
        spotsByPost.set(spot.post_id, existing);
      }
      for (const hp of heroPosts) {
        const spots = spotsByPost.get(hp.id) ?? [];
        hp.items = spots
          .flatMap((spot: any) =>
            (spot.solutions || [])
              .filter((sol: any) => sol.thumbnail_url)
              .map((sol: any) => ({
                id: sol.id,
                label: sol.title,
                name: sol.title,
                brand: (sol.metadata as any)?.brand || "",
                imageUrl: proxyImg(sol.thumbnail_url),
              }))
          )
          .slice(0, 4);
        if (hp.items.length > 0) {
          const post =
            recentPosts.find((p) => p.id === hp.id) ??
            popularPosts.find((p) => p.id === hp.id);
          if (post) {
            hp.heroData = buildHeroFromApiPost(
              post,
              buildSpots(hp.items.map((it) => ({ ...it, label: it.name })))
            );
          }
        }
      }
    }
  } catch {
    /* hero spots enrichment failed — show without items */
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

  // --- Magazine ---

  const allMagazineCards = rawMagazinePosts
    .filter((mp) => mp.magazineTitle && mp.items.length > 0)
    .map((mp) => {
      const { displayName } = enrichArtistName(mp.artistName || mp.groupName);
      return {
        id: `mag-${mp.id}`,
        imageUrl: proxyImg(mp.imageUrl ?? ""),
        title: mp.magazineTitle,
        subtitle: mp.context || "",
        artistName: displayName || "Unknown",
        category: "Editorial",
        link: `/posts/${mp.id}?from=explore`,
        items: mp.items,
      };
    });

  // Deduplicate by artist — pick at most 2 cards per artist for variety
  const seenArtists = new Map<string, number>();
  const diverseCards: typeof allMagazineCards = [];
  for (const c of allMagazineCards) {
    const key = c.artistName.toLowerCase();
    const count = seenArtists.get(key) ?? 0;
    if (count < 2) {
      diverseCards.push(c);
      seenArtists.set(key, count + 1);
    }
    if (diverseCards.length >= 12) break;
  }

  const editorialMagazineData: EditorialMagazineData = {
    cards: diverseCards,
    featuredArtist: undefined,
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

  // Pick up to 4 diverse editorial posts (deduplicate by artist)
  const editorialPool =
    popularPosts.length > 0
      ? [...popularPosts].sort(() => Math.random() - 0.5)
      : [];
  const editorialPosts: typeof editorialPool = [];
  const seenEditorialArtists = new Set<string>();
  for (const p of editorialPool) {
    const key = (p.artist_name || p.group_name || "").toLowerCase();
    if (!seenEditorialArtists.has(key)) {
      editorialPosts.push(p);
      seenEditorialArtists.add(key);
    }
    if (editorialPosts.length >= 10) break;
  }

  // Fetch spots+solutions for all 4 posts in parallel
  const editorialItems: StyleCardData[] = await Promise.all(
    editorialPosts.map(async (post) => {
      const { displayName } = enrichArtistName(post.artist_name);
      let items: StyleCardData["items"] = [];
      try {
        const supabase = await createSupabaseServerClient();
        const { data: spots } = await supabase
          .from("spots")
          .select("*, solutions(*)")
          .eq("post_id", post.id);
        if (spots) {
          items = spots
            .flatMap((spot: any) =>
              (spot.solutions || [])
                .filter((sol: any) => sol.thumbnail_url)
                .map((sol: any) => ({
                  id: sol.id,
                  label: sol.title,
                  name: sol.title,
                  brand: (sol.metadata as any)?.brand || "",
                  imageUrl: proxyImg(sol.thumbnail_url),
                }))
            )
            .slice(0, 3);
        }
      } catch {
        /* ignore */
      }
      return {
        id: post.id,
        title: displayName || "Featured",
        description: post.context || "",
        artistName: displayName || "Unknown",
        imageUrl: proxyImg(post.image_url),
        link: `/posts/${post.id}`,
        items,
      };
    })
  );

  // --- MasonryGrid ---

  const gridItems: GridItemData[] = popularPosts.slice(0, 16).map((post, i) => {
    const { displayName } = enrichArtistName(
      post.artist_name || post.group_name
    );
    return {
      id: post.id,
      imageUrl: post.image_url,
      title: displayName || "Unknown",
      subtitle: post.context || post.title || undefined,
      category: post.context || "other",
      link: `/posts/${post.id}`,
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

      <EditorialCarousel items={editorialItems} />

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
        <StyleMoods items={gridItems} />
      </section>

      {editorPicks.length > 0 && <EditorPicks items={editorPicks} />}

      <TrendingListSection keywords={trendingKeywords} />

      {domeImages.length > 0 && <DomeGallerySection images={domeImages} />}
    </div>
  );
}
