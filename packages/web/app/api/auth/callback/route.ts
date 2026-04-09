import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "로그인이 취소되었습니다.",
  invalid_request: "잘못된 로그인 요청입니다.",
  server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  temporarily_unavailable: "서비스가 일시적으로 사용 불가합니다.",
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
    const message = ERROR_MESSAGES[errorCode] ?? "로그인 중 오류가 발생했습니다.";
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error("[auth/callback] No code provided");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "인증 코드가 없습니다.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange error:", error.message);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "세션 생성에 실패했습니다.");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
