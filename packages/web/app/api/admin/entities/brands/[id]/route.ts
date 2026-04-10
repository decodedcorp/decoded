import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

export async function GET(
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

  const { data, error } = await supabase
    .schema("warehouse")
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

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

  const { data: before } = await supabase
    .schema("warehouse")
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  const body = await req.json();
  const { data, error } = await supabase
    .schema("warehouse")
    .from("brands")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "update",
    targetTable: "brands",
    targetId: id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
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
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .schema("warehouse")
    .from("brands")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "delete",
    targetTable: "brands",
    targetId: id,
    beforeState: before,
  });

  return NextResponse.json({ ok: true });
}
