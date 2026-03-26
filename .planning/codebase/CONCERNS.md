# Codebase Concerns

**Analysis Date:** 2026-03-26

## Executive Summary

The codebase has grown into a multi-service monorepo with a Next.js 16 frontend, Rust/Axum backend, and Python AI server — significantly more complex than the initial analysis. The architecture is well-structured with clear separation of concerns and solid patterns. However, several technical debt items and fragile patterns exist that should be addressed for production stability. Primary concerns involve test coverage (infrastructure configured but unused), missing CI/CD pipeline, error handling consistency, component complexity in large UI files, state management validation, bundle size monitoring, and upstream external API dependencies.

---

## Tech Debt

### 1. Large Component Files Nearing Complexity Limits

**Issue:** Several UI components exceed 900+ lines of code with complex state management and animation logic intertwined.

**Files:**
- `packages/web/lib/components/ThiingsGrid.tsx` (948 lines) - Custom grid physics engine with scroll handling
- `packages/web/lib/components/DecodedLogo.tsx` (764 lines) - Three.js + ASCII filter rendering
- `packages/web/lib/components/detail/ImageDetailContent.tsx` (671 lines) - Multi-section layout with interactive showcase
- `packages/web/lib/components/detail/ImageDetailModal.tsx` (637 lines) - GSAP animations, drawer state, scroll forwarding

**Impact:**
- High cognitive load for modifications
- Animation logic tightly coupled with component rendering
- Difficult to test individual features
- Refactoring carries high regression risk

**Fix approach:**
- Extract animation logic to custom hooks (`useGSAPAnimation`, `useDrawerAnimation`)
- Create smaller presentational components from sections
- Move physics engine to separate utility class for `ThiingsGrid`
- Separate concerns: rendering, animation, state management

### 2. Debug Logging Left in Production Code

**Issue:** `ImageDetailModal.tsx` (lines 40-50) contains debug logging that should be removed or wrapped in development-only guards.

```typescript
useEffect(() => {
  if (imageId) {
    console.log("[ImageDetailModal] imageId:", imageId);
  }
  if (image) {
    console.log("[ImageDetailModal] image loaded:", image);
  }
  if (error) {
    console.error("[ImageDetailModal] error:", error);
  }
}, [imageId, image, error]);
```

**Impact:**
- Verbose console output in production
- Information leakage about internal state
- Makes debugging harder, not easier

**Fix approach:**
- Use `process.env.NODE_ENV === 'development'` guards
- Consider using proper logging library (winston, pino) with log levels
- Remove or centralize debug logging at build time

### 3. Inconsistent API Proxy Error Handling

**Issue:** API proxy routes (`/app/api/v1/**`) have inconsistent error handling:
- Some routes validate `API_BASE_URL`, others don't
- All routes return generic 500 without forwarding the backend's structured error codes
- Backend errors (validation, auth, rate limit) get swallowed at the proxy layer

**Files:**
- `packages/web/app/api/v1/posts/route.ts` (lines 20-24, 49-53)
- `packages/web/app/api/v1/users/me/route.ts` (likely similar pattern)

**Impact:**
- Inconsistent error contract makes debugging harder
- Backend errors get swallowed (validation, auth, rate limit)
- Difficult to distinguish client vs server errors

**Fix approach:**
- Create middleware for env validation and error formatting
- Parse backend error responses and forward structured errors
- Use consistent HTTP status codes (401 for auth, 422 for validation, 429 for rate limits)

### 4. STACK.md Version Drift

**Severity:** Low

**Issue:** `STACK.md` documented yarn 4.9.2 as the package manager, but the actual runtime is bun 1.3.10. Documentation was stale and misrepresented the toolchain.

**Impact:**
- New developers install the wrong package manager
- CI/CD scripts built from docs may use wrong commands
- Erodes trust in documentation accuracy

**Fix approach:**
- Treat STACK.md as a living document; update on every toolchain change
- Add a linting step or checklist item that cross-references `package.json` engines field with STACK.md on each PR

---

## Fragile Areas

### 1. State Machine Complexity in RequestStore

**Issue:** `requestStore.ts` (433 lines) manages 4-step request flow with complex state transitions.

