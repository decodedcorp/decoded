# Quick Task 260402-mls: Summary

**Task:** Nav 기능 숨기기 for 1차 릴리즈 (GH #35)
**Date:** 2026-04-02
**Status:** Complete

## Changes

### `packages/web/lib/components/main-renewal/SmartNav.tsx`

**Removed from NAV_ITEMS:**
- Upload (`/request/upload`)
- Lab (`/lab`)

**Removed from JSX:**
- Try On 버튼 (VTON)
- Admin 링크 (Shield)
- Notification bell (Bell)
- Profile dropdown (avatar + menu)
- Login 링크

**Cleaned up imports:**
- Removed: `Bell`, `User`, `Settings`, `Activity`, `LogOut`, `Shield`, `Sparkles` (lucide-react)
- Removed: `useVtonStore`, `useAuthStore`, `selectIsAdmin`, `useRouter`
- Removed: dropdown state (`dropdownOpen`, `dropdownRef`), dropdown close effect, `openVton`, `handleUploadClick`

**Kept:**
- Home, Explore nav links
- Search 버튼
- Logo
- Scroll hide/show (GSAP)

**Comment markers:** `1st release: {feature} hidden (GH #35)`

## Verification

- `bun run build`: Pass
- MobileNavBar: 변경 없음 (Home, Search, Explore)
- Desktop SmartNav: Logo | Home | Explore | Search
