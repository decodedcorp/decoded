import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

/**
 * PATCH /api/v1/admin/picks/:pickId
 *
 * Update a decoded pick (note, is_active, curated_by).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pickId: string }> }
) {
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

  const { pickId } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (rawBody === null || typeof rawBody !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const body = rawBody as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if ("note" in body) {
    if (body.note !== null && typeof body.note !== "string") {
      return NextResponse.json({ error: "invalid_note" }, { status: 400 });
    }
    updates.note =
      typeof body.note === "string" ? body.note.slice(0, 2000) : null;
  }
  if ("is_active" in body) {
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "invalid_is_active" }, { status: 400 });
    }
    updates.is_active = body.is_active;
  }
  if ("curated_by" in body) {
    if (body.curated_by !== null && typeof body.curated_by !== "string") {
      return NextResponse.json(
        { error: "invalid_curated_by" },
        { status: 400 }
      );
    }
    updates.curated_by =
      typeof body.curated_by === "string"
        ? body.curated_by.slice(0, 200)
        : null;
  }
  if ("post_id" in body) {
    if (typeof body.post_id !== "string" || body.post_id.length === 0) {
      return NextResponse.json({ error: "invalid_post_id" }, { status: 400 });
    }
    updates.post_id = body.post_id;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: before } = await supabase
    .from("decoded_picks")
    .select("*")
    .eq("id", pickId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("decoded_picks")
    .update(updates)
    .eq("id", pickId)
    .select()
    .single();

  if (error) {
    console.error("[admin/picks] update error:", error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  await writeAuditLog({
    adminUserId: user.id,
    action: "pick_update",
    targetTable: "decoded_picks",
    targetId: pickId,
    beforeState: before ?? null,
    afterState: data,
    metadata: { fields: Object.keys(updates) },
  });

  return NextResponse.json(data);
}

/**
 * DELETE /api/v1/admin/picks/:pickId
 *
 * Delete a decoded pick.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pickId: string }> }
) {
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

  const { pickId } = await params;

  const { data: before } = await supabase
    .from("decoded_picks")
    .select("*")
    .eq("id", pickId)
    .maybeSingle();

  const { error } = await supabase
    .from("decoded_picks")
    .delete()
    .eq("id", pickId);

  if (error) {
    console.error("[admin/picks] delete error:", error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  await writeAuditLog({
    adminUserId: user.id,
    action: "pick_delete",
    targetTable: "decoded_picks",
    targetId: pickId,
    beforeState: before ?? null,
    afterState: null,
  });

  return NextResponse.json({ success: true });
}
