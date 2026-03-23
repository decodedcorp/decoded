/**
 * Data mappers for transforming DB types to main page UI types
 *
 * Updated to use new schema with 'posts' table
 */

import type { Post } from "@/lib/api/mutation-types";
import type { HeroSlide } from "@/lib/data/heroSlides";
import type {
  PostData,
  StyleCardServerData,
  TrendingKeyword,
  ImageWithPost,
  WhatsNewStyleData,
  StyleItemData,
} from "../supabase/queries/main-page.server";
import type { ItemCardData } from "../components/main/ItemCard";
import type { HeroData } from "../components/main/HeroSection";
import type { StyleCardData } from "../components/main/StyleCard";

// Re-export TrendingKeyword type for use in page.tsx
export type { TrendingKeyword };

// =============================================================================
// API Post (GET /api/v1/posts) → UI types (decoded-api only)
// =============================================================================

export function apiPostToHeroData(post: Post): HeroData {
  return {
    artistName: post.artist_name || post.group_name || "Featured",
    title: post.context || "오늘의 스타일을 확인해보세요",
    subtitle: "",
    imageUrl: post.image_url ?? undefined,
    link: `/posts/${post.id}`,
  };
}

export function apiPostToHeroSlide(post: Post): HeroSlide {
  return {
    id: post.id,
    imageUrl: post.image_url,
    title: post.artist_name || post.group_name || "Featured",
    subtitle: post.title ?? undefined,
    link: `/posts/${post.id}`,
  };
}

export function apiPostToWeeklyBestStyle(post: Post): WeeklyBestStyle {
  return {
    id: post.id,
    artistName: post.artist_name || post.group_name || "Unknown",
    imageUrl: post.image_url ?? undefined,
    link: `/posts/${post.id}`,
  };
}

export function apiPostToStyleCardData(post: Post): StyleCardData {
  const artistName = post.artist_name || post.group_name || "Unknown";
  return {
    id: post.id,
    title: `${artistName}의 스타일`,
    description: post.context
      ? `${artistName} - ${post.context}`
      : `${artistName}의 새로운 스타일을 확인해보세요.`,
    artistName,
    imageUrl: post.image_url ?? undefined,
    link: `/posts/${post.id}`,
    spotCount: post.spot_count ?? 0,
    items: [],
    spots: [],
  };
}

/** Artist Spotlight 섹션용 subtitle: 스타일 목록에서 아티스트 이름을 모아 문구 생성 */
export function formatArtistSpotlightSubtitle(
  styles: StyleCardData[],
  maxNames = 3
): string {
  const names = [
    ...new Set(
      styles
        .map((s) => s.artistName?.trim())
        .filter((n): n is string => !!n && n !== "Unknown")
    ),
  ];
  if (names.length === 0) return "다양한 아티스트의 스타일을 만나보세요.";
  if (names.length === 1) return `${names[0]}의 스타일을 만나보세요.`;
  const show = names.slice(0, maxNames);
  const rest = names.length - show.length;
  if (rest <= 0) return `${show.join(", ")}의 스타일을 만나보세요.`;
  return `${show.join(", ")} 외 ${rest}명의 스타일을 만나보세요.`;
}

/**
 * Weekly Best section style type
 */
export interface WeeklyBestStyle {
  id: string;
  artistName: string;
  imageUrl?: string;
  link: string;
}

/**
 * Transforms PostData to WeeklyBestStyle for UI display
 */
export function postToWeeklyBestStyle(post: PostData): WeeklyBestStyle {
  return {
    id: post.id,
    artistName: post.artistName || post.groupName || "Unknown",
    imageUrl: post.imageUrl ?? undefined,
    link: `/posts/${post.id}`,
  };
}

/**
 * Transforms PostData to ItemCardData for UI display
 * Note: In new schema, posts don't have item details, so we adapt
 */
export function postToItemCardData(post: PostData): ItemCardData {
  return {
    id: post.id,
    brand: post.context || "Style",
    name: post.mediaTitle || `${post.artistName || "Unknown"}'s Style`,
    imageUrl: post.imageUrl ?? undefined,
    link: `/posts/${post.id}`,
    relatedStyles: undefined,
    badge: undefined,
  };
}

/**
 * Transforms PostData to HeroData for UI display
 */
