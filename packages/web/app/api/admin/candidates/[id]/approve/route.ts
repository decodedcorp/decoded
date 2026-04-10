import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

export async function POST(
  _: NextRequest,
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

  const { data: before } = await supabase
    .schema("warehouse")
    .from("seed_posts")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .schema("warehouse")
    .from("seed_posts")
    .update({ status: "ready" })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "approve",
    targetTable: "seed_posts",
    targetId: id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ data });
}
