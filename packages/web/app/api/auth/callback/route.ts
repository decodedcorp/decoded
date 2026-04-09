import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 * Exchanges the auth code for a session and sets cookies,
 * then redirects to the specified `next` URL (default: /).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("[auth/callback] code:", code ? "present" : "missing", "next:", next);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[auth/callback] exchangeCode result:", error ? error.message : "success");

    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  console.log("[auth/callback] falling through to /");
  return NextResponse.redirect(new URL("/", req.url));
}
