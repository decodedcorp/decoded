# SCR-USER-01: Login Screen

**ID:** SCR-USER-01
**Route:** `/login`
**Status:** Implemented
**Flow:** FLW-04 — User Authentication

> See: [FLW-04](../../flows/FLW-04-user.md) | [SCR-USER-02](./SCR-USER-02-profile.md) | [store-map](../../_shared/store-map.md)

---

## Purpose

User authenticates via Google OAuth or continues as guest to access the app; no existing-session redirect — authenticated users can revisit /login freely.

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| LoginPage | `packages/web/app/login/page.tsx` | Page orchestrator |
| LoginLayout | `packages/web/app/login/layout.tsx` | fixed inset-0 z-50 wrapper |
| LoginBackground | `packages/web/app/login/LoginBackground.tsx` | DomeGallery Three.js background |
| LoginCard | `packages/web/lib/components/auth/LoginCard.tsx` | Card UI + OAuth + guest button |
| AuthProvider | `packages/web/lib/components/auth/AuthProvider.tsx` | Session listener (onAuthStateChange) |
| OAuthButton | `packages/web/lib/components/auth/OAuthButton.tsx` | Google OAuth trigger |
| DS OAuthButton | `packages/web/lib/design-system/oauth-button.tsx` | OAuth button primitive |
| DS GuestButton | `packages/web/lib/design-system/guest-button.tsx` | Guest button primitive |
| DS LoginCard | `packages/web/lib/design-system/login-card.tsx` | Card shell UI |

---

## Layout — Mobile

```
┌──────────────────────────────────────┐
│  [DomeGallery — Three.js dome,       │  LoginBackground
│   grayscale, autoRotate, z-0]        │  (real images from /api/v1/images)
│                                      │
│  [dark overlay bg-black/30]          │
│                                      │
│  ┌────────────────────────────┐      │
│  │    decoded  (yellow logo)  │      │  LoginCard (max-w-sm)
│  │    Welcome to Decoded      │      │  bg-white/5 backdrop-blur-xl
│  │    Discover what they're   │      │
│  │    wearing                 │      │
│  │  [error block if error]    │      │  red bg-red-500/10 border
│  │  [G] Continue with Google  │      │  OAuthButton — Google only
│  │  ────────── or ──────────  │      │
│  │  [ Continue as Guest ]     │      │  inline button (not DS GuestButton)
│  │  Terms · Privacy           │      │
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

---

## Layout — Desktop (delta from mobile)

Same centered card; DomeGallery fills wider viewport. Card remains max-w-sm centered.

---

## authStore State Transitions

| State | authStore Fields | UI |
|-------|------------------|----|
| Initial | `isInitialized=false`, `isLoading=false` | DomeGallery + LoginCard visible |
| Authenticating | `loadingProvider='google'`, `isLoading=true` | OAuthButton shows spinner |
| OAuth redirect | `loadingProvider='google'`, loading state held | Browser leaves page |
| Authenticated | `user=User`, `isGuest=false`, `isLoading=false` | Supabase redirects to `'/'` |
| Guest | `user=null`, `isGuest=true` | `router.push('/')` |
| Error | `error=string`, `isLoading=false`, `loadingProvider=null` | Red block below buttons |

### Key Selectors

| Selector | Formula | Use |
|----------|---------|-----|
| `selectIsAuthenticated` | `!!user \|\| isGuest` | "Can browse" check — true for OAuth + guest |
| `selectIsLoggedIn` | `!!user` | Real account only — required for submit/upload |
| `selectIsGuest` | `isGuest` | Guest mode indicator |

---

## Google OAuth Flow

1. User taps Google button → `OAuthButton.onClick`
2. `authStore.signInWithOAuth('google')` → sets `loadingProvider='google'`, `isLoading=true`
3. `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } })`
4. Browser redirects to Google consent screen
5. Google redirects back to `${origin}/` (OAuth callback)
6. `AuthProvider.onAuthStateChange` detects `SIGNED_IN` → `authStore.setUser(supabaseUser)`
7. `setUser` maps SupabaseUser → app `User`, fetches `isAdmin` from `users` table
8. User lands on `/` (redirect was set in `redirectTo`)

---

## Guest Login Flow

1. User taps "Continue as Guest"
2. `authStore.guestLogin()` → `isGuest=true`, `user=null`
3. `router.push('/')`

---

## Auth-Conditional Rendering Pattern

| Layer | Rule |
|-------|------|
| Middleware | Protects `/admin/:path*` only — no middleware on `/login` |
| Header | `user ? authenticated menu : Login link` |
| `/login` page | No auth check — any user (including authenticated) can visit |

---

## Error States

| Error | Cause | UI |
|-------|-------|-----|
| OAuth failure | Provider error or config issue | `authStore.error` → red block |
| Network error | No connectivity | `authStore.error` → red block |
| Loading | DomeGallery fetch pending | Black div placeholder (not spinner) |

---

## Requirements

- When user taps Google OAuth button, the system shall initiate Supabase OAuth flow with `provider: 'google'` and redirect to `'/'` on success. — **IMPL**
- When OAuth completes, the system shall call `authStore.setUser` and the browser lands on `/` via `redirectTo`. — **IMPL**
- When user taps Guest button, the system shall set `authStore.isGuest=true` and call `router.push('/')`. — **IMPL**
- When OAuth fails, the system shall set `authStore.error` and display a red error block below the buttons. — **IMPL**
- When authenticated user visits `/login`, the system shall NOT redirect away (no auth guard on `/login`). — **IMPL** (by omission)
- Kakao and Apple OAuth buttons (code exists in OAuthButton) — **NOT-IMPL** (LoginCard renders Google only)

---

> Cross-ref: [SCR-USER-02](./SCR-USER-02-profile.md) — authenticated user destination after login
