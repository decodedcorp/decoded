/**
 * POST /api/v1/events
 *
 * Behavioral event ingest endpoint.
 * Receives batched events from behaviorStore.flush() via navigator.sendBeacon.
 *
 * - POST only (sendBeacon fires POST exclusively)
 * - Returns { ok: true/false } — sendBeacon ignores the response body
 * - Silent 401 for unauthenticated requests (sendBeacon doesn't retry)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertEvents, type EventRow } from "@/lib/supabase/queries/events";
import type { Json } from "@/lib/supabase/types";

// Shape of each event item sent by the client-side behaviorStore
interface RawEventItem {
  event_type: string;
  entity_id?: string;
  session_id: string;
  page_path: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Guard: empty or invalid payload — early return (sendBeacon may send [] on timer flush)
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Unauthenticated — silent 401 (sendBeacon won't retry, no UI impact)
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Map client payload to DB rows, injecting server-verified user_id
    const rows: EventRow[] = (body as RawEventItem[]).map((e) => ({
      user_id: user.id,
      event_type: e.event_type,
      entity_id: e.entity_id ?? null,
      session_id: e.session_id,
      page_path: e.page_path,
      metadata: (e.metadata as Json) ?? undefined,
      created_at: e.timestamp,
    }));

    const { error } = await insertEvents(supabase, rows);

    if (error && process.env.NODE_ENV === "development") {
      console.error("[events API] insert error:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[events API] error:", err);
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
