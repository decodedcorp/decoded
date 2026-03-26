# Phase 48: Test Coverage - Research

**Researched:** 2026-03-26
**Domain:** Vitest unit tests, Playwright E2E tests, data-testid markup
**Confidence:** HIGH

## Summary

Phase 48 closes the final gap in v10.0 by adding automated test coverage across two layers: Vitest unit tests for pure logic extracted during Phase 46 refactoring, and Playwright E2E tests for the critical user flows (login, navigation, AI analysis pipeline). A third workstream adds `data-testid` attributes to the four refactored component trees so E2E selectors are stable.

REQUIREMENTS.md has a naming mismatch: the phase says "TEST-01, TEST-02, TEST-03" but those IDs in the requirements file refer to v10.1+ extended scenarios (Docker Compose, cross-browser, mobile touch). The actual pending requirements for Phase 48 per the Traceability table are **REF-05, E2E-01, E2E-02, E2E-03, E2E-04**. Plans must address those five IDs.

The test infrastructure is already installed: Vitest 4.1.1 (`bun run test:unit`) and @playwright/test 1.58.1 (`bun run test:visual`). The Playwright config still references `yarn dev` and has no auth fixture — both must be fixed. Because this worktree cannot run a dev server, E2E tests must be written with `webServer` configured for `bun dev` but structured to run later when merged to main.

**Primary recommendation:** Fix playwright.config.ts (yarn → bun), build a Supabase REST-based storageState auth fixture, write Vitest unit tests for ThiingsGridPhysics pure functions and useVtonItemFetch, then write Playwright E2E tests for login + main-page navigation + AI upload pipeline — all with `data-testid` selectors added to the target components.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REF-05 | 분리된 컴포넌트에 data-testid 속성 추가 (E2E 테스트 대상 마킹) | Sections: data-testid conventions, component inventory |
| E2E-01 | playwright.config.ts 수정(yarn→bun) + Supabase REST API 기반 storageState 인증 픽스처 구축 | Sections: Playwright config fixes, auth fixture pattern |
| E2E-02 | 로그인 플로우 + 메인 페이지 네비게이션 E2E 테스트 작성 | Sections: E2E test patterns, auth storageState usage |
| E2E-03 | AI 이미지 분석 파이프라인 E2E 테스트 (업로드 → 분석 → 결과 표시) | Sections: E2E patterns, file upload in Playwright |
| E2E-04 | 핵심 인터랙티브 컴포넌트에 data-testid 마킹 | Sections: data-testid conventions |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.1 (installed) | Unit/integration test runner | Already configured, fast, ESM-native |
| @playwright/test | 1.58.1 (installed) | E2E browser automation | Already installed, config exists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2.86.0 (installed) | Auth token exchange for storageState | Auth fixture only — call `signInWithPassword` to get session |
| vitest globals | built-in | `describe`, `test`, `expect`, `vi` | globals: true already set in vitest.config.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase REST for auth fixture | OAuth popup flow in Playwright | REST is headless, no browser dependency, faster |
| data-testid attributes | aria-label / role selectors | data-testid is explicit, survives CSS/text refactors |

**No new installations required.** Both test frameworks are present. Supabase JS client is present.

## Architecture Patterns

### Recommended Project Structure
```
packages/web/
├── tests/
│   ├── zod-validation.test.ts          # EXISTS — Vitest, Zod schema validation
│   ├── visual-qa.spec.ts               # EXISTS — Playwright screenshot tests
│   ├── physics.test.ts                 # NEW — ThiingsGridPhysics pure functions (Vitest)
│   ├── hooks.test.ts                   # NEW — useVtonItemFetch, dataUrlToBlob (Vitest, node env)
│   ├── auth.setup.ts                   # NEW — Playwright storageState fixture
│   ├── login.spec.ts                   # NEW — Login flow E2E
│   ├── navigation.spec.ts              # NEW — Main page nav E2E
│   └── ai-pipeline.spec.ts             # NEW — Upload → analyze → result E2E
├── playwright.config.ts                # MODIFY — yarn→bun, add auth project
└── vitest.config.ts                    # NO CHANGE needed
```

