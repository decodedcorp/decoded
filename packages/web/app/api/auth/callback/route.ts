import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Sign in was cancelled.",
  invalid_request: "Invalid sign-in request.",
  server_error: "A server error occurred. Please try again shortly.",
  temporarily_unavailable: "The service is temporarily unavailable.",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // OAuth provider가 에러를 반환한 경우
  if (errorCode) {
    console.error("[auth/callback] OAuth error:", errorCode, errorDescription);
    const message =
      ERROR_MESSAGES[errorCode] ?? "An error occurred while signing in.";
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error("[auth/callback] No code provided");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Missing auth code.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange error:", error.message);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Failed to create session.");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