**Fragile patterns:**
- Step transitions triggered by side effects (lines 268-320): `startDetection()` sets `currentStep: 2`
- No guard against invalid state transitions (can set step 4 without completing steps 1-3)
- `setTimeout(() => { set({ isRevealing: false }) }, 1500)` (line 308) magic timeout for animation
- Multiple state update sources (UI components, API responses, timers)

**Example fragile scenario:**
```
User skips Step 2 → Step 3 UI rendered with no detected spots
  or
User navigates away → setTimeout still updates unmounted store
```

**Fix approach:**
- Implement state machine (xstate) with explicit transitions
- Make step advancement guarded by conditions
- Replace setTimeout with properly cleaned AbortController
- Add validation on state updates

### 2. Memory Leaks in Image URL Management

**Issue:** `createPreviewUrl()` and `revokePreviewUrl()` in `requestStore.ts` (lines 206, 223) use `URL.createObjectURL()`.

**Fragile scenarios:**
- User navigates away before `clearImages()` called → Preview URL leaked
- Component unmount during image removal → revoke() doesn't execute
- Error during upload → cleanup skipped
- Multiple rapid uploads → revoke race conditions

**Fix approach:**
- Wrap URL.createObjectURL in try-finally
- Use React useEffect cleanup to guarantee revoke on unmount
- Add tracking of all created URLs with warning if leaked

### 3. GSAP Context Management in Modal

**Issue:** `ImageDetailModal.tsx` (lines 282-321) creates GSAP context in useEffect without guaranteed cleanup.

**Fragile scenario:**
```
User opens modal → GSAP context created
  ↓
Navigation happens → useEffect cleanup runs → revert() called
  ↓
New component mounts while animations still running → conflicts
```

**Fix approach:**
- Use useGSAP hook from @gsap/react consistently
- Ensure animations complete or are killed on unmount
- Test rapid open/close cycles

### 4. Scroll Forwarding Implementation Incomplete

**Issue:** `ImageDetailModal.tsx` (lines 52-63) has scroll forwarding logic that's partially implemented.

```typescript
useEffect(() => {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  if (!isDesktop || !floatingImageRef.current || !scrollContainerRef.current)
    return;

  // Use a wrapper or the floating image ref itself if it's the ImageCanvas container
  // Since we're rendering ImageCanvas in the "floating" area, we need to target its container
  // However, floatingImageRef currently points to an <img> tag.
  // We'll update the render logic to use a container for the Left Side Image.
}, []);
```

**Impact:**
- Desktop users can't scroll content by scrolling over image
- Incomplete implementation suggests missing test coverage

**Fix approach:**
- Complete scroll forwarding implementation
- Test scroll behavior on desktop/mobile
- Document expected behavior

---

## Performance Bottlenecks

### 1. ThiingsGrid Component - Physics Engine Overhead

**Issue:** Custom grid implementation with physics simulation runs on every scroll/resize.

**File:** `packages/web/lib/components/ThiingsGrid.tsx` (lines 6-14 constants)

```typescript
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
```

**Impact:**
- High frame rate requirement (16ms = 60fps target)
- On lower-end devices, scrolling may jank
- Large number of DOM nodes (MAX_RENDER_CELLS = 300) impact layout
- Not yet profiled on mid-range Android or other lower-end hardware

**Fix approach:**
- Profile with DevTools to identify bottlenecks
- Consider virtualization further up the scroll
- Add frame rate adaptive tuning
- Test on lower-end devices (e.g., mid-range Android)

### 2. Bundle Size Not Monitored

**Severity:** Medium

**Issue:** Heavy dependencies are included without lazy loading or bundle size enforcement.

**Affected areas:**
- Three.js (`DecodedLogo.tsx`) adds significant bundle weight
- GSAP loaded globally rather than per-route
- Full icon sets (lucide-react, react-icons) without tree-shaking verification
- No `bundlesize` or `size-limit` integration in CI

**Impact:**
- Initial page load likely heavier than necessary
- No visibility into regressions when adding new dependencies
- Mobile users on slow connections disproportionately affected