### Pattern 1: Vitest — Pure Function Unit Tests (node environment)
**What:** Test ThiingsGridPhysics utility functions and pure hooks that have no DOM/React dependency
**When to use:** Exported functions from `ThiingsGridPhysics.ts` — `debounce`, `throttle`, `getDistance`, `ThiingsGridPhysics` class constructor/spiral math

```typescript
// File: tests/physics.test.ts
import { describe, test, expect, vi } from 'vitest';
import { debounce, throttle, getDistance } from '@/lib/components/ThiingsGridPhysics';

describe('getDistance', () => {
  test('returns 0 for same point', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });
  test('returns 5 for 3-4-5 triangle', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('debounce', () => {
  test('delays execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
```

Note: `vitest.config.ts` uses `environment: 'node'` — pure function tests run without DOM. Hooks requiring DOM (`useVtonScrollLock`, `useAdoptDropdown`) should be skipped from unit tests since they depend on browser APIs and React; they are covered by E2E tests instead.

### Pattern 2: Vitest — useVtonItemFetch with fetch mock
**What:** Mock `fetch` globally via `vi.stubGlobal` in a node environment test

```typescript
// File: tests/hooks.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { dataUrlToBlob } from '@/lib/hooks/useVtonTryOn';

// dataUrlToBlob is a pure async function with no DOM import at module level
describe('dataUrlToBlob', () => {
  test('converts data URL to blob with correct mime type', async () => {
    // minimal 1x1 transparent PNG base64
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});
```

**Constraint:** `useVtonItemFetch` uses `useEffect` — it requires a DOM environment to test. The vitest config uses `environment: 'node'`. To test this hook, either change the test environment to `jsdom` for specific test files (via vitest `@vitest-environment jsdom` inline comment) or skip and rely on E2E. Recommended: use inline environment directive for any hook test that needs DOM.

```typescript
// @vitest-environment jsdom
// File: tests/vton-item-fetch.test.ts
```

However, jsdom is not in package.json devDependencies. The simpler path: test only the pure exported functions (debounce, throttle, getDistance, dataUrlToBlob) in node environment, and cover hook behavior via Playwright E2E.

### Pattern 3: Playwright — auth.setup.ts with storageState
**What:** Create a Playwright global setup project that exchanges Supabase credentials for a session, writes `storageState.json`, other projects depend on it.

```typescript
// File: tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE_PATH = path.join(__dirname, '../.playwright/storageState.json');

setup('authenticate', async ({ page }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  });
  if (error || !data.session) throw new Error(`Auth failed: ${error?.message}`);

  // Inject the Supabase session cookies into Playwright context
  const cookieStr = data.session.access_token;
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('sb-access-token', token);
  }, cookieStr);

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
```

**Important:** Supabase uses localStorage for session storage in the browser, not cookies. The correct pattern is to navigate to the app, inject the session into localStorage using the Supabase session format, then save storageState. The exact localStorage key depends on the Supabase project URL hash — it follows `sb-{project-ref}-auth-token`.

### Pattern 4: Playwright — playwright.config.ts fixes
**What:** Update webServer command from `yarn dev` to `bun dev`, add auth setup project

```typescript
// playwright.config.ts — key changes
export default defineConfig({
  // ... existing config ...
  use: {
    baseURL: 'http://localhost:3000',
    // authenticated tests load storage state
  },
  projects: [
    // Setup project runs first
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Main test project depends on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/storageState.json',
      },
      dependencies: ['setup'],
    },
    // Unauthenticated project for login page test
    {
      name: 'chromium-no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'bun dev',     // WAS: 'yarn dev'
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

### Pattern 5: data-testid Conventions
**What:** Add `data-testid` attributes to interactive elements in the four refactored component trees.

Naming convention: `{component}-{element}` in kebab-case

```
VtonModal:
  data-testid="vton-modal"
  data-testid="vton-photo-area"
  data-testid="vton-item-panel"
  data-testid="vton-try-on-button"
  data-testid="vton-result-image"

