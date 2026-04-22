/**
 * Admin — raw_posts 리스트 (#289)
 *
 * warehouse.raw_posts 를 읽어 parse_status / original_status /
 * seed_posts.status 필터 + 페이지네이션 제공. 읽기 전용이라 Supabase
 * 쿼리로 직접 충족 (Rust 백엔드 프록시 불필요).
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("per_page") ?? 20))
  );
  const parseStatus = searchParams.get("parse_status") ?? "";
  const originalStatus = searchParams.get("original_status") ?? "";
  const platform = searchParams.get("platform") ?? "";

  let query = supabase
    .schema("warehouse")
    .from("raw_posts")
    .select(
      "id, source_id, platform, external_id, external_url, r2_url, image_url, caption, author_name, parse_status, original_status, parse_attempts, seed_post_id, created_at, updated_at",
      { count: "exact" }
    );

  if (parseStatus) query = query.eq("parse_status", parseStatus);
  if (originalStatus) query = query.eq("original_status", originalStatus);
  if (platform) query = query.eq("platform", platform);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: count ?? 0,
      total_pages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
    },
  });
}
