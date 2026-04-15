/**
 * Server-side prefetch for post detail.
 *
 * Fetches PostDetailResponse from Rust backend during RSC render and transforms
 * it to ImageDetail so the client component can render immediately without a
 * separate client-side fetch waterfall.
 */

import { cache } from "react";
import { API_BASE_URL } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ImageDetail } from "@/lib/supabase/queries/images";

/**
 * Prefetch post detail from Rust API on the server.
 * Passes auth token when available so user_has_liked / user_has_saved are correct.
 * Returns the raw JSON or null on failure (non-blocking — client will retry).
 */
export const prefetchPostDetail = cache(
  async (postId: string): Promise<ImageDetail | null> => {
    if (!API_BASE_URL) return null;

    try {
      // Try to get the current user's session token server-side
      const supabase = await createSupabaseServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `${API_BASE_URL}/api/v1/posts/${postId}`;
      const res = await fetch(url, {
        method: "GET",
        headers,
        // No cache when authenticated — user-specific data must not be shared
        cache: token ? "no-store" : "default",
        ...(token ? {} : { next: { revalidate: 30 } }),
      });

      if (!res.ok) return null;

      const post = await res.json();

      const { postDetailToImageDetail } =
        await import("@/lib/api/adapters/postDetailToImageDetail");
      return postDetailToImageDetail(post, postId);
    } catch {
      return null;
    }
  }
);