ItemDetailCard:
  data-testid="item-detail-card"
  data-testid="item-adopt-button"
  data-testid="item-solutions-list"

ImageDetailModal:
  data-testid="image-detail-modal"
  data-testid="image-detail-close"
  data-testid="image-detail-image"

ThiingsGrid:
  data-testid="thiings-grid"
  data-testid="thiings-grid-item"  (on individual items)
```

### Anti-Patterns to Avoid
- **Using text selectors for E2E:** `page.getByText('Try On')` breaks when copy changes. Use `data-testid` instead.
- **Using CSS class selectors:** Tailwind class names are utility-only and can change. Never use `.vton-button`.
- **Testing GSAP animation timing:** Do not assert CSS transform values or animation states. Only assert final DOM presence/visibility.
- **Running E2E tests with live backend:** The AI pipeline test must use Playwright's `page.route()` to mock the `/api/v1/posts/analyze` endpoint — it should never call the real AI backend in tests.
- **Importing React hooks in Vitest node environment:** `useEffect`, `useRef`, etc. will throw "document is not defined". Test only pure functions in node env.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session for Playwright | Custom cookie manipulation | Supabase JS `signInWithPassword` → storageState | Official pattern, handles session refresh |
| Fake timers for debounce tests | `setTimeout` mocking manually | `vi.useFakeTimers()` / `vi.advanceTimersByTime()` | Vitest built-in, synchronous control |
| HTTP mocking in E2E | Express mock server | `page.route('/api/v1/*', handler)` | Playwright built-in, no extra process |
| Browser environment in Vitest | Custom test utilities | `@vitest-environment jsdom` inline directive | Vitest built-in per-file override |

**Key insight:** All test infrastructure primitives are already available. No new libraries needed.

## Common Pitfalls

### Pitfall 1: Supabase localStorage Key Format
**What goes wrong:** Injecting `sb-access-token` into localStorage won't work — Supabase uses a compound key.
**Why it happens:** The key is `sb-{project-ref}-auth-token` where `project-ref` is derived from the Supabase URL.
**How to avoid:** Use `supabase.auth.setSession()` via `page.evaluate()` after navigating to the app, which writes the correct key automatically:
```typescript
await page.evaluate(async (session) => {
  const { createClient } = await import('@/lib/supabase/client');
  // OR: use window.__supabase if exposed, or reproduce the key pattern
}, session);
```
Alternatively, use the Playwright `page.context().addCookies()` approach if the app uses cookie-based auth (check `packages/web/lib/supabase/client.ts`).
**Warning signs:** E2E test navigates to `/profile` but gets redirected to `/login`.

### Pitfall 2: vitest.config.ts environment: 'node' vs 'jsdom'
**What goes wrong:** Importing a hook file that has `"use client"` or uses `document`/`window` in module scope will crash in node environment.
**Why it happens:** `useVtonTryOn.ts` imports `navigator.clipboard`, `useImageModalAnimation.ts` imports `gsap` which accesses window.
**How to avoid:** Only import pure exports in node-env tests. Use `// @vitest-environment jsdom` inline comment for any test file needing DOM. Note: jsdom package must be in devDeps (`bun add -D jsdom`).
**Warning signs:** `ReferenceError: document is not defined` or `ReferenceError: window is not defined`.

### Pitfall 3: Playwright webServer timing in worktree
**What goes wrong:** Running `bun run test:visual` in this worktree fails because `node_modules` is not linked.
**Why it happens:** This is a git worktree — `node_modules` are in the main tree, not the worktree.
**How to avoid:** E2E tests in this phase are written but validated post-merge. The `reuseExistingServer: true` setting means tests use whatever server is already running. Tests should be CI-ready but not run during worktree development.
**Warning signs:** `Error: browserType.launch: Executable doesn't exist`.

### Pitfall 4: AI pipeline test calls real backend
**What goes wrong:** E2E-03 test uploads an image and the real AI backend gets called, which is expensive and flaky.
**Why it happens:** No network interception set up.
**How to avoid:** Use `page.route('/api/v1/posts/analyze', async route => { await route.fulfill({ body: JSON.stringify(mockResult) }); })` to intercept the fetch before it leaves the browser.
**Warning signs:** Test timeout at AI analysis step, actual Replicate credits consumed.

