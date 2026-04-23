---
id: 260423-sfx
description: 관리자 페이지 로그아웃 레이아웃 버그 및 로그인 후 진입 속도 최적화
date: 2026-04-23
must_haves:
  truths:
    - 로그아웃 후 사이드바(admin chrome)가 즉시 사라져야 한다
    - 로그아웃 직후 /admin/login 으로 이동했을 때 proxy.ts가 다시 /admin 으로 리다이렉트하지 않아야 한다
    - 로그인 → /admin 진입 시 layout 단계에서 Supabase Auth 서버 호출(getUser)을 제거하여 TTFB를 단축해야 한다
  artifacts:
    - packages/web/lib/components/admin/AdminSidebar.tsx (handleLogout)
    - packages/web/app/admin/layout.tsx (auth fast-path)
  key_links:
    - packages/web/proxy.ts:22-24,44-49,52-66 (proxy already validates admin via getSession + checkIsAdmin)
    - packages/web/lib/components/auth/AuthProvider.tsx:73-77 (SIGNED_OUT 핸들러: clearSessionCookies는 비동기로 실행되어 logout 호출자가 await 불가)
    - packages/web/app/admin/login/page.tsx:34-36 (login 흐름은 같은 이유로 window.location.href 사용 — 일관 패턴)
---

## Bug 1 — 로그아웃 후 사이드바 잔존

### Root cause
`lib/components/admin/AdminSidebar.tsx` line 134-140:
```tsx
async function handleLogout() {
  await logout();
  router.replace("/admin/login");
}
```
- `router.replace`는 client-side soft navigation. `app/admin/layout.tsx`는 Server Component이므로 클라이언트 auth 변경에 반응하지 않음 → AdminLayoutClient(사이드바)가 그대로 남음.
- 게다가 `AuthProvider`의 SIGNED_OUT 이벤트 핸들러가 `await fetch("/api/auth/session", { method: "DELETE" })`를 비동기로 호출하지만 `handleLogout`은 그 완료를 기다릴 수 없음. 그 사이 `router.replace("/admin/login")` 발생 → proxy.ts의 `/admin/login` 분기(line 44-49)가 여전히 유효한 세션 쿠키를 보면 `/admin`으로 다시 리다이렉트. 사이드바가 영영 안 사라지는 이유.

### Fix
`handleLogout` 안에서:
1. `await logout()` (Supabase signOut, localStorage 정리)
2. `await fetch("/api/auth/session", { method: "DELETE" })` — 쿠키를 명시적으로 inline에서 클리어 (AuthProvider가 비동기로 같은 일을 하지만 await 불가)
3. `window.location.assign("/admin/login")` — 하드 네비게이션으로 Server Component 재실행 강제

login 페이지도 같은 이유로 `window.location.href = "/admin"`을 쓰고 있으므로 패턴 일관성 유지.

## Bug 2 — 로그인 후 /admin 진입 속도

### Root cause
`app/admin/layout.tsx`:
```tsx
const { data: { user } } = await supabase.auth.getUser();
if (!user) return <>{children}</>;
const isAdmin = await checkIsAdmin(supabase, user.id);
```
- `supabase.auth.getUser()`는 매 요청마다 Supabase Auth 서버에 JWT 검증 네트워크 호출(~100–500ms).
- proxy.ts(line 52-66)가 이미 `getSession()` (쿠키 캐시, ~5–50ms) + `checkIsAdmin`으로 인증·권한을 모두 검증 완료한 상태. layout이 다시 무거운 `getUser`를 부르는 건 순수 중복 비용.

### Fix
`app/admin/layout.tsx`의 `getUser()`를 `getSession()`으로 교체. 보안 모델은 변하지 않음:
- 권한의 SoT는 `checkIsAdmin`(DB 조회)이며 그대로 유지
- proxy.ts가 모든 `/admin/*` 요청에서 동일 검증을 통과시킨 후에만 layout이 실행됨
- `/admin/login`은 proxy가 admin은 `/admin`으로 바운스(line 44-49)하므로 layout 도달 시점엔 비-admin/비로그인만 존재 → 사이드바 미렌더 분기로 안전 처리

기대 효과: layout 단의 Supabase Auth 네트워크 라운드트립 1회 제거. 로그인 직후 /admin 첫 페인트가 100~500ms 빨라짐.

## Tasks

### Task 1 — Fix logout hard reload + cookie race
- files: `packages/web/lib/components/admin/AdminSidebar.tsx`
- action: `handleLogout` 안에서 (a) `await logout()` 후 (b) `await fetch("/api/auth/session", { method: "DELETE" })`로 쿠키 명시 클리어, (c) `window.location.assign("/admin/login")`로 하드 네비게이션. `useRouter` 미사용 시 import 제거.
- verify: 빌드 통과(`bun run --cwd packages/web typecheck` 또는 lint), 로그아웃 시도시 사이드바 즉시 사라지고 `/admin/login` 표시.
- done: AdminLayout이 비-admin 분기로 떨어져 children만 렌더되는 것을 확인.

### Task 2 — Use getSession in admin layout
- files: `packages/web/app/admin/layout.tsx`
- action: `supabase.auth.getUser()` → `supabase.auth.getSession()`. `session.user`로 적절히 분기. 주석에 proxy.ts가 이미 검증한다는 점과 getSession 사용 근거 추가.
- verify: 타입체크 통과, /admin 진입 시 사이드바 정상 렌더, 비로그인 상태에서 /admin/login 접근 시 사이드바 미렌더.
- done: layout RSC에서 Supabase Auth 호출이 제거됨.