**Fix approach:**
- Add `size-limit` or `bundlesize` check to CI
- Lazy-load Three.js and GSAP at route level
- Audit icon imports; import individual icons rather than full packages

### 3. Coordinate Conversion Overhead

**Issue:** `apiToStoreCoord()` and `storeToApiCoord()` called frequently during rendering.

**Files:**
- `packages/web/lib/api/types.ts` (lines 189-198)
- `packages/web/lib/stores/requestStore.ts` (lines 127-140 usage)

**Impact:**
- Math operations repeated for every item render
- No memoization of converted coordinates

**Fix approach:**
- Convert once during data fetch, store normalized values
- Memoize coordinate transforms in custom hooks
- Consider typed wrapper class instead of raw numbers

---

## Dependency Risks

### 1. External API_BASE_URL Configuration Risk

**Issue:** Two different env var names used for same purpose:
- Browser: `NEXT_PUBLIC_API_BASE_URL` (`packages/web/lib/api/posts.ts`, line 20)
- Server: `API_BASE_URL` (`packages/web/app/api/v1/posts/route.ts`, line 11)

**Risk:**
- Easy to misconfigure - set one and not the other
- Default empty string means silent failures instead of loud errors
- Different values could cause API inconsistencies

**Files:**
- `packages/web/lib/api/posts.ts` (line 20): Defaults to empty string
- `packages/web/app/api/v1/posts/route.ts` (line 11): Checks but defaults to empty

**Fix approach:**
- Standardize to single env var name
- Throw error at build time if missing
- Create `lib/config/api.ts` with validated configuration

### 2. Three.js / WebGL No Fallback

**Severity:** Low

**Issue:** `DecodedLogo.tsx` uses Three.js with WebGL rendering. There is no WebGL capability detection and no SVG fallback for environments where WebGL is unavailable (in-app browsers, WebViews, older Android WebKit).

**Files:**
- `packages/web/lib/components/DecodedLogo.tsx` (lines 67-140+)

**Risk:**
- Blank or broken logo in in-app browsers (Instagram, LINE, KakaoTalk)
- No error boundary means a Three.js crash propagates up the tree
- Memory leaks possible if canvas not cleaned up on unmount

**Fix approach:**
- Add WebGL capability detection (`canvas.getContext('webgl')`)
- Provide SVG or static image fallback for unsupported browsers
- Wrap in error boundary

### 3. Zustand Store Serialization Risk

**Issue:** `requestStore.ts` stores complex objects (DetectedSpot, File objects, etc.) without serialization strategy.

**Risk:**
- File objects in state can't be persisted
- Zustand default persistence would fail
- No clear serialization for debugging

**Fix approach:**
- Document what's serializable vs. not
- If persistence needed, implement custom serializer
- Consider extracting file IDs only, load from IndexedDB

---

## Testing Gaps

### Critical Untested Paths

**Test framework is configured but no actual tests have been written.**

1. **API proxy error handling** - No tests for backend error propagation
   - What if backend returns 400? Does it propagate to client?
   - What if backend times out?

2. **Image upload flow** - No tests for happy path or error cases
   - Compression failure scenarios
   - Storage upload retry logic
   - Progress tracking accuracy

3. **Modal animation sequences** - No tests for GSAP animations
   - Open → Close → Reopen cycles
   - Escape key handling during animation
   - Maximize button during animation

4. **Coordinate system conversions** - No tests for API ↔ Store conversions
   - Edge cases (0%, 100%, decimal precision)
   - Floating point rounding errors

5. **Auth store state transitions** - No tests for OAuth flow
   - Session check on init
   - Error recovery
   - Guest login vs. authenticated state

6. **RequestStore step transitions** - No tests for state machine
   - Can only advance steps in order?
   - What if user goes back?
   - Timeout handling on unmount

### Test Framework Configured but Unused

- **Test framework:** Vitest 4.1 and Playwright 1.58 are listed in `package.json` — infrastructure exists
- **Test files:** Zero test files present in codebase — infrastructure is entirely unused
- **Mocking:** No mock factories for API responses, Supabase
- **Test coverage:** 0% meaningful coverage

