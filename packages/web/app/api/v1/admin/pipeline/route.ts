import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchPipelines } from "@/lib/api/admin/pipeline";
import type { PipelineStatus } from "@/lib/api/admin/pipeline";

/**
 * GET /api/v1/admin/pipeline
 *
 * Returns a paginated list of AI pipeline executions.
 * Requires admin privileges.
 *
 * Query params:
 *   status    - filter by status: completed | running | failed
 *   page      - 1-based page number (default 1)
 *   pageSize  - items per page (default 15)
 *
 * Response shape: PipelineListResponse
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
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "15", 10))
  );
  const statusParam = searchParams.get("status") as PipelineStatus | null;

  // Validate status if provided
  const validStatuses: PipelineStatus[] = ["completed", "running", "failed"];
  const status =
    statusParam && validStatuses.includes(statusParam)
      ? statusParam
      : undefined;

  const result = await fetchPipelines({ page, pageSize, status });
  return NextResponse.json(result);
}
