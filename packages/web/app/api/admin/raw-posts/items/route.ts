import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { API_BASE_URL } from "@/lib/server-env";

async function adminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  if (!(await checkIsAdmin(supabase, user.id))) {
    return { error: "Forbidden", status: 403 as const };
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "No session", status: 401 as const };
  }
  return { token: session.access_token };
}

// GET /api/admin/raw-posts/items — assets 의 검증 큐 (#333 — proxy to api-server)
export async function GET(req: NextRequest) {
  const auth = await adminSession();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "API_BASE_URL is not configured" },
      { status: 502 }
    );
  }

  const qs = new URLSearchParams();
  for (const [k, v] of req.nextUrl.searchParams.entries()) {
    if (v) qs.set(k, v);
  }
  const url = `${API_BASE_URL}/api/v1/raw-posts/items${qs.toString() ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proxy error" },
      { status: 502 }
    );
  }
}
