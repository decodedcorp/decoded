# Auth Stabilization Implementation Plan (#44)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OAuth 콜백 에러 처리, 세션 만료 UX, 리다이렉트 안정화, 프로필 연동을 강화하여 유저 기반 기능의 선행 조건을 완성한다.

**Architecture:** OAuth callback route에서 에러 분기 → AuthProvider에서 세션 리프레시 로직 → authStore에 sessionExpired 상태 추가 → LoginCard에서 리다이렉트 URL 보존. 기존 코드 위에 incremental 개선.

**Tech Stack:** Next.js 16, React 19, Supabase Auth, Zustand, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/web/app/api/auth/callback/route.ts` | OAuth 콜백 에러 분기 |
| Modify | `packages/web/app/login/page.tsx` | 에러 메시지 표시 |
| Modify | `packages/web/lib/stores/authStore.ts` | sessionExpired 플래그, 리다이렉트 로직 |
| Modify | `packages/web/lib/components/auth/AuthProvider.tsx` | 세션 리프레시, 만료 감지 |
| Modify | `packages/web/lib/components/auth/LoginCard.tsx` | 에러 파라미터 표시 |
| Create | `packages/web/lib/components/auth/SessionExpiredBanner.tsx` | 세션 만료 알림 UI |
| Create | `packages/web/lib/components/auth/AuthGuard.tsx` | 보호 페이지 래퍼 |

---

### Task 1: OAuth 콜백 에러 강화

**Files:**
- Modify: `packages/web/app/api/auth/callback/route.ts`

- [ ] **Step 1: 에러 코드별 분기 처리**

현재 callback은 에러 시 그냥 `/`로 리다이렉트. 에러 코드를 파싱하여 사용자에게 전달:

```typescript
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
```

- [ ] **Step 2: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/api/auth/callback/route.ts
git commit -m "fix(auth): add error code handling to OAuth callback (#44)"
```

---

### Task 2: 로그인 페이지 에러 표시

**Files:**
- Modify: `packages/web/lib/components/auth/LoginCard.tsx`

- [ ] **Step 1: URL 에러 파라미터 표시**

LoginCard에서 `?error=` 쿼리 파라미터를 읽어 에러 메시지 표시:

```typescript
// LoginCard 내부, 기존 error 상태 아래에 추가
const urlError = searchParams.get("error");
```

에러 표시 JSX에서 두 소스 모두 처리:
```tsx
{(error || urlError) && (
  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
    <p className="text-sm text-red-400 text-center">{error || urlError}</p>
  </div>
)}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/auth/LoginCard.tsx
git commit -m "feat(auth): display OAuth error messages on login page (#44)"
```

---

### Task 3: AuthStore 세션 만료 상태 추가

**Files:**
- Modify: `packages/web/lib/stores/authStore.ts`

- [ ] **Step 1: sessionExpired 플래그 추가**

AuthState 인터페이스에:
```typescript
sessionExpired: boolean;
```

초기값: `sessionExpired: false`

- [ ] **Step 2: 로그아웃/세션 클리어 시 리셋**

`logout`, `setUser(null)` 액션에서 `sessionExpired: false` 추가.

- [ ] **Step 3: setSessionExpired 액션 추가**

```typescript
setSessionExpired: (expired: boolean) => void;
```

구현:
```typescript
setSessionExpired: (expired: boolean) => {
  set({ sessionExpired: expired });
},
```

- [ ] **Step 4: selector 추가**

```typescript
export const selectSessionExpired = (state: AuthState) => state.sessionExpired;
```

- [ ] **Step 5: signInWithOAuth redirectTo 수정**

현재 `redirectTo`가 `window.location.origin + "/"` 하드코딩. 콜백 URL을 올바르게 설정:
```typescript
redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(sessionStorage.getItem("post_login_redirect") || "/")}`,
```

- [ ] **Step 6: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 7: Commit**

```bash
git add packages/web/lib/stores/authStore.ts
git commit -m "feat(auth): add sessionExpired state and redirect improvements (#44)"
```

---

### Task 4: AuthProvider 세션 리프레시 로직

**Files:**
- Modify: `packages/web/lib/components/auth/AuthProvider.tsx`

- [ ] **Step 1: 세션 만료 감지 및 리프레시**

```tsx
"use client";

import { useEffect } from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] Auth state changed:", event);

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          setUser(session?.user ?? null);
          setSessionExpired(false);
          break;

        case "SIGNED_OUT":
          setUser(null);
          setSessionExpired(false);
          break;

        case "INITIAL_SESSION":
          // initialize()에서 처리
          break;

        default:
          break;
      }
    });

    // 주기적 세션 체크 (5분마다)
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session }, error } = await supabaseBrowserClient.auth.getSession();

      if (error || !session) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          // 로그인 상태였는데 세션이 없어진 경우
          console.warn("[AuthProvider] Session expired, attempting refresh...");
          const { error: refreshError } = await supabaseBrowserClient.auth.refreshSession();
          if (refreshError) {
            console.error("[AuthProvider] Session refresh failed:", refreshError.message);
            setSessionExpired(true);
          }
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [initialize, setUser, setSessionExpired]);

  return <>{children}</>;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/auth/AuthProvider.tsx
