import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_BASE_URL } from "@/lib/server-env";

/**
 * POST /api/v1/reports
 *
 * Proxies report creation to Rust backend.
 * Requires authentication (not admin).
 *
 * Body: { target_type, target_id, reason, details? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Report proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
