# Testing Framework & Patterns

**Project**: decoded-app
**Last Updated**: 2026-01-23
**Focus**: Test structure, patterns, and quality standards

## Table of Contents
1. [Testing Stack Overview](#testing-stack-overview)
2. [Test Structure & Organization](#test-structure--organization)
3. [E2E Testing with Playwright](#e2e-testing-with-playwright)
4. [Test Patterns by Type](#test-patterns-by-type)
5. [Mocking Strategies](#mocking-strategies)
6. [Coverage Goals](#coverage-goals)

---

## Testing Stack Overview

### Current Testing Setup

| Framework | Version | Purpose | Location |
|-----------|---------|---------|----------|
| **Playwright** | (via `@playwright/test`) | E2E testing | `__tests__/e2e/` |
| **React Testing Library** | (implicit via React Query) | Component testing | Not yet configured |
| **Jest** | Not configured | Unit testing | Not configured |
| **Vitest** | Not configured | Alternative test runner | Not configured |

### Test Configuration

**Package.json Scripts** (`packages/web/package.json`):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint app lib",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

**Status**: Test script not yet added to npm scripts. Playwright tests are discoverable but not run by default.

---

## Test Structure & Organization

### Directory Layout

```
decoded-app/
├── __tests__/
│   ├── e2e/
│   │   └── scroll-animation.spec.ts      # E2E test suite
│   ├── unit/                              # (Recommended future structure)
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── components/
│   └── integration/                       # (Recommended future structure)
│       └── supabase/
│
└── packages/web/
    ├── lib/
    │   ├── __tests__/                    # (Alternative: co-located tests)
    │   │   └── hooks.test.ts
    │   └── hooks/
    └── app/
        ├── __tests__/
        └── feed/
```

### Naming Convention

| Test Type | Pattern | Example |
|-----------|---------|---------|
| **E2E** | `*.spec.ts` | `scroll-animation.spec.ts` |
| **Unit** | `*.test.ts` or `*.spec.ts` | `validation.test.ts` |
| **Component** | `*.test.tsx` or `*.spec.tsx` | `FeedCard.test.tsx` |
| **Integration** | `*.integration.ts` | `supabase-queries.integration.ts` |

---

## E2E Testing with Playwright

### Playwright Configuration

**Default Playwright Config** (if created):
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### Existing E2E Test Suite

**File**: `__tests__/e2e/scroll-animation.spec.ts`

#### Test Organization Pattern

```typescript
import { test, expect } from "@playwright/test";

// Test suite grouped by feature/user story
test.describe("Scroll Animation System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the example page
    await page.goto("/examples/scroll-animation");
  });

  test("T007: cards should have is-visible class added when scrolled into view", async ({
    page,
  }) => {
    // Arrange
    const firstCard = page.locator(".js-observe").first();

    // Act: Scroll card into view
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Assert
    await expect(firstCard).toHaveClass(/is-visible/);
  });

  // Additional tests...
});
```

**Patterns**:
- Organize with `test.describe()` per feature or user story
- Use `test.beforeEach()` for common setup (navigation, login, etc.)
- Follow AAA pattern: Arrange → Act → Assert
- Use meaningful test names with task references (T007, T008, etc.)
- Group related assertions

#### Locator Strategies

```typescript
// Recommended: data-testid attributes
const button = page.locator('[data-testid="submit-button"]');

// Class selectors
const cards = page.locator(".js-observe");

// CSS selectors
const badge = page.locator("article badge");

// Role selectors (accessibility)
const button = page.getByRole("button", { name: /submit/i });

// Text selectors
const heading = page.getByText("Login");
```

**Convention**: Prefer role-based or data-testid selectors for stability. Avoid brittle selectors like nth-child or position-based.

#### Assertion Patterns

```typescript
// Visibility & state
await expect(element).toBeVisible();
await expect(element).toBeHidden();
await expect(element).toBeDisabled();
await expect(element).toBeEnabled();

// Classes & attributes
await expect(element).toHaveClass(/is-visible/);
await expect(element).toHaveAttribute("data-loaded", "true");

// Content
await expect(element).toContainText("Expected text");
await expect(element).toHaveTextContent(/expected/i);

// Count
await expect(page.locator(".card")).toHaveCount(10);

// Values (inputs, selects)
await expect(input).toHaveValue("expected value");

// Timing
await expect(element).toBeVisible({ timeout: 5000 });
```

#### Common Playwright Patterns

```typescript
// Wait for element to appear
await page.locator(".modal").waitFor({ state: "visible" });

// Wait for action to complete
await page.waitForLoadState("networkidle");

// Evaluate JavaScript in page context
const count = await page.evaluate(() => {
  return document.querySelectorAll(".card").length;
});

// Get computed styles
const opacity = await element.evaluate(
  (el) => window.getComputedStyle(el).opacity
);

// Screenshots
await page.screenshot({ path: "screenshot.png" });

// Network interception (mocking)
await page.route("**/api/posts", (route) => {
  route.abort();  // Block request
  // or
  route.continue(); // Allow request
});

// Keyboard input
await page.keyboard.press("Enter");
await page.type("input", "search term");

// Mouse interactions
await page.click(".button");
await element.hover();
await page.dragAndDrop(".source", ".target");
```

### Running E2E Tests

```bash
# Install Playwright (if not already)
npx playwright install

# Run all E2E tests
npx playwright test

# Run tests in specific file
npx playwright test __tests__/e2e/scroll-animation.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run on specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright test && npx playwright show-report
```

---

## Test Patterns by Type

### E2E Test Pattern (Full Flow Testing)

**File**: `__tests__/e2e/scroll-animation.spec.ts` (excerpt)

```typescript
test.describe("Scroll Animation System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/scroll-animation");
  });

  test("cards animate correctly when scrolled into view", async ({ page }) => {
    // Arrange
    const firstCard = page.locator(".js-observe").first();

    // Initially should not have animation class
    await expect(firstCard).not.toHaveClass(/is-visible/);

    // Act
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);  // Wait for animation

    // Assert
    await expect(firstCard).toHaveClass(/is-visible/);
  });

  test("multiple cards animate with staggered delays", async ({ page }) => {
    const cards = page.locator(".js-observe");
    const card1 = cards.nth(0);
    const card2 = cards.nth(1);
    const card3 = cards.nth(2);

    // Scroll all into view
    await card3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // All should have is-visible
    await expect(card1).toHaveClass(/is-visible/);
    await expect(card2).toHaveClass(/is-visible/);
    await expect(card3).toHaveClass(/is-visible/);

    // Verify stagger delays differ (via CSS custom property)
    const delay1 = await card1.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--stagger")
    );
    const delay2 = await card2.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--stagger")
    );

    expect(delay1).not.toBe(delay2);
  });
});
```

### Unit Test Pattern (Utilities - Recommended)

```typescript
// lib/utils/validation.test.ts
import { describe, test, expect } from "vitest";
import {
  validateImageFile,
  validateFileSize,
  UPLOAD_CONFIG,
} from "./validation";

describe("Validation Utils", () => {
  describe("validateFileSize", () => {
    test("returns valid for file under max size", () => {
      const file = new File(["small"], "test.jpg", { type: "image/jpeg" });
      const result = validateFileSize(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("returns error for file over max size", () => {
      const large = new File(
        [new ArrayBuffer(UPLOAD_CONFIG.maxFileSize + 1)],
        "large.jpg",
        { type: "image/jpeg" }
      );
      const result = validateFileSize(large);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("超过");
    });
  });

  describe("validateImageFile", () => {
    test("validates format and size together", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    test("returns format error first", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not supported");
    });
  });
});
```

### Store Test Pattern (Zustand - Recommended)

```typescript
// lib/stores/authStore.test.ts
import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "./authStore";

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isInitialized: false,
      error: null,
    });
  });

  test("initializes without duplicate calls", async () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isInitialized).toBe(false);

    // First call
    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(true);

    // Second call should return early
    const firstInit = result.current.isInitialized;
    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(firstInit);
  });

  test("handles oauth login error gracefully", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      // Mock error scenario
      await result.current.signInWithOAuth("kakao");
    });

    // Should set error state
    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  test("clears error on command", () => {
    const { result } = renderHook(() => useAuthStore());

    // Set error
    useAuthStore.setState({ error: "Test error" });

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
```

### Hook Test Pattern (React Query - Recommended)

```typescript
// lib/hooks/usePosts.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePosts } from "./usePosts";

// Mock the API
vi.mock("@/lib/api/posts", () => ({
  fetchPosts: vi.fn(),
}));

describe("usePosts Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  test("fetches posts on mount", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useInfinitePosts({ perPage: 10 }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  test("handles pagination correctly", async () => {
    // ... setup ...

    const { result } = renderHook(() => useInfinitePosts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Has more pages
    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages.length).toBe(2);
    });
  });
});
```

### Component Test Pattern (React Testing Library - Recommended)

```typescript
// lib/components/FeedCard.test.tsx
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedCard } from "./FeedCard";

describe("FeedCard Component", () => {
  const mockItem = {
    id: "test-id",
    imageUrl: "https://example.com/image.jpg",
    hasItems: true,
  };

  test("renders card with image", () => {
    render(<FeedCard item={mockItem} index={0} />);

    const image = screen.getByAltText(/Image test-id/i);
    expect(image).toBeInTheDocument();
  });

  test("shows item badge when hasItems is true", () => {
    render(<FeedCard item={mockItem} index={0} />);

    const badge = screen.getByText("Items");
    expect(badge).toBeInTheDocument();
  });

  test("hides item badge when hasItems is false", () => {
    render(<FeedCard item={{ ...mockItem, hasItems: false }} index={0} />);

    const badge = screen.queryByText("Items");
    expect(badge).not.toBeInTheDocument();
  });

  test("handles image load error gracefully", async () => {
    const user = userEvent.setup();
    render(<FeedCard item={mockItem} index={0} />);

    const image = screen.getByAltText(/Image test-id/i);

    // Simulate error
    await user.click(image);
    fireEvent.error(image);

    // Should show placeholder
    const placeholder = screen.getByAltText(/Image test-id/i);
    expect(placeholder).toBeInTheDocument();
  });
});
```

---

## Mocking Strategies

### API Mocking (MSW - Recommended for future)

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock GET /api/posts
  http.get("/api/posts", () => {
    return HttpResponse.json({
      data: [
        { id: "1", title: "Post 1", imageUrl: "..." },
        { id: "2", title: "Post 2", imageUrl: "..." },
      ],
      pagination: {
        current_page: 1,
        total_pages: 5,
      },
    });
  }),

  // Mock POST /api/upload
  http.post("/api/upload", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return HttpResponse.json({ error: "No file provided" }, { status: 400 });
    }

    return HttpResponse.json({ url: "https://example.com/uploaded.jpg" });
  }),
];

// __tests__/setup.ts
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Supabase Client Mocking

```typescript
// __tests__/mocks/supabase.ts
import { vi } from "vitest";

export const mockSupabaseBrowserClient = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowserClient: mockSupabaseBrowserClient,
}));
```

### Zustand Store Mocking

```typescript
// In tests
import { useAuthStore } from "@/lib/stores/authStore";

beforeEach(() => {
  // Reset to initial state
  useAuthStore.setState({
    user: null,
    isGuest: false,
    isLoading: false,
    isInitialized: false,
    error: null,
  });
});

test("example", () => {
  // Pre-populate store
  useAuthStore.setState({
    user: { id: "123", email: "test@example.com", name: "Test" },
    isInitialized: true,
  });

  // Test with store in specific state
  // ...
});
```

### React Query Mocking

```typescript
// __tests__/setup.ts
import { QueryClient } from "@tanstack/react-query";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
```

---

## Coverage Goals

### Recommended Coverage Targets

| Type | Target | Priority |
|------|--------|----------|
| **Statements** | 70%+ | Critical |
| **Branches** | 65%+ | High |
| **Functions** | 70%+ | Critical |
| **Lines** | 70%+ | Critical |

### Critical Coverage Areas (Priority Order)

1. **Auth Store** - Security-sensitive state
2. **Validation Utils** - Data integrity
3. **API Layer** - Integration points
4. **Query Layer** - Data access patterns
5. **Hooks** - Reusable logic
6. **Components** - User-facing features

### Generating Coverage Report

```bash
# Jest
jest --coverage

# Vitest
vitest run --coverage

# Playwright (code coverage)
npx playwright test --reporter=html

# View report
open coverage/index.html
open playwright-report/index.html
```

---

## Setting Up Testing (Next Steps)

### 1. Add Playwright Config
```bash
# Install Playwright if not already installed
npm install -D @playwright/test

# Create playwright.config.ts in root
# (Use template provided in section above)
```

### 2. Add Test Scripts to package.json
```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui"
  }
}
```

### 3. Set Up Unit Testing (Vitest Recommended)
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

### 4. Create Test Utilities
```typescript
// __tests__/utils/test-utils.tsx
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "./query-client";

export function renderWithProviders(
  ui: React.ReactElement,
  {
    ...renderOptions
  }: Omit<RenderOptions, "wrapper"> = {}
) {
  const testQueryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from "@testing-library/react";
```

### 5. Create Test Config (vitest.config.ts)
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
      ],
    },
  },
});
```

---

## Summary Checklist

- [ ] Playwright configured in `playwright.config.ts`
- [ ] E2E tests organized by feature in `__tests__/e2e/`
- [ ] Test names meaningful with task references
- [ ] AAA pattern (Arrange-Act-Assert) followed
- [ ] Data-testid or role selectors preferred over brittle selectors
- [ ] Mock API responses using MSW
- [ ] Mock Supabase client for unit tests
- [ ] Store tests reset state between tests
- [ ] React Query tests use test QueryClient with retries disabled
- [ ] Component tests use `renderWithProviders` utility
- [ ] Coverage targets defined and tracked
- [ ] Test npm scripts added to package.json

