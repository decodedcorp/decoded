import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchAuditList } from "@/lib/api/admin/audit";
import type { AuditStatus } from "@/lib/api/admin/audit";

/**
 * GET /api/v1/admin/audit
 *
 * Returns a paginated list of AI audit requests.
 * Requires admin privileges.
 *
 * Query params:
 *   page     - 1-based page number (default 1)
 *   perPage  - items per page (default 10, max 50)
 *   status   - filter by status: pending | completed | error | modified
 *
 * Response shape: AuditListResponse
 */
export async function GET(request: NextRequest) {
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

  // Parse query params
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("perPage") ?? "10", 10))
  );
  const statusParam = searchParams.get("status") as AuditStatus | null;

  // Validate status if provided
  const validStatuses: AuditStatus[] = [
    "pending",
    "completed",
    "error",
    "modified",
  ];
  const status =
    statusParam && validStatuses.includes(statusParam)
      ? statusParam
      : undefined;

  const result = await fetchAuditList({ page, perPage, status });
  return NextResponse.json(result);
}
