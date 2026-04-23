import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/session
 * Sets server-side session cookies from client-provided tokens.
 * Called by AuthProvider on SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION so
 * that server route handlers and proxy.ts middleware see the same session as
 * the browser localStorage.
 */
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json();

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/auth/session
 * Clears server-side session cookies. Called by AuthProvider on SIGNED_OUT
 * so cookies don't outlive the browser-side logout.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