### Pitfall 5: REF-05 vs E2E-04 scope confusion
**What goes wrong:** Adding data-testid to every element in the codebase instead of just the four refactored component trees.
**Why it happens:** Unclear scope boundaries.
**How to avoid:** REF-05/E2E-04 scope is limited to: `VtonModal` + `VtonPhotoArea` + `VtonItemPanel`, `ItemDetailCard`, `ImageDetailModal`, `ThiingsGrid`. Total target: ~10-15 testid attributes, not a full-app marking exercise.

## Code Examples

### ThiingsGridPhysics Pure Function Tests
```typescript
// Source: ThiingsGridPhysics.ts — exported utilities
// tests/physics.test.ts
import { describe, test, expect, vi } from 'vitest';
import { debounce, throttle, getDistance } from '@/lib/components/ThiingsGridPhysics';

describe('getDistance', () => {
  test('returns 0 for identical points', () => {
    expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
  test('returns correct Euclidean distance', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('debounce', () => {
  test('fires callback after delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const dFn = debounce(fn, 200);
    dFn(); dFn(); dFn();
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  test('cancel prevents execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const dFn = debounce(fn, 200);
    dFn();
    dFn.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('throttle', () => {
  test('fires immediately on first call (leading: true)', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const tFn = throttle(fn, 100, { leading: true, trailing: false });
    tFn();
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
```

### Playwright Login E2E
```typescript
// tests/login.spec.ts — no auth dependency (unauthenticated project)
import { test, expect } from '@playwright/test';

test('login page renders OAuth button', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
});
```

### Playwright Navigation E2E (authenticated)
```typescript
// tests/navigation.spec.ts — uses storageState
import { test, expect } from '@playwright/test';

test('main page loads and nav is visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Uses data-testid added by REF-05/E2E-04
  await expect(page.locator('[data-testid="thiings-grid"]')).toBeVisible();
});

test('navigating to images page shows grid', async ({ page }) => {
  await page.goto('/images');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/images');
});
```

### Playwright AI Pipeline E2E (mocked backend)
```typescript
// tests/ai-pipeline.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test('AI analyze pipeline: upload → mocked analysis → result display', async ({ page }) => {
  // Mock the AI endpoint — never call real backend in tests
  await page.route('**/api/v1/posts/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'mock-1', label: 'Dress', confidence: 0.95 }],
      }),
    });
  });

  await page.goto('/request/upload');
  // Upload a test image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test-image.jpg'));
  // Proceed to detect step
  await page.getByRole('button', { name: /analyze/i }).click();
  // Assert result appears (uses data-testid on result container)
  await expect(page.locator('[data-testid="analyze-result"]')).toBeVisible({ timeout: 10000 });
});
```

Note: A small `tests/fixtures/test-image.jpg` must be committed alongside the spec.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `yarn dev` in playwright.config.ts | `bun dev` | v8.0 Bun migration | Must update config or tests won't start |
| No auth fixture | storageState pattern (Playwright v1.20+) | Playwright 1.20+ | Authenticated tests without UI login flow |
| Monolithic component testing | Unit-test extracted hooks/utilities | Phase 46 refactoring | ThiingsGridPhysics pure functions are now independently testable |

**Deprecated/outdated:**
- `yarn` commands: replaced by `bun` across the entire monorepo since v8.0. The playwright.config.ts is the only remaining `yarn` reference.

## Open Questions

1. **Supabase session injection method**
   - What we know: Supabase JS stores session in localStorage with key `sb-{ref}-auth-token`; the exact project ref is in `NEXT_PUBLIC_SUPABASE_URL`
   - What's unclear: Whether the app uses `@supabase/auth-helpers-nextjs` cookie-based sessions (SSR) or pure client-side localStorage
   - Recommendation: Read `packages/web/lib/supabase/client.ts` during planning to confirm session storage method before writing auth.setup.ts

