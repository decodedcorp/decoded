import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";

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
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if ("note" in body) updates.note = body.note;
  if ("is_active" in body) updates.is_active = body.is_active;
  if ("curated_by" in body) updates.curated_by = body.curated_by;
  if ("post_id" in body) updates.post_id = body.post_id;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("decoded_picks")
    .update(updates)
    .eq("id", pickId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { error } = await supabase
    .from("decoded_picks")
    .delete()
    .eq("id", pickId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
