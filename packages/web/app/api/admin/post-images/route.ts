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
  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Number(searchParams.get("per_page") ?? 20);
  const status = searchParams.get("status") ?? "";
  const withItems = searchParams.get("with_items") ?? "";

  let query = supabase
    .schema("warehouse")
    .from("images")
    .select("*", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (withItems === "true") query = query.eq("with_items", true);
  if (withItems === "false") query = query.eq("with_items", false);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
  });
}
