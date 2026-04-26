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

// POST /api/admin/raw-posts/items/:id/verify (#333)
//   - api-server 가 assets.raw_posts(COMPLETED) → prod.posts INSERT 를 수행
//   - APP_ENV=production 이면 assets status=VERIFIED 도 함께 기록
//   - 응답: prod 의 PostResponse
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
  const { id } = await context.params;
  const payload = await req.text();
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/raw-posts/items/${encodeURIComponent(id)}/verify`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: payload || "{}",
      }
    );
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
