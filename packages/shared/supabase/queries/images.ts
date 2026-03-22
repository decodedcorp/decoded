/**
 * Query layer for images table (shared across web and mobile)
 *
 * This module establishes the pattern: "Supabase direct access only happens in this layer"
 * When RLS policies change, only these query functions need to be updated.
 */

import { getSupabaseClient } from "../client";
import type { Database } from "../types";
import { fetchItemsByImageId } from "./items";

// Re-export orphan query and unified adapter
export { fetchOrphanImages } from "./images-orphan";
export { fetchUnifiedImages } from "./images-adapter";

export type ItemRow = Database["public"]["Tables"]["item"]["Row"];
type PostRow = Database["public"]["Tables"]["post"]["Row"];
export type ImageRow = Database["public"]["Tables"]["image"]["Row"];

export type PostImageRow = {
  post: PostRow;
  created_at: string;
  item_locations: any | null;
  item_locations_updated_at: string | null;
};

/**
 * ImageDetail uses Partial<ItemRow> for items to allow web-side ItemRow
 * (which may omit newer PRD-only fields like brand_account_id).
 */
export type ImageDetail = ImageRow & {
  items: Array<Omit<ItemRow, "brand_account_id" | "original_url" | "thumbnail_url"> & {
    brand_account_id?: string | null;
    original_url?: string | null;
    thumbnail_url?: string | null;
  }>;
  posts: PostRow[];
  postImages: PostImageRow[];
};

export type CategoryFilter = "all" | "fashion" | "beauty" | "lifestyle" | "accessories" | "newjeanscloset" | "blackpinkk.style";

export type PostSource = "post" | "legacy";

export type ImagePage = {
  items: ImageRow[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ImageWithPostId = ImageRow & {
  postId: string;
  postSource: PostSource;
  postAccount: string;
  postImageCreatedAt: string;
  postCreatedAt: string;
};

export type ImagePageWithPostId = {
  items: ImageWithPostId[];
  nextCursor: string | null;
  hasMore: boolean;
  stats?: {
    fromPostImage: number;
    fromOrphans: number;
  };
};

export type FetchFilteredImagesParams = {
  limit?: number;
  cursor?: string | null;
  filter?: CategoryFilter;
  search?: string;
};

// Helper to encode composite cursor
export function encodeCursor(createdAt: string, id: string): string {
  return btoa(JSON.stringify({ createdAt, id }));
}

// Helper to decode composite cursor
export function decodeCursor(
  cursor: string
): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor));
  } catch {
    return null;
  }
}

/**
 * Fetches the latest images from the database
 */
export async function fetchLatestImages(limit = 20): Promise<ImageRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("image")
    .select("*")
    .not("image_url", "is", null)
    .eq("with_items", false)
    .gte("created_at", "2024-01-01")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Fetches a single image by ID with items and posts
 */
