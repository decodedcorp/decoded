import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/api/admin/auth";
import {
  MAGAZINE_STATUSES,
  isValidMagazineStatus,
  type AdminMagazineListResponse,
} from "@/lib/api/admin/magazines";

/**
 * GET /api/v1/admin/posts/magazines
 *
 * Admin magazine 목록 (페이지네이션 + status 필터).
 * Query: ?status=draft|pending|published|rejected&page=1&limit=20
 */
export async function GET(req: Request) {
  const auth = await checkIsAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10))
  );

  if (status && !isValidMagazineStatus(status)) {
    return NextResponse.json(
      {
        error: "invalid_status",
        validStatuses: MAGAZINE_STATUSES,
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("post_magazines")
    .select(
      "id,title,status,keyword,subtitle,published_at,rejection_reason,approved_by,created_at,updated_at",
      { count: "exact" }
    );

  if (status) query = query.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[admin/magazines] list error:", error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  const response: AdminMagazineListResponse = {
    data: (data ?? []) as AdminMagazineListResponse["data"],
    total: count ?? 0,
    page,
    limit,
  };
  return NextResponse.json(response);
}
