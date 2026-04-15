import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { API_BASE_URL } from "@/lib/server-env";

/**
 * GET /api/v1/admin/monitoring/metrics
 *
 * Proxies to the Rust API server's admin monitoring endpoint.
 * Requires admin privileges.
 *
 * Response shape: MonitoringMetrics
 */
export async function GET() {
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

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 502 }
    );
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/admin/monitoring/metrics`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Backend error" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
