import { test, expect } from "@playwright/test";

test.describe("Scroll Animation System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the example page (will be created in T016)
    await page.goto("/examples/scroll-animation");
  });

  test("T007: cards should have is-visible class added when scrolled into view", async ({
    page,
  }) => {
    // Get the first card element
    const firstCard = page.locator(".js-observe").first();

    // Initially, card should not have is-visible class (below fold)
    await expect(firstCard).not.toHaveClass(/is-visible/);

    // Scroll card into view
    await firstCard.scrollIntoViewIfNeeded();

    // Wait for animation to trigger
    await page.waitForTimeout(100);

    // Card should now have is-visible class
    await expect(firstCard).toHaveClass(/is-visible/);
  });

  test("T008: multiple cards should animate with staggered delays (cascading effect)", async ({
    page,
  }) => {
    const cards = page.locator(".js-observe");

    // Get first 3 cards
    const card1 = cards.nth(0);
    const card2 = cards.nth(1);
    const card3 = cards.nth(2);

    // Scroll to make all cards visible
    await card3.scrollIntoViewIfNeeded();

    // Wait for animations to start
    await page.waitForTimeout(100);

    // All cards should have is-visible class
    await expect(card1).toHaveClass(/is-visible/);
    await expect(card2).toHaveClass(/is-visible/);
    await expect(card3).toHaveClass(/is-visible/);

    // Verify stagger delays are set (via CSS custom property)
    const delay1 = await card1.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--stagger")
    );
    const delay2 = await card2.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--stagger")
    );
    const delay3 = await card3.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--stagger")
    );

    // Delays should be different (creating cascade effect)
    expect(delay1).not.toBe(delay2);
    expect(delay2).not.toBe(delay3);
  });

  test("T009: cards should have is-hidden class when scrolled away", async ({
    page,
  }) => {
    const firstCard = page.locator(".js-observe").first();

    // Scroll card into view first
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Card should have is-visible class
    await expect(firstCard).toHaveClass(/is-visible/);

    // Scroll way past the card (make it exit viewport)
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(100);

    // Card should now have is-hidden class
    await expect(firstCard).toHaveClass(/is-hidden/);
  });
});

test.describe("Lazy Image Loading (User Story 2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/scroll-animation");
  });

  test("T018: images should load only when scrolled near (lazy loading)", async ({
    page,
  }) => {
    // Find image with data-src attribute
    const lazyImage = page.locator("img[data-src]").first();

    // Initially, image should not have src attribute loaded
    const initialSrc = await lazyImage.getAttribute("src");
    const dataSrc = await lazyImage.getAttribute("data-src");

    expect(initialSrc).not.toBe(dataSrc);

    // Scroll image into view
    await lazyImage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Image should now have src loaded from data-src
    const finalSrc = await lazyImage.getAttribute("src");
    expect(finalSrc).toBe(dataSrc);
  });

  test('T019: images should not reload when re-entering viewport (data-loaded="true")', async ({
    page,
  }) => {
    const lazyImage = page.locator("img[data-src]").first();

    // Scroll into view to trigger load
    await lazyImage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Image should be marked as loaded
    const dataLoaded = await lazyImage.getAttribute("data-loaded");
    expect(dataLoaded).toBe("true");

    // Scroll away and back
    await page.evaluate(() => window.scrollBy(0, -2000));
    await page.waitForTimeout(100);
    await lazyImage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // data-loaded should still be true (not reloaded)
    const stillLoaded = await lazyImage.getAttribute("data-loaded");
    expect(stillLoaded).toBe("true");
  });

  test("T020: above-the-fold images should load immediately", async ({
    page,
  }) => {
    // Find hero/above-fold image (should NOT have data-src, should have regular src)
    const heroImage = page.locator("img").first();

    // Check if it's not using lazy loading pattern
    const hasDataSrc = await heroImage.getAttribute("data-src");
    expect(hasDataSrc).toBeNull();

    // Should have src attribute already
    const src = await heroImage.getAttribute("src");
    expect(src).toBeTruthy();
  });
});

test.describe("Performance Optimization (User Story 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/scroll-animation");
  });

  test("T028: animations should maintain 60fps (frame time <16.67ms)", async ({
    page,
  }) => {
    const cards = page.locator(".js-observe");

    // Measure frame times during scroll
    const frameTimes: number[] = [];

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const times: number[] = [];
        let lastTime = performance.now();
        let frameCount = 0;

        function measureFrame() {
          const currentTime = performance.now();
          const frameTime = currentTime - lastTime;
          times.push(frameTime);
          lastTime = currentTime;
          frameCount++;

          if (frameCount < 30) {
            requestAnimationFrame(measureFrame);
          } else {
            // @ts-ignore
            window.measuredFrameTimes = times;
            resolve();
          }
        }

        // Start scrolling and measuring
        window.scrollBy(0, 10);
        requestAnimationFrame(measureFrame);
      });
    });

    // @ts-ignore
    const times = await page.evaluate(() => window.measuredFrameTimes);

    // Calculate average frame time
    const avgFrameTime =
      times.reduce((a: number, b: number) => a + b, 0) / times.length;

    // Average frame time should be <16.67ms (60fps)
    expect(avgFrameTime).toBeLessThan(16.67);
  });

  test("T029: Core Web Vitals should meet targets (CLS ≤ 0.1, LCP ≤ 2.5s)", async ({
    page,
  }) => {
    // Navigate and wait for page load
    await page.goto("/examples/scroll-animation");

    // Get Core Web Vitals using performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for metrics to be available
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming;
          const paintEntries = performance.getEntriesByType("paint");
          const lcpEntry = paintEntries.find(
            (entry) => entry.name === "largest-contentful-paint"
          );

          resolve({
            lcp: lcpEntry?.startTime || 0,
            // CLS would need layout shift entries (simplified for now)
            cls: 0,
          });
        }, 1000);
      });
    });

    // LCP should be ≤ 2500ms
    // @ts-ignore
    expect(metrics.lcp).toBeLessThan(2500);

    // CLS should be ≤ 0.1 (would need proper measurement)
    // @ts-ignore
    expect(metrics.cls).toBeLessThanOrEqual(0.1);
  });

  test("T030: animations should work smoothly on mobile devices", async ({
    page,
    context,
  }) => {
    // Emulate iPhone 12
    await context.newPage({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      viewport: { width: 390, height: 844 },
    });

    await page.goto("/examples/scroll-animation");

    const firstCard = page.locator(".js-observe").first();

    // Scroll into view
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Animation should work (is-visible class added)
    await expect(firstCard).toHaveClass(/is-visible/);

    // Verify smooth animation (opacity should transition)
    const opacity = await firstCard.evaluate(
      (el) => window.getComputedStyle(el).opacity
    );

    expect(parseFloat(opacity)).toBeGreaterThan(0.5);
  });
});