**Recommended additions:**
```bash
packages/web/__tests__/
├── api/
│   ├── posts.test.ts         # API client tests
│   └── types.test.ts         # Coordinate conversion tests
├── stores/
│   ├── requestStore.test.ts  # State machine validation
│   └── authStore.test.ts     # OAuth flow
├── hooks/
│   ├── useImageUpload.test.ts
│   └── useSearch.test.ts
└── components/
    └── ThiingsGrid.test.tsx  # Grid physics
```

---

## Security Considerations

### 1. Console Error Output May Expose Sensitive Info

**Issue:** Error messages logged to console include potentially sensitive details.

**Files:**
- `packages/web/lib/stores/authStore.ts` (lines 77, 92)
- `packages/web/app/api/v1/posts/route.ts` (lines 20, 49, 64, 100)

**Example:**
```typescript
console.error("Failed to get session:", error);  // May include token/auth details
console.error("Posts GET proxy error:", error);  // May include backend URLs
```

**Risk:**
- Sensitive information visible in browser console
- Can be captured by user analytics tools
- Replay attacks if error logs include URLs

**Fix approach:**
- Never log full error objects in production
- Log structured errors without sensitive details
- Use error tracking service with proper sanitization

### 2. Missing Rate Limiting on Public Endpoints

**Issue:** `POST /api/v1/posts/analyze` doesn't require authentication and has no rate limiting.

**Risk:**
- DoS attacks via repeated analysis requests
- Uncontrolled backend API costs
- No visibility into abuse patterns

**Files:**
- `packages/web/app/api/v1/posts/analyze/route.ts`

**Fix approach:**
- Add authentication requirement
- Implement rate limiting middleware
- Consider backend rate limits and request quotas

### 3. Image URL Exposure in Unencrypted Form

**Issue:** Image URLs stored in Supabase and passed in API responses without encryption.

**Files:**
- `packages/web/lib/supabase/types.ts` (image_url fields)
- API response types

**Risk:**
- URLs predictable if stored with sequential naming
- Metadata leakage about which items are in which images
- No expiring URLs (if using public storage)

**Fix approach:**
- Use signed/expiring URLs from Supabase
- Consider obfuscating file names
- Add access control checks for sensitive images

---

## Data Consistency Risks

### 1. Image Upload URL Mutation During Retry

**Issue:** `setImageUploadedUrl()` in `requestStore.ts` (lines 246-258) updates URL if retry happens.

**Fragile scenario:**
```
User uploads image → uploadedUrl = "https://storage.../image-1"
  ↓
AI detection starts using image-1
  ↓
User clicks retry → uploadedUrl = "https://storage.../image-1-retry"
  ↓
Detection reference now points to wrong image
```

**Fix approach:**
- Never mutate uploaded URL during retry
- Keep detection reference separate from upload state
- Use unique detection session IDs

### 2. Spot Coordinate Mutation Risk

**Issue:** `setDetectedSpots()` in `requestStore.ts` (line 322) accepts spots without immutability guarantee.

```typescript
setDetectedSpots: (spots) => {
  set({ detectedSpots: spots });
},
```

**Risk:**
- Caller could mutate spot objects after setting
- Store doesn't prevent coordinate changes
- Can cause rendering artifacts

**Fix approach:**
- Deep clone spots on store update
- Add readonly modifier to coordinate objects
- Use Immer middleware in Zustand for immutability

---

## Environmental Concerns

### 1. Missing `.env.local.example` Documentation

**Issue:** `.env.local.example` may not document all required variables clearly.

**Required variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `API_BASE_URL` (backend URL for server-side)
- `NEXT_PUBLIC_API_BASE_URL` (browser-side, if different)

**Risk:**
- New developers miss environment setup
- Hard-to-debug failures when variables missing

**Fix approach:**
- Create `.env.local.example` with all variables
- Add script to validate env vars on startup
- Document purpose of each variable

### 2. TypeScript Strict Mode Checks

**Issue:** Build compiles successfully but TypeScript may have loose checking in some areas.

**Risk:**
- Type errors slip through, caught only at runtime
- `any` types may hide bugs