2. **TEST image fixture for AI pipeline test**
   - What we know: Playwright `setInputFiles` requires a real file path
   - What's unclear: Whether a small JPEG fixture should be committed to `tests/fixtures/` or generated programmatically
   - Recommendation: Commit a minimal 50x50 JPEG (< 5KB) as `tests/fixtures/test-image.jpg`

3. **CONTEXT.md existence**
   - No CONTEXT.md was found for Phase 48 — no locked user decisions constrain this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + @playwright/test 1.58.1 |
| Config file | `packages/web/vitest.config.ts` (Vitest), `packages/web/playwright.config.ts` (Playwright) |
| Quick run command | `cd packages/web && bun run test:unit` |
| Full suite command | `cd packages/web && bun run test:unit && bun run test:visual` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REF-05 | data-testid attributes on 4 component trees | manual audit | `grep -r data-testid packages/web/lib/components/{thiings,vton,detail}` | ❌ Wave 0 |
| E2E-01 | Playwright config uses bun + storageState auth fixture | smoke | `cd packages/web && bun run test:visual tests/auth.setup.ts` (post-merge) | ❌ Wave 0 |
| E2E-02 | Login page renders + authenticated nav works | e2e | `cd packages/web && bunx playwright test tests/login.spec.ts tests/navigation.spec.ts` | ❌ Wave 0 |
| E2E-03 | Upload → mocked analyze → result displays | e2e | `cd packages/web && bunx playwright test tests/ai-pipeline.spec.ts` | ❌ Wave 0 |
| E2E-04 | data-testid on key interactive components | manual audit | Same as REF-05 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run test:unit` (Vitest only, no server needed)
- **Per wave merge:** Vitest suite green; E2E annotated as "requires running server — validate post-merge"
- **Phase gate:** All Vitest tests green + E2E tests structurally valid (no TS errors) before closing phase

### Wave 0 Gaps
- [ ] `packages/web/tests/physics.test.ts` — covers ThiingsGridPhysics pure functions
- [ ] `packages/web/tests/hooks.test.ts` — covers `dataUrlToBlob` helper
- [ ] `packages/web/tests/auth.setup.ts` — Playwright storageState fixture
- [ ] `packages/web/tests/login.spec.ts` — covers E2E-02 login flow
- [ ] `packages/web/tests/navigation.spec.ts` — covers E2E-02 navigation
- [ ] `packages/web/tests/ai-pipeline.spec.ts` — covers E2E-03
- [ ] `packages/web/tests/fixtures/test-image.jpg` — minimal JPEG for upload test
- [ ] `packages/web/.playwright/` directory — storageState output dir (gitignore this)
- [ ] playwright.config.ts: `yarn dev` → `bun dev`, add setup project, add storageState to chromium project

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `packages/web/vitest.config.ts`, `packages/web/playwright.config.ts` — confirmed versions and existing test structure
- Codebase inspection: `packages/web/lib/components/ThiingsGridPhysics.ts` — confirmed exported pure functions (debounce, throttle, getDistance)
- Codebase inspection: `packages/web/lib/hooks/useVtonTryOn.ts` — confirmed exported `dataUrlToBlob` pure function
- Codebase inspection: `packages/web/tests/zod-validation.test.ts` — confirmed existing Vitest pattern with globals: true
- `.planning/REQUIREMENTS.md` — confirmed actual pending requirements: REF-05, E2E-01–E2E-04

### Secondary (MEDIUM confidence)
- Playwright official docs pattern: storageState-based auth with a setup project (standard documented approach since Playwright v1.20)
- Supabase JS `signInWithPassword` → localStorage session pattern (standard Supabase auth flow)

### Tertiary (LOW confidence)
- Exact Supabase localStorage key format (`sb-{ref}-auth-token`) — verified from Supabase JS source code pattern but exact key for this project depends on project URL (needs runtime confirmation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both test frameworks installed and in-use, confirmed from package.json
- Architecture: HIGH — based on direct codebase inspection of existing test patterns and refactored code
- Pitfalls: HIGH — environment/node constraint confirmed from vitest.config.ts; Supabase key pattern is MEDIUM

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable tooling, 30 days)
