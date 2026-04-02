---
phase: 54-card-enrichment
plan: 01
subsystem: ui
tags: [react, vitest, testing-library, jsdom, explore, grid, badge, spotCount]

# Dependency graph
requires:
  - phase: 50-saved-tab-frontend
    provides: infinite scroll pattern (getMyTries/getMySaved raw function + IntersectionObserver)
provides:
  - spotCount badge pill on Explore card cells (top-right, black/blur pill)
  - GridItem.spotCount?: number type field
  - post.spot_count actual data mapping (replaces hardcoded 0)
  - jsdom + @testing-library/react test infrastructure for component tests
affects:
  - ExploreClient, ExploreCardCell, ThiingsGrid consumers
  - any future card enrichment phases

# Tech tracking
tech-stack:
  added:
    - "@testing-library/react ^16.3.2"
    - "@testing-library/jest-dom ^6.9.1"
    - "jsdom ^29.0.1"
  patterns:
    - "@vitest-environment jsdom docblock for component tests in lib/components/**/__tests__/"
    - "vi.mock for GSAP/next-image/Zustand in component unit tests"
    - "makeConfig() helper pattern for ItemConfig test fixtures"

key-files:
  created:
    - "packages/web/lib/components/explore/__tests__/ExploreCardCell.test.tsx"
  modified:
    - "packages/web/lib/components/ThiingsGrid.tsx"
    - "packages/web/lib/hooks/useImages.ts"
    - "packages/web/app/explore/ExploreClient.tsx"
    - "packages/web/lib/components/explore/ExploreCardCell.tsx"
    - "packages/web/vitest.config.ts"
    - "packages/web/package.json"

key-decisions:
  - "Use @vitest-environment jsdom docblock (not environmentMatchGlobs config) — TypeScript doesn't recognize environmentMatchGlobs in this vitest version"
  - "spotCount in ExploreClient uses conditional spread: item.spotCount > 0 only — avoids sending 0 to GridItem (undefined = no badge)"
  - "Badge pill positioned top-right (top-2 right-2) — no conflict with editorial overlay at bottom-0"

patterns-established:
  - "Component unit tests in lib/components/**/__tests__/*.test.tsx with @vitest-environment jsdom docblock"
  - "Mock complex deps (GSAP, next/image, Zustand stores) at module level in test files"

requirements-completed:
  - CARD-01

# Metrics
duration: 15min
completed: 2026-04-02
---

# Phase 54 Plan 01: Card Enrichment Summary

**spotCount badge pill on Explore cards — real post.spot_count data replaces hardcoded 0, top-right pill renders when count > 0, TDD with jsdom + testing-library**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-02T11:23:00Z
- **Completed:** 2026-04-02T11:26:30Z
- **Tasks:** 3 (Task 1 RED + Task 2 GREEN + Task 3 typecheck)
- **Files modified:** 6 files (4 source + 1 test + 2 config)

## Accomplishments

- Fixed `spotCount: 0` hardcoding to use `post.spot_count ?? 0` from Supabase response
- Added `spotCount?: number` field to `GridItem` type in ThiingsGrid.tsx
- Rendered top-right pill badge in ExploreCardCell when `spotCount > 0`
- Set up jsdom + @testing-library/react component test infrastructure (new to project)
- 4 unit tests passing: badge visible (count=5), absent (count=0), absent (undefined), editorial overlay regression guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — ExploreCardCell 테스트 스캐폴드 작성 (RED)** - `12feef89` (test)
2. **Task 2: spotCount 데이터 매핑 + 타입 확장 + 배지 UI 구현 (GREEN)** - `567fc824` (feat)
3. **Task 3: TypeScript 타입체크 + 빌드 검증** - `0909f470` (chore)

## Files Created/Modified

- `packages/web/lib/components/explore/__tests__/ExploreCardCell.test.tsx` — 4 unit tests for badge pill rendering
- `packages/web/lib/components/ThiingsGrid.tsx` — added `spotCount?: number` to GridItem type
- `packages/web/lib/hooks/useImages.ts` — `spotCount: 0` → `post.spot_count ?? 0`
- `packages/web/app/explore/ExploreClient.tsx` — conditional spread `spotCount` in gridItems useMemo
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — badge pill JSX (top-right, z-10)
- `packages/web/vitest.config.ts` — add `lib/**/__tests__/**/*.test.tsx` to include glob
- `packages/web/package.json` — add `test` script alias + @testing-library/* + jsdom devDeps

## Decisions Made

- Used `@vitest-environment jsdom` docblock in test file rather than `environmentMatchGlobs` in config — TypeScript doesn't recognize that option in vitest v4.1.1
- ExploreClient uses conditional spread `item.spotCount > 0` so that `spotCount=0` items don't get `spotCount: 0` in GridItem (undefined means no badge, cleaner than checking `> 0` in two places)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @testing-library/react, @testing-library/jest-dom, jsdom**
- **Found during:** Task 1 (test scaffold)
- **Issue:** Project had no DOM testing infrastructure; vitest config only included `tests/**/*.test.ts`
- **Fix:** `bun add -d @testing-library/react @testing-library/jest-dom jsdom`; updated vitest.config.ts include glob; added `test` script alias to package.json
- **Files modified:** package.json, bun.lock, vitest.config.ts
- **Verification:** Tests run with jsdom environment, 4 tests pass
- **Committed in:** 12feef89 (Task 1 commit)

**2. [Rule 1 - Bug] Removed invalid environmentMatchGlobs from vitest config**
- **Found during:** Task 3 (typecheck)
- **Issue:** `environmentMatchGlobs` is not a recognized TypeScript property in this vitest version; caused a TS2769 type error
- **Fix:** Removed the option; use `@vitest-environment jsdom` docblock in test file instead
- **Files modified:** packages/web/vitest.config.ts
- **Verification:** `bun run typecheck` shows 0 new errors from my changes
- **Committed in:** 0909f470 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking infra setup, 1 bug fix)
**Impact on plan:** Both auto-fixes necessary for test infrastructure to work. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors (58 total) from generated API files not present in this worktree — these are not caused by this plan's changes and exist on the branch. None are in the 4 modified source files.

## Next Phase Readiness

- ExploreCardCell spotCount badge is live
- Component test infrastructure (jsdom + testing-library) is now available for future UI tests
- The `lib/components/**/__tests__/*.test.tsx` pattern is established

---
*Phase: 54-card-enrichment*
*Completed: 2026-04-02*
