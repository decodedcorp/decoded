/**
 * GET /api/v1/admin/editorial-candidates
 *
 * Proxy to backend admin editorial candidates API.
 * Returns posts eligible for editorial promotion (spot ≥ 4, solution ≥ 1/spot).
 * Requires admin privileges.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10))
  );

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/editorial-candidates?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: request.headers.get("Authorization") ?? "",
        },
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
      console.error("Editorial candidates proxy error:", error);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
