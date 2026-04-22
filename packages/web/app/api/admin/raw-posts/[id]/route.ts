/**
 * Admin — raw_post 상세 + 관련 데이터 (#289)
 *
 * 한 번의 요청으로 raw_post / source_media_originals / seed_post (+ spots)
 * 를 모두 반환해 상세 페이지가 UI 조합에 집중할 수 있게 한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

export async function GET(
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

  const { data: raw, error: rawErr } = await supabase
    .schema("warehouse")
    .from("raw_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (rawErr || !raw) {
    return NextResponse.json({ error: "raw_post not found" }, { status: 404 });
  }

  const { data: originals } = await supabase
    .schema("warehouse")
    .from("source_media_originals")
    .select("*")
    .eq("raw_post_id", id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  let seedPost = null;
  let seedSpots: unknown[] = [];
  if (raw.seed_post_id) {
    const { data: sp } = await supabase
      .schema("warehouse")
      .from("seed_posts")
      .select("*")
      .eq("id", raw.seed_post_id)
      .single();
    seedPost = sp ?? null;
    const { data: spots } = await supabase
      .schema("warehouse")
      .from("seed_spots")
      .select("*")
      .eq("seed_post_id", raw.seed_post_id)
      .order("request_order", { ascending: true });
    seedSpots = spots ?? [];
  }

  return NextResponse.json({
    raw_post: raw,
    originals: originals ?? [],
    seed_post: seedPost,
    seed_spots: seedSpots,
  });
}