export function postToHeroData(post: PostData): HeroData {
  return {
    artistName: post.artistName || post.groupName || "Featured",
    title: post.mediaTitle || "오늘의 스타일을 확인해보세요",
    subtitle: post.context || "",
    imageUrl: post.imageUrl ?? undefined,
    link: `/posts/${post.id}`,
  };
}

/**
 * Transforms StyleCardServerData to StyleCardData for UI display
 */
export function styleCardServerToStyleCardData(
  data: StyleCardServerData
): StyleCardData {
  const artistName = data.post.artistName || data.post.groupName || "Unknown";

  // Generate description
  const description = data.post.mediaTitle
    ? `${artistName} - ${data.post.mediaTitle}`
    : `${artistName}의 새로운 스타일을 확인해보세요.`;

  return {
    id: data.post.id,
    title: `${artistName}의 스타일`,
    description,
    artistName,
    imageUrl: data.post.imageUrl ?? undefined,
    link: `/posts/${data.post.id}`,
    items: data.items.map((item) => ({
      id: String(item.id),
      label: item.label,
      brand: item.brand,
      name: item.name,
      imageUrl: item.imageUrl,
    })),
    spots: data.spots?.map((spot) => ({
      id: spot.id,
      x: parseFloat(spot.position_left),
      y: parseFloat(spot.position_top),
      label: spot.solutions?.[0]?.title || undefined,
    })),
  };
}

// =============================================================================
// Legacy function aliases for backward compatibility
// These map old function names to new implementations
// =============================================================================

/** @deprecated Use postToWeeklyBestStyle instead */
export function imageWithPostToWeeklyBestStyle(
  data: ImageWithPost
): WeeklyBestStyle {
  return {
    id: data.image.id,
    artistName: data.account ?? "Unknown",
    imageUrl: data.image.image_url ?? undefined,
    link: `/posts/${data.image.id}`,
  };
}

/** @deprecated Use postToHeroData instead */
export function imageWithPostToHeroData(data: ImageWithPost): HeroData {
  return {
    artistName: data.account ?? "Featured",
    title: "오늘의 스타일을 확인해보세요",
    subtitle: "",
    imageUrl: data.image.image_url ?? undefined,
    link: `/posts/${data.image.id}`,
  };
}

/** @deprecated Use styleCardServerToStyleCardData instead */
export function whatsNewStyleToStyleCardData(
  data: WhatsNewStyleData
): StyleCardData {
  const artistName = data.account ?? "Unknown";
  const itemNames = data.items
    .map((item: StyleItemData) => item.name)
    .slice(0, 2);

  const description =
    data.items.length > 0
      ? `${artistName}의 스타일에서 ${itemNames.join(", ")}을 확인해보세요.`
      : `${artistName}의 새로운 스타일을 확인해보세요.`;

  return {
    id: data.image.id,
    title: `${artistName}의 스타일`,
    description,
    artistName,
    imageUrl: data.image.image_url ?? undefined,
    link: `/posts/${data.image.id}`,
    items: data.items.map((item: StyleItemData) => ({
      id: String(item.id),
      label: item.label,
      brand: item.brand,
      name: item.name,
      imageUrl: item.imageUrl,
    })),
    spots: data.spots?.map((spot) => ({
      id: spot.id,
      x: parseFloat(spot.position_left),
      y: parseFloat(spot.position_top),
      label: spot.solutions?.[0]?.title || undefined,
    })),
  };
}

/** @deprecated Items not available in new schema */
export function itemWithImageToItemCardData(data: {
  item: {
    id: string | number;
    brand: string | null;
    product_name: string | null;
  };
  imageUrl: string | null;
}): ItemCardData {
  return {
    id: String(data.item.id),
    brand: data.item.brand ?? "Unknown Brand",
    name: data.item.product_name ?? "Unknown Item",
    imageUrl: data.imageUrl ?? undefined,
    link: `/items/${data.item.id}`,
    relatedStyles: undefined,
    badge: undefined,
  };
}

/** @deprecated Items not available in new schema */
export function whatsNewItemToItemCardData(
  data: {
    item: {
      id: string | number;
      brand: string | null;
      product_name: string | null;
    };
    imageUrl: string | null;
  },
  isNew = true
): ItemCardData {
  return {
    id: String(data.item.id),
    brand: data.item.brand ?? "Unknown Brand",
    name: data.item.product_name ?? "Unknown Item",
    imageUrl: data.imageUrl ?? undefined,
    link: `/items/${data.item.id}`,
    badge: isNew ? "NEW" : undefined,
    relatedStyles: undefined,
  };
}
