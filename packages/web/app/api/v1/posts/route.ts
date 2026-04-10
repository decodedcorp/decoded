/**
 * Posts Proxy API Route
 * GET /api/v1/posts - Fetch posts list (no auth required)
 * POST /api/v1/posts - Create a new post (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/posts
 * Fetch posts list with optional query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Forward query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/posts?${queryString}`
      : `${API_BASE_URL}/api/v1/posts`;

    // Forward the request to the backend
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Parse response - handle both JSON and non-JSON (e.g., nginx HTML errors)
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON response (e.g., nginx error page)
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }

    // Backend succeeded → return as-is
    if (response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Backend failed → fall back to Supabase
    console.warn(
      `[Posts GET] Backend returned ${response.status}, falling back to Supabase`
    );
    return supabaseFallback(searchParams);
  } catch (error) {
    // Backend unreachable → fall back to Supabase
    if (process.env.NODE_ENV === "development") {
      console.warn("Posts GET proxy error, falling back to Supabase:", error);
    }
    const { searchParams } = new URL(request.url);
    return supabaseFallback(searchParams);
  }
}

/**
 * Supabase fallback for GET /api/v1/posts
 * Returns PaginatedResponsePostListItem-compatible shape
 */
async function supabaseFallback(searchParams: URLSearchParams) {
  try {
    const supabase = await createSupabaseServerClient();

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const perPage = Math.min(Number(searchParams.get("per_page")) || 40, 100);
    const sort = searchParams.get("sort") || "recent";
    const artistName = searchParams.get("artist_name");
    const groupName = searchParams.get("group_name");
    const context = searchParams.get("context");
    const hasMagazine = searchParams.get("has_magazine") === "true";

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("posts")
      .select(
        "*, users:user_id(id, username, avatar_url, rank), post_magazines:post_magazine_id(title)",
        { count: "exact" }
      )
      .eq("status", "active")
      .not("image_url", "is", null);

    if (hasMagazine) {
      query = query.not("post_magazine_id", "is", null);
    }
    if (artistName) {
      query = query.ilike("artist_name", `%${artistName}%`);
    }
    if (groupName) {
      query = query.ilike("group_name", `%${groupName}%`);
    }
    if (context) {
      query = query.eq("context", context);
    }

    // Sort
    if (sort === "popular") {
      query = query.order("view_count", { ascending: false });
    } else if (sort === "trending") {
      query = query.order("trending_score", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(from, to);

    const { data: posts, count, error } = await query;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / perPage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (posts ?? []).map((post: any) => ({
      id: post.id,
      image_url: post.image_url,
      artist_name: post.artist_name ?? null,
      group_name: post.group_name ?? null,
      context: post.context ?? null,
      created_at: post.created_at,
      view_count: post.view_count ?? 0,
      spot_count: 0,
      comment_count: 0,
      title: post.post_magazines?.title ?? null,
      post_magazine_title: post.post_magazines?.title ?? null,
      media_source: { type: post.media_type ?? "unknown", description: null },
      user: post.users
        ? {
            id: post.users.id,
            username: post.users.username ?? "",
            avatar_url: post.users.avatar_url ?? null,
            rank: post.users.rank ?? "member",
          }
        : { id: post.user_id, username: "", avatar_url: null, rank: "member" },
    }));

    return NextResponse.json({
      data,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Supabase fallback error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/posts
 * Create a new post (requires authentication)
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get FormData from request and forward directly
    const incomingFormData = await request.formData();

    // Create new FormData for backend
    const formData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      formData.append(key, value);
    }

    // Forward the request to the backend as multipart/form-data
    const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
      method: "POST",
      headers: {
        // Don't set Content-Type - let fetch set it with boundary
        Authorization: authHeader,
      },
      body: formData,
    });

    // Parse response - handle both JSON and text responses
    const responseText = await response.text();

    // Try to parse as JSON, fallback to text error
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON response (likely an error message)
      data = { message: responseText || "Unknown backend error" };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Posts POST proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
