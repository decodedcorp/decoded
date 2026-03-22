---
phase: v2-08-request-flow-login
plan: 03
subsystem: auth
tags: [oauth, google, login, design-system]

# Dependency graph
requires:
  - phase: v2-01-design-system-foundation
    provides: Design tokens and component patterns
  - phase: v2-02-core-interactive-components
    provides: Base UI components
provides:
  - Simplified login page with Google-only OAuth
  - OAuth button styled per decoded.pen specs (320px x 52px, 12px radius)
  - Centered single-button layout
affects: [v2-09-documentation-polish, future-auth-expansion]

# Tech tracking
tech-stack:
  added: []
  patterns: [google-only-oauth, centered-button-layout]

key-files:
  created: []
  modified:
    - packages/web/lib/components/auth/LoginCard.tsx
    - packages/web/lib/components/auth/OAuthButton.tsx
    - packages/web/lib/components/request/RequestModal.tsx

key-decisions:
  - "Google-only OAuth for v2.0 launch, Kakao/Apple deferred"
  - "OAuthButton dimensions per decoded.pen: 320px width, 52px height, 12px radius"
  - "Keep OAuthProvider type unchanged for future compatibility"

patterns-established:
  - "OAuth button styling: max-w-[320px] w-full h-[52px] rounded-xl"
  - "Simplified OAuth provider selection reduces decision fatigue"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase v2-08 Plan 03: Login Page Google-Only OAuth

**Login page simplified to single Google OAuth button with decoded.pen styling (320px x 52px, 12px radius), reducing decision fatigue while preserving Guest login**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T10:46:41Z
- **Completed:** 2026-02-05T10:48:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed Kakao and Apple OAuth buttons from login page
- Applied decoded.pen styling to OAuth button (320px width, 52px height, 12px radius)
- Preserved Guest login functionality
- Fixed type error in RequestModal (Step 4 removal)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update LoginCard to show only Google OAuth** - `a6729b1` (feat)
2. **Task 2: Update OAuthButton styling to match decoded.pen specs** - `57f715c` (feat)
3. **Bug fix: Remove Step 4 from RequestModal** - `a5640a0` (fix)

## Files Created/Modified
- `packages/web/lib/components/auth/LoginCard.tsx` - Removed Kakao/Apple OAuth buttons, centered Google button
- `packages/web/lib/components/auth/OAuthButton.tsx` - Applied decoded.pen dimensions and styling
- `packages/web/lib/components/request/RequestModal.tsx` - Removed Step 4 to match RequestStep type

## Decisions Made
- **Google-only OAuth:** Simplifies initial v2.0 launch, Kakao/Apple will be added later
- **Preserve OAuthProvider type:** Keep "kakao" | "google" | "apple" type for future compatibility
- **Centered layout:** flex flex-col items-center for single button presentation
- **decoded.pen dimensions:** 320px width, 52px height, 12px border-radius

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed Step 4 from RequestModal to match RequestStep type**
- **Found during:** Build verification after Task 2
- **Issue:** RequestStep type is `1 | 2 | 3` but code referenced Step 4, causing TypeScript error
- **Fix:** Removed Step 4 from STEP_TITLES, handleNext logic, conditional rendering, and footer condition
- **Files modified:** packages/web/lib/components/request/RequestModal.tsx
- **Verification:** yarn build completes successfully
- **Committed in:** a5640a0 (separate bug fix commit)

---

**Total deviations:** 1 auto-fixed (bug fix)
**Impact on plan:** Bug fix was necessary to complete build. This aligns with v2-08 CONTEXT decision to merge Submit into Details (3 steps instead of 4).

## Issues Encountered
None - all tasks completed as planned. Bug fix was straightforward type alignment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Login page simplified and styled per decoded.pen specs
- Google OAuth flow remains functional
- Guest login preserved for users who don't want to authenticate
- Request Flow components ready for v2-08-01 and v2-08-02 styling updates

**Blockers:** None

**Next steps:**
1. Plan v2-08-01: Request Upload page styling
2. Plan v2-08-02: Request Detection and Details pages styling

---
*Phase: v2-08-request-flow-login*
*Completed: 2026-02-05*
