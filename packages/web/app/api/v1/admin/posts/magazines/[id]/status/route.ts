import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import { checkIsAdmin } from "@/lib/api/admin/auth";
import { isValidMagazineStatus } from "@/lib/api/admin/magazines";

interface PatchBody {
  status: string;
  rejectionReason?: string;
}

/**
 * PATCH /api/v1/admin/posts/magazines/[id]/status
 *
 * update_magazine_status RPC를 호출해 상태 전환 + audit log를 원자적으로 처리.
 * Body: { status, rejectionReason? }.
 *
 * 오류 매핑:
 * - magazine_not_found → 404
 * - invalid_transition: a -> b → 409
 * - rejection_reason_required → 400 (서버측 중복 가드)
 * - 나머지 → 500
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkIsAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.status !== "string" ||
    !isValidMagazineStatus(body.status)
  ) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  if (body.status === "rejected") {
    const reason = body.rejectionReason?.trim();
    if (!reason) {
      return NextResponse.json(
        { error: "rejection_reason_required" },
        { status: 400 }
      );
    }
    if (reason.length > 2000) {
      return NextResponse.json(
        { error: "rejection_reason_too_long" },
        { status: 400 }
      );
    }
    body.rejectionReason = reason;
  }

  const supabase = createAdminSupabaseClient();
  const rpcArgs: {
    p_magazine_id: string;
    p_new_status: string;
    p_admin_user_id: string;
    p_rejection_reason?: string;
  } = {
    p_magazine_id: id,
    p_new_status: body.status,
    p_admin_user_id: auth.userId,
  };
  if (body.rejectionReason !== undefined) {
    rpcArgs.p_rejection_reason = body.rejectionReason;
  }
  const { data, error } = await supabase.rpc("update_magazine_status", rpcArgs);

  if (error) {
    if (error.message?.includes("magazine_not_found")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error.message?.includes("invalid_transition")) {
      // Parse "invalid_transition: <from> -> <to>" into structured fields so
      // we don't leak the raw PostgreSQL exception prefix to the client.
      const match = error.message.match(
        /invalid_transition:\s*(\w+)\s*->\s*(\w+)/
      );
      return NextResponse.json(
        {
          error: "invalid_transition",
          from: match?.[1] ?? null,
          to: match?.[2] ?? null,
        },
        { status: 409 }
      );
    }
    if (error.message?.includes("rejection_reason_required")) {
      return NextResponse.json(
        { error: "rejection_reason_required" },
        { status: 400 }
      );
    }
    if (error.message?.includes("rejection_reason_too_long")) {
      return NextResponse.json(
        { error: "rejection_reason_too_long" },
        { status: 400 }
      );
    }
    if (
      error.message?.includes("caller_not_admin") ||
      error.message?.includes("caller_mismatch")
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/magazines/status] RPC error:", error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
