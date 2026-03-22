---
phase: quick
plan: 53
subsystem: auth
tags: [db-trigger, zustand, onboarding, oauth]
dependency_graph:
  requires: [supabase-auth, public.users-table]
  provides: [user-profile-state, onboarding-flow]
  affects: [authStore, root-layout]
tech_stack:
  added: []
  patterns: [zustand-profile-fetch, dynamic-import-ssr-false]
key_files:
  created:
    - supabase/migrations/20260305113700_enhance_handle_new_user.sql
    - packages/web/lib/components/auth/OnboardingSheet.tsx
  modified:
    - packages/web/lib/stores/authStore.ts
    - packages/web/app/layout.tsx
decisions:
  - "UserProfile interface matches actual DB schema (nullable username/display_name)"
  - "needsOnboarding detected by comparing username+display_name to email prefix"
  - "isAdmin derived from profile fetch instead of standalone fetchIsAdmin()"
metrics:
  duration: 190s
  completed: 2026-03-05
---

# Quick Task 53: DB Trigger + AuthStore + Onboarding UI Summary

Enhanced DB trigger captures OAuth metadata, authStore fetches public.users profile with new-user detection, OnboardingSheet UI for first-login experience.

## What Was Done

### Task 1: DB Trigger Enhancement + AuthStore Profile Connection
**Commit:** 7dab392

**Part A - DB Migration:**
- Created `handle_new_user()` replacement that extracts `avatar_url` and `display_name` from OAuth provider metadata (Kakao nickname, Google full_name, standard name)
- Username sanitized to lowercase alphanumeric + underscore, max 20 chars
- UNIQUE collision resolved with random 4-char suffix loop
- Migration file saved locally (needs manual apply to Supabase)

**Part B - AuthStore:**
- Added `UserProfile` interface matching `public.users` schema
- Added `profile`, `needsOnboarding` state fields
- Added `fetchProfile()` - queries `public.users` by user ID
- Added `updateProfile()` - writes username/display_name/bio updates
- Added `completeOnboarding()` - dismisses onboarding state
- `fetchProfile()` called in both `initialize()` and `setUser()`
- `isAdmin` now derived from profile data (removed standalone `fetchIsAdmin`)
- Added `selectProfile` and `selectNeedsOnboarding` selectors

### Task 2: OnboardingSheet UI Component
**Commit:** b5566fc

- Created `OnboardingSheet.tsx` with BottomSheet at 55% snap point
- Avatar preview (OAuth image or initial letter fallback)
- Username input with real-time validation (3-20 chars, alphanumeric + underscore)
- Display name input pre-filled from OAuth metadata
- Skip button dismisses without saving
- Complete button saves to DB, shows error on unique constraint violation
- Mounted in root layout via `next/dynamic` with `ssr: false`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UserProfile interface type mismatch**
- **Found during:** Task 1
- **Issue:** `UserProfile` had non-nullable `username` and `display_name` but DB schema allows null; missing `email` field; `style_dna` and `ink_credits` not always returned in select
- **Fix:** Made `username` and `display_name` nullable, added `email`, made `style_dna` and `ink_credits` optional
- **Files modified:** packages/web/lib/stores/authStore.ts
- **Commit:** 7dab392

## Pending: DB Migration Apply

The SQL migration file is saved locally but needs to be applied to the Supabase project (fvxchskblyhuswzlcmql). Apply via Supabase Dashboard SQL Editor or `mcp__supabase__apply_migration`.

## Checkpoint: Human Verification Approved

Task 3 human-verify checkpoint approved. DB migration will be applied manually later.

## Self-Check: PASSED
- [x] supabase/migrations/20260305113700_enhance_handle_new_user.sql exists
- [x] packages/web/lib/components/auth/OnboardingSheet.tsx exists
- [x] packages/web/lib/stores/authStore.ts modified
- [x] packages/web/app/layout.tsx modified
- [x] Commit 7dab392 exists
- [x] Commit b5566fc exists
- [x] TypeScript compiles (no new errors)
