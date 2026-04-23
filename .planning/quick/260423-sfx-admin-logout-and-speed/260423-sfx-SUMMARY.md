# Quick Task 260423-sfx — Summary

**Date:** 2026-04-23
**Branch:** dev
**Commits:** 1948bd9d, 9581ea46

## Problem

1. 로그아웃 시 사이드바(admin chrome)가 화면에 그대로 남음.
2. 로그인 후 `/admin` 진입 시간이 체감상 느림.

## Root causes

### Bug 1 — sidebar persists after logout
- `AdminSidebar.handleLogout`가 `router.replace("/admin/login")`로 soft-nav. `app/admin/layout.tsx`는 Server Component이므로 client auth 변경을 감지하지 못해 `AdminLayoutClient`(사이드바)가 mount된 상태로 유지.
- `AuthProvider`는 `SIGNED_OUT` 이벤트에서 `DELETE /api/auth/session`을 비동기로 호출하지만 `handleLogout` 호출자가 await할 수단이 없음. 서버 쿠키가 아직 살아있는 상태로 `/admin/login`에 도달하면 `proxy.ts:44-49`가 admin으로 인식해 `/admin`으로 다시 리다이렉트. 사이드바가 영영 사라지지 않는 진짜 원인.

### Bug 2 — slow entry to /admin
- `app/admin/layout.tsx`가 `supabase.auth.getUser()` 호출. 이 메서드는 매 요청마다 Supabase Auth 서버에 JWT 검증 네트워크 호출을 수행해 보통 ~100–500ms 소요.
- `proxy.ts`가 이미 `getSession()` + `checkIsAdmin(DB)`으로 `/admin/*` 모든 요청을 검증하므로 layout의 `getUser()`는 순수 중복 비용.

## Changes

### `packages/web/lib/components/admin/AdminSidebar.tsx` (commit 1948bd9d)
- `useRouter` 제거.
- `handleLogout`:
  1. `await logout()` (Supabase signOut, localStorage 정리)
  2. `await fetch("/api/auth/session", { method: "DELETE" })` — 쿠키 inline 클리어 (try/catch로 best-effort)
  3. `window.location.assign("/admin/login")` — 하드 네비게이션

### `packages/web/app/admin/layout.tsx` (commit 9581ea46)
- `supabase.auth.getUser()` → `supabase.auth.getSession()`.
- `session.user`에서 `adminName`/`user.id` 추출. `checkIsAdmin`(DB, 권한 SoT)는 그대로 유지.
- 주석에 proxy.ts 선행 검증 및 getSession 근거 추가.

## Verification

- `bunx tsc --noEmit` 실행 — 수정 파일(`AdminSidebar.tsx`, `app/admin/layout.tsx`) 관련 타입 에러 없음. 기존 무관 테스트 파일(`toDecodeShowcaseData.test.ts`) 1건만 선행 상태.
- 두 커밋 모두 원자적으로 분리하여 rollback 용이.
- 남은 수동 검증 (dev 서버에서 확인 권장):
  - 로그아웃 클릭 → `/admin/login`으로 하드 리다이렉트되며 사이드바 즉시 제거되는지
  - 로그인 → `/admin` 대시보드 첫 렌더까지 체감 지연 감소 여부

## Risk / Rollback

- 보안 모델 불변: 권한의 SoT는 `checkIsAdmin`(DB)이고 `proxy.ts`의 admin 검증은 그대로. `getSession`은 proxy에서도 이미 쓰이는 패턴.
- 로그아웃 경로의 쿠키 DELETE는 AuthProvider와 중복이지만 멱등하고 best-effort. 실패해도 signOut이 토큰을 무효화한 상태.
- Rollback: 두 커밋을 `git revert` 하면 이전 동작으로 복구.