**Fix approach:**
- Verify `tsconfig.json` has strict mode enabled
- Run `tsc --noEmit` in CI/CD
- Add pre-commit hook to check types

---

## CI/CD and Infrastructure Gaps

### 1. No CI/CD Pipeline

**Severity:** Critical

**Issue:** No GitHub Actions workflows or equivalent CI/CD configuration detected in the repository. There is no automated build, test, or deploy pipeline.

**Impact:**
- PRs can be merged without passing type checks or lint
- No automated test execution (even once tests are written)
- Deploy process is entirely manual — error-prone
- No visibility into build health over time

**Fix approach:**
- Add `.github/workflows/ci.yml` with: install, type-check, lint, test, build
- Gate PR merges on CI passing
- Add a separate deploy workflow triggered on merge to `main`
- Consider Turborepo's remote caching for faster CI runs

---

## Monitoring Gaps

### 1. No Error Tracking or Observability

**Issue:** Errors logged to console only; no centralized error tracking.

**Missing:**
- Error tracking service (Sentry, LogRocket, etc.)
- Error reporting pipeline
- Performance monitoring

**Impact:**
- Production errors invisible to team
- Can't track error trends or regression patterns
- Difficult to prioritize fixes

**Fix approach:**
- Integrate Sentry or similar service
- Add performance monitoring (Web Vitals)
- Set up error alerts for critical endpoints

### 2. No Upload Metrics Collection

**Issue:** Image uploads have no instrumentation or metrics.

**Missing:**
- Upload success/failure rates
- Compression effectiveness tracking
- AI analysis latency metrics
- Storage usage metrics

**Impact:**
- Can't optimize upload performance
- Can't track user issues with uploads
- Can't predict storage costs

---

## Deployment Considerations

### 1. Build Size Not Monitored

**Issue:** No bundle size analysis or enforcement in CI.

**Risk:**
- Component libraries bundled entirely (lucide-react, react-icons)
- Three.js (DecodedLogo) adds significant size
- No tree-shaking verification

**Fix approach:**
- Add bundle size analysis to CI (e.g., bundlesize, size-limit)
- Profile with next/image optimization
- Lazy load heavy components (Three.js, GSAP)

### 2. Missing Graceful Degradation for Missing Features

**Issue:** Some features have no fallback if dependencies fail.

**Examples:**
- ThiingsGrid.physics requires high frame rate
- DecodedLogo requires WebGL
- GSAP animations may fail on older browsers

**Fix approach:**
- Add feature detection for each heavy dependency
- Provide lightweight alternatives
- Test on minimum supported browser versions

---

## Recommendations Priority

### Critical
1. **Add test coverage** - Framework (Vitest 4.1, Playwright 1.58) exists; zero tests written
2. **Implement rate limiting** on `POST /api/v1/posts/analyze`
3. **Set up CI/CD pipeline** - No automated build/test/deploy exists
4. **Fix environment variable validation** - Prevent misconfiguration silent failures

### High
1. **Refactor large components** - ThiingsGrid (948 lines), DecodedLogo (764 lines), etc.
2. **Fix state machine transitions** in RequestStore - Prevent invalid step combinations
3. **Add error tracking** (Sentry or equivalent) - Gain production visibility
4. **Remove debug logging** from production code

### Medium
1. **Fix memory leak risk** with URL.createObjectURL - Add proper cleanup
2. **Add GSAP safety guards** - Ensure animations clean up on unmount
3. **Monitor bundle size** - Add size-limit to CI; lazy-load Three.js and GSAP
4. **Standardize API proxy error handling** - Forward backend structured errors; validate API_BASE_URL consistently

### Low
1. **Add WebGL fallback** - SVG or static image fallback for in-app browsers
2. **Optimize lazy loading** for heavy dependencies
3. **Add Web Vitals monitoring** - Track user experience over time
4. **Profile ThiingsGrid on low-end devices** - Validate physics engine on mid-range Android

---

*Concerns audit: 2026-03-26*
*Analysis scope: 250+ TS/TSX files across Next.js frontend, Rust/Axum backend, Python AI server; 9 major store/API/proxy layers, 4 complex UI components reviewed*
