import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ reportId: string }>;
};

/**
 * PATCH /api/v1/admin/reports/[reportId]
 *
 * Proxies admin report status update to Rust backend.
 * Requires admin privileges.
 *
 * Body: { status: "pending" | "reviewed" | "dismissed" | "actioned", resolution? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const { reportId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/reports/${reportId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
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
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Admin report update proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
