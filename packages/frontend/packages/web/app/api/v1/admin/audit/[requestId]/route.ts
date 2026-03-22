import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchAuditDetail } from "@/lib/api/admin/audit";

/**
 * GET /api/v1/admin/audit/[requestId]
 *
 * Returns a single AI audit request with full item details.
 * Requires admin privileges.
 *
 * Path params:
 *   requestId - The audit request ID (e.g., "audit-1001")
 *
 * Response shape: AuditDetailResponse
 * Returns 404 if request ID is not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  // Admin auth check
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

  const { requestId } = await params;
  const result = await fetchAuditDetail(requestId);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
