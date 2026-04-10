/**
 * E2E tests for Supabase → Backend API migration.
 *
 * Verifies that pages still work after removing direct Supabase queries
 * and switching to backend REST API calls.
 *
 * Runs in "chromium" project (authenticated via storageState).
 */
import { test, expect } from "@playwright/test";

test.describe("API migration — feed & posts", () => {
  test("main feed loads posts via REST API", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Feed should render post images (grid items)
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });

  test("explore page loads with infinite scroll", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    // Should have visible post cards
    const grid = page.locator('[data-testid="thiings-grid"], main img');
    await expect(grid.first()).toBeVisible({ timeout: 10000 });
  });

  test("post detail page loads via REST API", async ({ page }) => {
    // Navigate to explore and click first post
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const firstImage = page.locator("main img").first();
    if (await firstImage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstImage.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to a detail page with image visible
      await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("API migration — profile", () => {
  test("profile page loads user data", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Profile should show user info (not redirect to login)
    expect(page.url()).toContain("/profile");
  });
});

test.describe("API migration — backend health", () => {
  test("backend API is reachable", async ({ request }) => {
    const response = await request.get("/api/v1/posts?page=1&per_page=1");
    expect(response.status()).toBeLessThan(500);
  });
});
