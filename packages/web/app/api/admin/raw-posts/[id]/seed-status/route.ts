/**
 * Admin — seed_post 상태 전환 (#289)
 *
 * raw_post → seed_post 링크를 따라 seed_posts.status 를
 * 'draft' | 'approved' | 'rejected' 로 변경. Curator 의 최소 검수 액션.
 * 직접 Supabase 업데이트 (비즈니스 로직 없음).
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

const ALLOWED = new Set(["draft", "approved", "rejected"]);

export async function PATCH(
  req: NextRequest,
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

  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = body.status ?? "";
  if (!ALLOWED.has(status)) {
    return NextResponse.json(
      { error: "status must be one of: draft, approved, rejected" },
      { status: 400 }
    );
  }

  // Resolve raw_post → seed_post_id
  const { data: raw, error: rawErr } = await supabase
    .schema("warehouse")
    .from("raw_posts")
    .select("seed_post_id")
    .eq("id", id)
    .single();
  if (rawErr || !raw) {
    return NextResponse.json({ error: "raw_post not found" }, { status: 404 });
  }
  if (!raw.seed_post_id) {
    return NextResponse.json(
      { error: "raw_post has no seed_post yet — reparse first" },
      { status: 400 }
    );
  }

  const { error: updErr } = await supabase
    .schema("warehouse")
    .from("seed_posts")
    .update({ status })
    .eq("id", raw.seed_post_id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    raw_post_id: id,
    seed_post_id: raw.seed_post_id,
    status,
  });
}
