import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/v1/admin/picks
 *
 * List decoded picks with joined post data.
 * Query params: page, per_page
 */
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

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const perPage = Math.min(
    50,
    Math.max(1, Number(params.get("per_page") || 20))
  );
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("decoded_picks")
    .select(
      "*, posts:post_id(id, image_url, artist_name, group_name, context)",
      { count: "exact" }
    )
    .order("pick_date", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      post_id: row.post_id,
      pick_date: row.pick_date,
      note: row.note,
      curated_by: row.curated_by,
      is_active: row.is_active,
      created_at: row.created_at,
      post: row.posts ?? null,
    })),
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}

/**
 * POST /api/v1/admin/picks
 *
 * Create or upsert a decoded pick.
 * Body: { post_id, pick_date?, note?, curated_by? }
 */
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

  const body = await request.json();
  const { post_id, pick_date, note, curated_by } = body as {
    post_id?: string;
    pick_date?: string;
    note?: string;
    curated_by?: string;
  };

  if (!post_id) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("decoded_picks")
    .upsert(
      {
        post_id,
        pick_date: pick_date || new Date().toISOString().slice(0, 10),
        note: note || null,
        curated_by: curated_by || "editor",
      },
      { onConflict: "pick_date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
