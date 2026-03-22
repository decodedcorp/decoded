import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchPipelineDetail } from "@/lib/api/admin/pipeline";

/**
 * GET /api/v1/admin/pipeline/[pipelineId]
 *
 * Returns a single pipeline execution with full step details.
 * Requires admin privileges.
 *
 * Path params:
 *   pipelineId - The pipeline execution ID (e.g., "pipe-2001")
 *
 * Response shape: PipelineExecution (with steps)
 * Returns 404 if pipeline ID is not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
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

  const { pipelineId } = await params;
  const pipeline = await fetchPipelineDetail(pipelineId);

  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(pipeline);
}
