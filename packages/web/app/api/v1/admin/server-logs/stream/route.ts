import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchLogStream } from "@/lib/api/admin/server-logs";

/**
 * GET /api/v1/admin/server-logs/stream
 *
 * Returns 1-3 fresh log entries for real-time polling.
 * Requires admin privileges.
 *
 * This endpoint is designed to be called every 2-3 seconds by the
 * streaming UI. Each call returns new entries to simulate live log tailing.
 *
 * Query params:
 *   since_id  - ID of the last seen entry (optional, for UI deduplication)
 *
 * Response shape: ServerLogStreamResponse
 *   { entries: ServerLogEntry[]; latestId: string }
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

  const { searchParams } = request.nextUrl;
  const sinceId = searchParams.get("since_id") ?? undefined;

  const result = await fetchLogStream(sinceId);
  return NextResponse.json(result);
}
