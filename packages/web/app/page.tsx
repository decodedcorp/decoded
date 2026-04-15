/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { StyleCardData } from "@/lib/components/main";
import type { TrendingKeywordItem } from "@/lib/components/main/TrendingListSection";
import type { HeroPostEntry } from "@/lib/components/main/HeroItemSync";
import type { PaginatedResponsePostListItem } from "@/lib/api/generated/models";
import type { PaginatedResponsePostListItemDataItem } from "@/lib/api/generated/models";
import type { WarehouseProfilesResponse } from "@/lib/api/generated/models";
import type { SpotsByPostsResponse } from "@/lib/api/generated/models";
import type { EditorPicksResponse } from "@/lib/api/generated/models";
import { serverApiGet } from "@/lib/api/server-instance";

/** Shorthand for post list item from REST API */
type ApiPost = PaginatedResponsePostListItemDataItem;

interface ArtistProfileEntry {
  name: string;
  profileImageUrl: string | null;
}

const proxyImg = (url: string) =>
  `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;

/** REST API fetch — no Supabase fallback */
async function fetchPosts(params: string): Promise<ApiPost[]> {
  try {
    const res = await serverApiGet<PaginatedResponsePostListItem>(
      `/api/v1/posts?${params}`
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

/** Build artist/group name → profile lookup from Rust API warehouse/profiles */
async function fetchArtistProfileMap(): Promise<
  Map<string, ArtistProfileEntry>
> {
  const map = new Map<string, ArtistProfileEntry>();
  try {
    const res = await serverApiGet<WarehouseProfilesResponse>(
      "/api/v1/warehouse/profiles"
    );
    const addEntity = (
      name_ko: string | null | undefined,
      name_en: string | null | undefined,
      profile_image_url: string | null | undefined
    ) => {
      const displayName = name_en || name_ko || "";
      if (!displayName) return;
      const entry: ArtistProfileEntry = {
        name: displayName,
        profileImageUrl: profile_image_url ?? null,
      };
      if (name_ko) map.set(name_ko.toLowerCase(), entry);
      if (name_en) map.set(name_en.toLowerCase(), entry);
    };
    for (const a of res.artists ?? [])
      addEntity(a.name_ko, a.name_en, a.profile_image_url);
    for (const g of res.groups ?? [])
      addEntity(g.name_ko, g.name_en, g.profile_image_url);
  } catch {
    /* warehouse profiles unavailable — use raw names */
  }
  return map;
}

/** Batch-fetch spots+solutions for multiple post IDs via Rust API */
async function fetchSpotsByPosts(
  postIds: string[]
): Promise<SpotsByPostsResponse["spots_by_post"]> {
  if (postIds.length === 0) return {};
  try {
    const res = await serverApiGet<SpotsByPostsResponse>(
      `/api/v1/spots/by-posts?post_ids=${postIds.join(",")}`
    );
    return res.spots_by_post ?? {};
  } catch {
    return {};
  }
}

/** Fetch editor picks via Rust API */
async function fetchEditorPicks(): Promise<
  Array<{
    id: string;
    imageUrl: string;
    title: string;
    link: string;
    artistName: string;
  }>
> {
  try {
    const res = await serverApiGet<EditorPicksResponse>(
      "/api/v1/feed/editor-picks?limit=8"
    );
    return (res.data ?? []).map((item: any) => ({
      id: item.id,
      imageUrl: item.image_url,
      title: item.title || item.context || "",
      link: `/posts/${item.id}`,
      artistName: item.artist_name || item.group_name || "",
    }));
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  await searchParams;

  // Parallel fetch: all via Rust API
  const [
    popularPosts,
    recentPosts,
    rawMagazinePosts,
    artistProfileMap,
    editorPicks,
  ] = await Promise.all([
    fetchPosts("sort=popular&per_page=30"),
    fetchPosts("sort=recent&per_page=50"),
    fetchPosts(
      "sort=recent&per_page=50&has_magazine=true&include_magazine_items=true"
    ),
    fetchArtistProfileMap(),
    fetchEditorPicks(),
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

  // Enrich hero posts with spots/solutions via Rust API batch endpoint
  try {
    const heroPostIds = heroPosts.map((hp) => hp.id);
    const spotsByPost = await fetchSpotsByPosts(heroPostIds);

    for (const hp of heroPosts) {
      const spots = spotsByPost[hp.id] ?? [];
      hp.items = spots
        .flatMap((spot: any) =>
          (spot.solutions || [])
            .filter((sol: any) => sol.thumbnail_url)
            .map((sol: any) => ({
              id: sol.id,
              label: sol.title,
              name: sol.title,
              brand: sol.brand || "",
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
  } catch {
    /* hero spots enrichment failed — show without items */
  }

  // --- Magazine ---

  const allMagazineCards = rawMagazinePosts
    .filter(
      (mp) =>
        (mp.post_magazine_title || mp.title) &&
        mp.post_magazine_items &&
        mp.post_magazine_items.length > 0
    )
    .map((mp) => {
      const { displayName } = enrichArtistName(mp.artist_name || mp.group_name);
      return {
        id: `mag-${mp.id}`,
        imageUrl: proxyImg(mp.image_url),
        title: mp.post_magazine_title || mp.title || "Editorial",
        subtitle: mp.context || "",
        artistName: displayName || "Unknown",
        category: "Editorial",
        link: `/posts/${mp.id}?from=explore`,
        items: (mp.post_magazine_items ?? []).map((it) => ({
          title: it.title,
          brand: it.brand ?? null,
          imageUrl: it.image_url,
          originalUrl: it.original_url ?? null,
        })),
      };
    });

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

  // --- Editorial + Trending 2-column (#89) ---

  // Collect per-artist: count + warehouse profile image (preferred) + post thumbnail fallback
  const artistCounts = new Map<
    string,
    { count: number; profileImage: string | null; postImage: string }
  >();
  for (const p of [...popularPosts, ...recentPosts]) {
    const key = p.artist_name || p.group_name || "";
    if (!key) continue;
    const existing = artistCounts.get(key);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const warehouseImg =
      (p as { artist_profile_image_url?: string | null })
        .artist_profile_image_url ||
      (p as { group_profile_image_url?: string | null })
        .group_profile_image_url ||
      null;
    if (existing) {
      existing.count++;
      // First non-null warehouse image wins
      if (!existing.profileImage && warehouseImg) {
        existing.profileImage = warehouseImg;
      }
    } else {
      artistCounts.set(key, {
        count: 1,
        profileImage: warehouseImg,
        postImage: p.image_url,
      });
    }
  }

  const trendingKeywords: TrendingKeywordItem[] = [...artistCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, { profileImage, postImage }]) => {
      const enriched = enrichArtistName(name);
      // Prefer warehouse artist profile image (per-post field from Rust API),
      // then enrichArtistName's profile image (buildArtistProfileMap), then
      // fall back to the post thumbnail.
      const image = profileImage || enriched.profileImageUrl || postImage;
      return {
        id: `artist-${name}`,
        label: enriched.displayName || name,
        href: `/search?q=${encodeURIComponent(name)}`,
        image: proxyImg(image),
      };
    });

  // Pick up to 10 diverse editorial posts (deduplicate by artist)
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

  // Batch-fetch spots+solutions for editorial posts via Rust API
  const editorialSpotsByPost = await fetchSpotsByPosts(
    editorialPosts.map((p) => p.id)
  );

  const editorialItems: StyleCardData[] = editorialPosts.map((post) => {
    const { displayName } = enrichArtistName(post.artist_name);
    const spots = editorialSpotsByPost[post.id] ?? [];
    const items = spots
      .flatMap((spot: any) =>
        (spot.solutions || [])
          .filter((sol: any) => sol.thumbnail_url)
          .map((sol: any) => ({
            id: sol.id,
            label: sol.title,
            name: sol.title,
            brand: sol.brand || "",
            imageUrl: proxyImg(sol.thumbnail_url),
          }))
      )
      .slice(0, 3);
    return {
      id: post.id,
      title: displayName || "Featured",
      description: post.context || "",
      artistName: displayName || "Unknown",
      imageUrl: proxyImg(post.image_url),
      link: `/posts/${post.id}`,
      items,
    };
  });

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
      image_width: post.image_width,
      image_height: post.image_height,
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
      <div className="hidden md:block">
        <HeroItemSync posts={heroPosts} />
      </div>

      <EditorialMagazine data={editorialMagazineData} />

      <EditorialCarousel items={editorialItems} />

      {/* #91: Decoded's Pick temporarily disabled */}

      <section className="relative">
        <StyleMoods items={gridItems} />
      </section>

      {editorPicks.length > 0 && <EditorPicks items={editorPicks} />}

      <TrendingListSection keywords={trendingKeywords} />

      {domeImages.length > 0 && <DomeGallerySection images={domeImages} />}
    </div>
  );
}
