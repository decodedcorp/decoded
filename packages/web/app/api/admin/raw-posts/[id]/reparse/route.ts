/**
 * Admin — reparse 수동 트리거 (#289)
 *
 * Rust `POST /api/v1/raw-posts/items/{id}/reparse` 로 프록시.
 * (Rust 가 다시 ai-server `/media/items/{id}/reparse` 로 내부 프록시)
 * 인증/권한은 Next.js 에서 체크하고 통과시킴.
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: "No session token" }, { status: 401 });
  }

  const target = `${API_BASE.replace(/\/$/, "")}/api/v1/raw-posts/items/${id}/reparse`;
  const resp = await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const body = await resp.text();
  return new NextResponse(body, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}
