/**
 * Adapter: PostDetailResponse (백엔드 API) → ImageDetail (기존 UI 호환)
 *
 * ImageDetailModal/ImageDetailContent가 기대하는 ImageDetail 구조로 변환
 */

import type {
  PostDetailResponse,
  SpotWithTopSolution,
} from "@/lib/api/generated/models";
import type { ImageDetail } from "@/lib/supabase/queries/images";
import type { ItemRow } from "@/lib/components/detail/types";

/** Extended ImageDetail with post owner and created_with_solutions for adopt UI */
export type ImageDetailWithPostOwner = ImageDetail & {
  post_owner_id?: string | null;
  /** 포스트 생성 시 솔루션을 알고 등록했는지 */
  created_with_solutions?: boolean | null;
  /** 연결된 Post Magazine ID */
  post_magazine_id?: string | null;
  /** AI가 생성한 포스트 요약 */
  ai_summary?: string | null;
  /** 아티스트/그룹명 (태그용) */
  artist_name?: string | null;
  group_name?: string | null;
  /** 좋아요 개수 */
  like_count?: number;
  /** 현재 사용자가 좋아요 했는지 */
  user_has_liked?: boolean | null;
  /** 현재 사용자가 저장했는지 */
  user_has_saved?: boolean | null;
  /** 아티스트 프로필 이미지 URL (백엔드에서 warehouse 조회) */
  artist_profile_image_url?: string | null;
  /** 그룹 프로필 이미지 URL (백엔드에서 warehouse 조회) */
  group_profile_image_url?: string | null;
  /** 백엔드에서 제공하는 댓글 수 (별도 fetch 불필요) */
  comment_count?: number;
  /** 저장 횟수 */
  save_count?: number;
};

function parsePosition(val: string): number {
  const num = parseFloat(val.replace("%", ""));
  return num > 1 ? num / 100 : num;
}

/**
 * PostDetailResponse를 ImageDetail 형식으로 변환
 */
export function postDetailToImageDetail(
  post: PostDetailResponse,
  imageId: string
): ImageDetailWithPostOwner {
  const items: ItemRow[] = post.spots.map(
    (spot: SpotWithTopSolution, idx: number) => {
      const top = spot.top_solution;
      const citationUrl = top?.affiliate_url ?? top?.original_url ?? null;
      const citations = citationUrl ? [citationUrl] : null;
      return {
        id: idx + 1,
        image_id: post.id,
        spot_id: spot.id,
        spot_index: idx + 1,
        brand: (() => {
          const m = top?.metadata as { brand?: string } | undefined;
          return m?.brand ?? null;
        })(),
        brand_logo_url: top?.brand_logo_url ?? null,
        product_name: top?.title ?? null,
        cropped_image_path: top?.thumbnail_url ?? null,
        price: (() => {
          const m = top?.metadata as
            | { price?: string | { amount?: string } }
            | undefined;
          if (!m?.price) return null;
          return typeof m.price === "string"
            ? m.price
            : (m.price?.amount ?? null);
        })(),
        description: null,
        status: spot.status ?? null,
        created_at: spot.created_at ?? null,
        bboxes: null,
        center: [
          parsePosition(spot.position_left),
          parsePosition(spot.position_top),
        ] as [number, number],
        scores: null,
        ambiguity: null,
        citations,
        metadata: (top?.metadata as unknown as ItemRow["metadata"]) ?? null,
        sam_prompt: null,
      };
    }
  );

  return {
    id: imageId,
    image_hash: "",
    image_url: post.image_url,
    post_owner_id: post.user?.id ?? null,
    like_count: post.like_count ?? 0,
    user_has_liked: post.user_has_liked ?? false,
    user_has_saved: post.user_has_saved ?? false,
    created_with_solutions: post.created_with_solutions ?? null,
    post_magazine_id: post.post_magazine_id ?? null,
    ai_summary: post.ai_summary ?? null,
    artist_name: post.artist_name ?? null,
    group_name: post.group_name ?? null,
    artist_profile_image_url: post.artist_profile_image_url ?? null,
    group_profile_image_url: post.group_profile_image_url ?? null,
    comment_count: post.comment_count ?? 0,
    save_count: post.save_count ?? 0,
    status: post.status as
      | "pending"
      | "extracted"
      | "skipped"
      | "extracted_metadata",
    with_items: items.length > 0,
    created_at: post.created_at,
    items,
    posts: [
      {
        id: post.id,
        account: post.user?.username ?? "",
        article: post.context ?? null,
        created_at: post.created_at,
        item_ids: null,
        metadata: [],
        ts: post.created_at,
      } as unknown as ImageDetail["posts"][number],
    ],
    postImages: [
      {
        post: {
          id: post.id,
          account: post.user?.username ?? "",
          article: post.context ?? null,
          created_at: post.created_at,
          item_ids: null,
          metadata: [],
          ts: post.created_at,
        } as unknown as ImageDetail["posts"][number],
        created_at: post.created_at,
        item_locations: post.spots.map((s, idx) => ({
          item_id: idx + 1,
          center: [
            parsePosition(s.position_left),
            parsePosition(s.position_top),
          ],
        })),
        item_locations_updated_at: post.updated_at,
      } as ImageDetail["postImages"][number],
    ],
  };
}
