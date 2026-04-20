/**
 * POST /api/v1/events
 *
 * Behavioral event ingest — forwarded to api-server.
 *
 * Receives batched events from behaviorStore.flush() via navigator.sendBeacon,
 * resolves the current Supabase session, and forwards the JWT + payload to
 * api-server `/api/v1/events`. api-server enforces user_id from the JWT and
 * writes to public.user_events.
 *
 * - POST only (sendBeacon fires POST exclusively)
 * - Returns { ok: true/false } — sendBeacon ignores the response body
 * - Silent 401 for unauthenticated requests (sendBeacon doesn't retry)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Guard: empty or invalid payload (sendBeacon may send [] on timer flush)
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Session check — silent 401 for anon requests (sendBeacon won't retry)
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Forward to api-server — body shape matches EventItem[]
    const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok && process.env.NODE_ENV === "development") {
      console.error(`[events proxy] api-server returned ${response.status}`);
    }

    return NextResponse.json({ ok: response.ok });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[events proxy] error:", err);
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