export async function fetchImageById(id: string): Promise<ImageDetail | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("image")
    .select(
      `
      *,
      items:item(*),
      post_images:post_image(
        created_at,
        item_locations,
        item_locations_updated_at,
        post(*)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  const posts = data.post_images
    ? (data.post_images as any[]).map((pi) => pi.post).filter(Boolean)
    : [];

  const postImages = data.post_images
    ? (data.post_images as any[])
        .map((pi) => ({
          post: pi.post,
          created_at: pi.created_at,
          item_locations: pi.item_locations || null,
          item_locations_updated_at: pi.item_locations_updated_at || null,
        }))
        .filter((pi) => pi.post !== null)
    : [];

  let items: ItemRow[] = [];
  let itemsFetchedViaPost = false;

  if (postImages.length > 0) {
    const firstPost = postImages[0].post;
    if (firstPost && firstPost.item_ids) {
      try {
        const itemIds = Array.isArray(firstPost.item_ids)
          ? (firstPost.item_ids as string[])
          : [];

        if (itemIds.length > 0) {
          const itemIdsAsNumbers = itemIds.map((id) => parseInt(id, 10));

          const { data: itemsData, error: itemsError } = await supabase
            .from("item")
            .select("*")
            .in("id", itemIdsAsNumbers);

          if (!itemsError && itemsData) {
            items = itemsData as ItemRow[];
            itemsFetchedViaPost = true;
          }
        }
      } catch {
        // Fallback to traditional approach
      }
    }
  }

  if (!itemsFetchedViaPost) {
    items = (
      Array.isArray(data.items) ? data.items : data.items ? [data.items] : []
    ) as ItemRow[];

    if (items.length === 0) {
      try {
        const fetchedItems = await fetchItemsByImageId(id);
        items = fetchedItems;
      } catch {
        // Items will be empty array
      }
    }
  }

  return {
    id: data.id,
    created_at: data.created_at,
    image_hash: data.image_hash,
    image_url: data.image_url,
    status: data.status,
    with_items: data.with_items,
    items: items as ItemRow[],
    posts: posts,
    postImages: postImages as PostImageRow[],
  };
}

/**
 * Fetches filtered images based on category filter and search query with cursor-based pagination
 */
export async function fetchFilteredImages(
  params: FetchFilteredImagesParams
): Promise<ImagePage> {
  const supabase = getSupabaseClient();
  const { limit = 50, cursor, filter = "all", search = "" } = params;
  const hasAccountFilter = filter !== "all";
  const hasSearchQuery = search.trim().length > 0;

  let data: any[] | null = null;
  let error: any = null;

  if (hasAccountFilter) {
    let queryBuilder = supabase
      .from("post_image")
      .select(
        hasSearchQuery
          ? "created_at, image!inner(id, image_url, status, with_items, image_hash, created_at, item!inner(product_name, brand)), post!inner(id, account_id, instagram_account!inner(username))"
          : "created_at, image!inner(id, image_url, status, with_items, image_hash, created_at), post!inner(id, account_id, instagram_account!inner(username))"
      )
      .eq("post.instagram_account.username", filter);

    queryBuilder = queryBuilder
      .not("image.image_url", "is", null)
      .eq("image.with_items", false);

    if (hasSearchQuery) {
      const searchTerm = search.trim();
      queryBuilder = queryBuilder.or(
        `product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`,
        { foreignTable: "image.item" }
      );
    }

    queryBuilder = queryBuilder
      .order("created_at", { ascending: false })
      .order("image_id", { ascending: false })
      .limit(limit * 5);

    const result = await queryBuilder;
    data = result.data;
    error = result.error;
  } else {
    const selectColumns =
      "id, image_url, created_at, status, with_items, image_hash";

    let queryBuilder = supabase
      .from("image")
      .select(
        hasSearchQuery
          ? `${selectColumns}, item!inner(product_name, brand)`
          : selectColumns
      )
      .not("image_url", "is", null)
      .eq("with_items", false)
      .gte("created_at", "2024-01-01");

    if (hasSearchQuery) {
      const searchTerm = search.trim();
      queryBuilder = queryBuilder.or(
        `product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`,
        { foreignTable: "item" }
      );
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        const { createdAt, id } = decoded;
        queryBuilder = queryBuilder.or(
          `and(created_at.eq.${createdAt},id.lt.${id}),created_at.lt.${createdAt}`
        );
      }
    }

    queryBuilder = queryBuilder
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    const result = await queryBuilder;
    data = result.data;
    error = result.error;
  }

  if (error) {
    throw error;
  }

  const uniqueImages = new Map<string, ImageRow>();
  if (data) {
    if (hasAccountFilter) {
      const postIds = new Set<string>();

      for (const row of data) {
        if (!row.image) continue;
        const postRow = Array.isArray(row.post) ? row.post[0] : row.post;
        if (postRow?.id) {
          postIds.add(postRow.id);
        }
      }

      const postTsMap = new Map<string, string>();
      if (postIds.size > 0) {
        const { data: postsData, error: postsError } = await supabase
          .from("post")
          .select("id, ts")
          .in("id", Array.from(postIds));

        if (!postsError && postsData) {
          for (const post of postsData) {
            const tsValue = post.ts
              ? typeof post.ts === "string"
                ? post.ts
                : String(post.ts)
              : null;
            if (tsValue) {
              postTsMap.set(post.id, tsValue);
            }
          }
        }
      }

      let cursorPostTs: string | null = null;
      let cursorImageId: string | null = null;
      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (decoded) {
          cursorPostTs = decoded.createdAt;
          cursorImageId = decoded.id;
        }
      }

      for (const row of data) {
        if (!row.image) continue;
        const imageRow = Array.isArray(row.image) ? row.image[0] : row.image;
        const postRow = Array.isArray(row.post) ? row.post[0] : row.post;

        if (!postRow?.id) continue;

        const postTs = postTsMap.get(postRow.id) || row.created_at;

        if (!postTs || postTs < "2024-01-01") continue;

        if (cursorPostTs) {
          if (postTs > cursorPostTs) continue;
          if (postTs === cursorPostTs && imageRow.id >= cursorImageId!)
            continue;
        }

        if (imageRow && imageRow.id && !uniqueImages.has(imageRow.id)) {
          const image: ImageRow = {
            id: imageRow.id,
            image_hash: imageRow.image_hash,
            image_url: imageRow.image_url,
            with_items: imageRow.with_items,
            status: imageRow.status,
            created_at: postTs,
          };
          uniqueImages.set(imageRow.id, image);
        }
      }
    } else {
      for (const row of data) {
        const imageRow = row;
        const sortTime = row.created_at;

        if (!sortTime || sortTime < "2024-01-01") continue;

        if (imageRow && imageRow.id && !uniqueImages.has(imageRow.id)) {
          const image: ImageRow = {
            id: imageRow.id,
            image_hash: imageRow.image_hash,
            image_url: imageRow.image_url,
            with_items: imageRow.with_items,
            status: imageRow.status,
            created_at: sortTime,
          };
          uniqueImages.set(imageRow.id, image);
        }
      }
    }
  }

  const allItems = Array.from(uniqueImages.values()).sort((a, b) => {
    let timeA: number;
    let timeB: number;
    try {
      timeA = new Date(a.created_at).getTime();
      timeB = new Date(b.created_at).getTime();
    } catch {
      return 0;
    }
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });

  const hasMore = allItems.length > limit;
  const items = hasMore ? allItems.slice(0, limit) : allItems;

  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
  }

  return { items, nextCursor, hasMore };
}

/**
 * Fetches images via post_image table with post_id information
 *
 * Uses post.ts for sorting and filtering to ensure proper cursor-based pagination.
 * Applies 2024-01-01 filter at DB level via post.ts comparison.
 */
export async function fetchImagesByPostImage(
  params: FetchFilteredImagesParams
): Promise<ImagePageWithPostId> {
  const supabase = getSupabaseClient();
  const { limit = 50, cursor, filter = "all", search = "" } = params;

  const hasAccountFilter = filter !== "all";
  const hasSearchQuery = search.trim().length > 0;

  // Decode cursor for DB-level filtering
  let cursorTs: string | null = null;
  let cursorImageId: string | null = null;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      cursorTs = decoded.createdAt;
      cursorImageId = decoded.id;
    }
  }

  // Build query with post.ts included for filtering
  let queryBuilder = supabase
    .from("post_image")
    .select(
      hasSearchQuery
        ? "created_at, post_id, image!inner(id, image_url, status, with_items, image_hash, created_at, item!inner(product_name, brand)), post!inner(account_id, id, created_at, ts, instagram_account(username))"
        : "created_at, post_id, image!inner(id, image_url, status, with_items, image_hash, created_at), post!inner(account_id, id, created_at, ts, instagram_account(username))"
    );

  if (hasAccountFilter) {
    queryBuilder = queryBuilder.eq("post.instagram_account.username", filter);
  }

  queryBuilder = queryBuilder
    .not("image.image_url", "is", null)
    .eq("image.with_items", false);

  // Apply 2024-01-01 filter at DB level
  queryBuilder = queryBuilder.gte("post.ts", "2024-01-01");

  // Apply cursor filter at DB level - only filter by post.ts
  // image_id filtering will be done client-side since it's on post_image table
  if (cursorTs) {
    queryBuilder = queryBuilder.lte("post.ts", cursorTs);
  }

  if (hasSearchQuery) {
    const searchTerm = search.trim();
    queryBuilder = queryBuilder.or(
      `product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`,
      { foreignTable: "image.item" }
    );
  }

  // Request more to account for deduplication
  // NOTE: Cannot order by post.ts at DB level (referencedTable generates invalid REST query)
  // Client-side sorting by post.ts is done below after fetching
  queryBuilder = queryBuilder
    .order("image_id", { ascending: false })
    .limit((limit + 1) * 3);

  // Debug: Log the query for troubleshooting
  console.log("[fetchImagesByPostImage] Executing query...", {
    filter,
    search,
    cursor,
    limit,
  });

  const { data, error, status, statusText } = await queryBuilder;

  console.log("[fetchImagesByPostImage] Response status:", status, statusText);

  if (error) {
    console.error("[fetchImagesByPostImage] Error type:", typeof error);
    console.error("[fetchImagesByPostImage] Error constructor:", error?.constructor?.name);
    console.error("[fetchImagesByPostImage] Error keys:", Object.keys(error));
    console.error("[fetchImagesByPostImage] Error entries:", Object.entries(error));
    console.error("[fetchImagesByPostImage] Error message:", (error as { message?: string }).message);
    console.error("[fetchImagesByPostImage] Error code:", (error as { code?: string }).code);
    console.error("[fetchImagesByPostImage] Full error:", error);
    console.error("[fetchImagesByPostImage] HTTP status:", status, statusText);
    throw error;
  }

  console.log("[fetchImagesByPostImage] Success! Data count:", data?.length ?? 0);

  const uniqueImages = new Map<string, ImageWithPostId>();

  if (data) {
    for (const row of data) {
      if (!row.image) continue;
      const imageRow = Array.isArray(row.image) ? row.image[0] : row.image;
      const postRow = Array.isArray(row.post) ? row.post[0] : row.post;

      if (!postRow?.id || !postRow?.ts) continue;

      const postTs = postRow.ts;

      // Client-side cursor filtering for exact position
      // DB already filtered by post.ts <= cursorTs, now filter by exact cursor position
      if (cursorTs && cursorImageId) {
        if (postTs === cursorTs && imageRow.id >= cursorImageId) continue;
      }

      if (
        imageRow &&
        imageRow.id &&
        postRow &&
        !uniqueImages.has(imageRow.id)
      ) {
        // Extract username from nested instagram_account join
        const igAccount = postRow.instagram_account;
        const username = Array.isArray(igAccount)
          ? igAccount[0]?.username
          : igAccount?.username;

        const image: ImageWithPostId = {
          id: imageRow.id,
          image_hash: imageRow.image_hash,
          image_url: imageRow.image_url,
          with_items: imageRow.with_items,
          status: imageRow.status,
          created_at: postTs,
          postId: row.post_id,
          postSource: "post" as const,
          postAccount: username ?? "",
          postImageCreatedAt: postTs,
          postCreatedAt: postRow.created_at,
        };
        uniqueImages.set(imageRow.id, image);
      }
    }
  }

  const allItems = Array.from(uniqueImages.values()).sort((a, b) => {
    // Sort by post.ts (string comparison works for YYYY-MM-DD format)
    if (b.created_at !== a.created_at) {
      return b.created_at.localeCompare(a.created_at);
    }
    return b.id.localeCompare(a.id);
  });

  // hasMore is true if we have more items than the requested limit
  const hasMore = allItems.length > limit;
  // Always slice to ensure we return exactly `limit` items (or fewer if not enough data)
  const items = allItems.slice(0, limit);

  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
  }

  return { items, nextCursor, hasMore };
}

/**
 * Fetches related images from the same account
 */
export async function fetchRelatedImagesByAccount(
  currentImageId: string,
  account: string,
  limit: number = 6
): Promise<ImageRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("post_image")
    .select(
      "created_at, image!inner(id, image_url, status, with_items, image_hash, created_at), post!inner(id, account_id, instagram_account!inner(username))"
    )
    .eq("post.instagram_account.username", account)
    .not("image.id", "eq", currentImageId)
    .not("image.image_url", "is", null)
    .eq("image.with_items", false)
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    throw error;
  }

  const uniqueImages = new Map<string, ImageRow>();
  if (data) {
    const postIds = new Set<string>();
    for (const row of data) {
      if (!row.image) continue;
      const postRow = Array.isArray(row.post) ? row.post[0] : row.post;
      if (postRow?.id) {
        postIds.add(postRow.id);
      }
    }

    const postTsMap = new Map<string, string>();
    if (postIds.size > 0) {
      const { data: postsData, error: postsError } = await supabase
        .from("post")
        .select("id, ts")
        .in("id", Array.from(postIds));

      if (!postsError && postsData) {
        for (const post of postsData) {
          const tsValue = post.ts
            ? typeof post.ts === "string"
              ? post.ts
              : String(post.ts)
            : null;
          if (tsValue) {
            postTsMap.set(post.id, tsValue);
          }
        }
      }
    }

    for (const row of data) {
      if (!row.image) continue;
      const imageRow = Array.isArray(row.image) ? row.image[0] : row.image;
      const postRow = Array.isArray(row.post) ? row.post[0] : row.post;

      if (!postRow?.id) continue;

      const postTs = postTsMap.get(postRow.id) || row.created_at;

      if (!postTs || postTs < "2024-01-01") continue;

      if (imageRow && imageRow.id && !uniqueImages.has(imageRow.id)) {
        const image: ImageRow = {
          id: imageRow.id,
          image_hash: imageRow.image_hash,
          image_url: imageRow.image_url,
          with_items: imageRow.with_items,
          status: imageRow.status,
          created_at: postTs,
        };
        uniqueImages.set(imageRow.id, image);

        if (uniqueImages.size >= limit) break;
      }
    }
  }

  const sortedImages = Array.from(uniqueImages.values()).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });

  return sortedImages.slice(0, limit);
}
