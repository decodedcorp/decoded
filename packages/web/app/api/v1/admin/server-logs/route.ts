import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchServerLogs } from "@/lib/api/admin/server-logs";
import type { LogLevel } from "@/lib/api/admin/server-logs";

/**
 * GET /api/v1/admin/server-logs
 *
 * Returns a paginated, filtered list of server log entries.
 * Requires admin privileges.
 *
 * Query params:
 *   level     - filter by level: info | warn | error | debug
 *   search    - free-text search across message and endpoint
 *   from      - start of date range (ISO 8601, optional)
 *   to        - end of date range (ISO 8601, optional)
 *   page      - 1-based page number (default 1)
 *   pageSize  - items per page (default 50)
 *
 * Response shape: ServerLogListResponse
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
    200,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10))
  );
  const levelParam = searchParams.get("level") as LogLevel | null;
  const search = searchParams.get("search") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  // Validate level if provided
  const validLevels: LogLevel[] = ["info", "warn", "error", "debug"];
  const level =
    levelParam && validLevels.includes(levelParam) ? levelParam : undefined;

  const result = await fetchServerLogs({
    page,
    pageSize,
    level,
    search,
    from,
    to,
  });
  return NextResponse.json(result);
}