git commit -m "feat(auth): add session refresh and expiry detection (#44)"
```

---

### Task 5: 세션 만료 배너 컴포넌트

**Files:**
- Create: `packages/web/lib/components/auth/SessionExpiredBanner.tsx`

- [ ] **Step 1: 세션 만료 알림 UI**

```tsx
"use client";

import { useAuthStore, selectSessionExpired } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";

export function SessionExpiredBanner() {
  const sessionExpired = useAuthStore(selectSessionExpired);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  if (!sessionExpired) return null;

  const handleReLogin = async () => {
    await logout();
    sessionStorage.setItem("post_login_redirect", window.location.pathname);
    router.push("/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-3 text-center text-sm font-medium backdrop-blur-sm">
      <span>세션이 만료되었습니다. </span>
      <button
        onClick={handleReLogin}
        className="underline font-bold hover:opacity-80"
      >
        다시 로그인
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 레이아웃에 배너 추가**

`packages/web/app/layout.tsx`의 AuthProvider 안에 `<SessionExpiredBanner />` 추가.

- [ ] **Step 3: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/auth/SessionExpiredBanner.tsx packages/web/app/layout.tsx
git commit -m "feat(auth): add session expired banner with re-login CTA (#44)"
```

---

### Task 6: AuthGuard 보호 페이지 래퍼

**Files:**
- Create: `packages/web/lib/components/auth/AuthGuard.tsx`

- [ ] **Step 1: AuthGuard 컴포넌트**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, selectIsLoggedIn, selectIsInitialized } from "@/lib/stores/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const isInitialized = useAuthStore(selectIsInitialized);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isInitialized, isLoggedIn, router]);

  if (!isInitialized) {
    return fallback ?? (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: /request 페이지에 AuthGuard 적용**

`packages/web/app/request/layout.tsx` 또는 해당 페이지에서 `<AuthGuard>` 래핑.

- [ ] **Step 3: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/auth/AuthGuard.tsx packages/web/app/request/
git commit -m "feat(auth): add AuthGuard for protected routes with redirect (#44)"
```

---

### Task 7: 프로필 연동 강화

**Files:**
- Modify: `packages/web/lib/stores/authStore.ts`

- [ ] **Step 1: fetchProfile 에러 복구 로직**

`fetchProfile`에서 404 (유저 레코드 없음) 시 자동 생성 또는 온보딩으로 라우팅:

```typescript
fetchProfile: async () => {
  const user = get().user;
  if (!user) return;

  try {
    const { data, error } = await supabaseBrowserClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows — 신규 유저, 온보딩 필요
        console.log("[authStore] New user detected, needs onboarding");
        set({ needsOnboarding: true, profile: null });
        return;
      }
      console.error("Failed to fetch profile:", error);
      return;
    }

    const profile = data as unknown as UserProfile;
    const emailPrefix = user.email.split("@")[0] || "";
    const isDefault =
      (profile.username ?? "") === emailPrefix &&
      (profile.display_name ?? "") === emailPrefix;

    set({
      profile,
      isAdmin: profile.is_admin === true,
      needsOnboarding: isDefault,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
  }
},
```

- [ ] **Step 2: 빌드 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty`
Expected: 타입 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/stores/authStore.ts
git commit -m "fix(auth): handle missing user profile with onboarding redirect (#44)"
```

---

### Task 8: QA — Chrome MCP 브라우저 테스트

- [ ] **Step 1: dev 서버 실행**

Run: `cd packages/web && bun run dev` (localhost:3000)

- [ ] **Step 2: Google OAuth 로그인 테스트**

Chrome MCP로:
1. `localhost:3000/login` 접근
2. Google OAuth 버튼 클릭
3. 로그인 완료 후 홈으로 리다이렉트 확인
4. authStore에 user, profile 데이터 확인

- [ ] **Step 3: 세션 만료 시뮬레이션**

Chrome MCP의 JavaScript 도구로 세션 만료 시뮬레이션:
```javascript
// authStore에서 sessionExpired 강제 설정
window.__zustand_authStore?.setState({ sessionExpired: true });
```
배너 표시 확인, "다시 로그인" 클릭 시 /login 이동 확인.

- [ ] **Step 4: 보호 페이지 리다이렉트 테스트**

1. 로그아웃 상태에서 `/request` 접근
2. `/login?redirect=%2Frequest`로 리다이렉트 확인
3. 로그인 후 `/request`로 복귀 확인

- [ ] **Step 5: 에러 콜백 테스트**

`localhost:3000/login?error=로그인이 취소되었습니다.` 접근하여 에러 메시지 표시 확인.
