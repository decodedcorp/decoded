/**
 * Search Proxy API Route
 * GET /api/v1/search - Unified search (Supabase text search fallback)
 *
 * Proxies to backend Meilisearch API. Falls back to Supabase ilike search
 * when backend is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Try backend first
  try {
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/search?${queryString}`
      : `${API_BASE_URL}/api/v1/search`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: `Backend error: ${response.status}` };
      }
      // If backend returns empty results for a non-empty query, fall through
      // to Supabase which has synonym expansion (한글→영문 매핑)
      const q = searchParams.get("q")?.trim();
      const hasResults = Array.isArray(data?.data) && data.data.length > 0;
      if (hasResults || !q) {
        return NextResponse.json(data, { status: response.status });
      }
      console.warn(`[Search GET] Backend returned empty for "${q}", trying Supabase synonyms`);
    } else {
      console.warn(`[Search GET] Backend returned ${response.status}, falling back to Supabase`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Search proxy error, falling back to Supabase:", error);
    }
  }

  // Supabase fallback: ilike text search on posts
  return supabaseSearchFallback(searchParams);
}

/**
 * Supabase fallback for GET /api/v1/search
 * Returns SearchResponse-compatible shape using ilike text matching
 */
async function supabaseSearchFallback(searchParams: URLSearchParams) {
  try {
    const supabase = await createSupabaseServerClient();

    const q = searchParams.get("q") || "";
    const context = searchParams.get("context");
    const mediaType = searchParams.get("media_type");
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 100);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const startTime = Date.now();

    let query = supabase
      .from("posts")
      .select("*, post_magazines!inner(status)", { count: "exact" })
      .eq("status", "active")
      .not("image_url", "is", null)
      .eq("created_with_solutions", true)
      .eq("post_magazines.status", "published");

    // Text search: match against artist_name, group_name, or context
    // Expand query using synonyms table for cross-language matching (e.g. 제니 → Jennie)
    // Sanitize to prevent PostgREST filter injection via special chars
    if (q.trim()) {
      const sanitized = q.replace(/[%.,()"'\\]/g, "");
      if (sanitized) {
        // Look up synonym expansions
        const searchTerms = [sanitized];
        try {
          const { data: synonymRows } = await supabase
            .from("synonyms")
            .select("canonical, synonyms")
            .eq("is_active", true)
            .or(
              `canonical.ilike.%${sanitized}%,synonyms.cs.{${sanitized}}`
            );
          if (synonymRows?.length) {
            for (const row of synonymRows) {
              if (row.canonical && !searchTerms.includes(row.canonical)) {
                searchTerms.push(row.canonical);
              }
              for (const syn of row.synonyms ?? []) {
                if (!searchTerms.includes(syn)) searchTerms.push(syn);
              }
            }
          }
        } catch {
          // Synonym lookup failed — continue with original term only
        }

        const orClauses = searchTerms
          .map(
            (t) =>
              `artist_name.ilike.%${t}%,group_name.ilike.%${t}%,context.ilike.%${t}%`
          )
          .join(",");
        query = query.or(orClauses);
      }
    }

    if (context) {
      query = query.eq("context", context);
    }
    if (mediaType) {
      query = query.ilike("group_name", `%${mediaType}%`);
    }

    query = query.order("view_count", { ascending: false }).range(from, to);

    const { data: posts, count, error } = await query;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);
    const tookMs = Date.now() - startTime;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (posts ?? []).map((post: any) => ({
      id: post.id,
      image_url: post.image_url,
      artist_name: post.artist_name ?? null,
      group_name: post.group_name ?? null,
      context: post.context ?? null,
      spot_count: 0,
      view_count: post.view_count ?? 0,
      type: "post",
      media_source: post.media_type
        ? { type: post.media_type, title: post.title ?? null }
        : null,
      highlight: null,
    }));

    return NextResponse.json({
      data,
      query: q,
      took_ms: tookMs,
      facets: { category: null, context: null, media_type: null },
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Search fallback error" },
      { status: 500 }
    );
  }
}
