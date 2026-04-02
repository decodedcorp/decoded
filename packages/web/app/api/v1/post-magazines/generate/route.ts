/**
 * POST /api/v1/post-magazines/generate
 *
 * Proxy to backend post-magazines generate API.
 * Triggers editorial generation for a specific post.
 * Requires admin privileges.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { API_BASE_URL } from "@/lib/server-env";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/post-magazines/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: request.headers.get("Authorization") ?? "",
        },
        body: JSON.stringify(body),
      }
    );

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        error: `Backend error: ${response.status} ${response.statusText}`,
      };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Post magazine generate proxy error:", error);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
