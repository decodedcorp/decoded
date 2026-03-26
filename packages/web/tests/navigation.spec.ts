/**
 * E2E tests for authenticated navigation flows.
 *
 * These run in the "chromium" project, which depends on the "setup" project
 * to have already saved a valid storageState. Tests start pre-authenticated.
 */
import { test, expect } from "@playwright/test";

test.describe("Authenticated navigation", () => {
  test("main page loads with thiings grid", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // ThiingsGrid is instrumented with data-testid="thiings-grid" (Phase 46/48-01)
    await expect(page.locator('[data-testid="thiings-grid"]')).toBeVisible();
  });

  test("images page loads and stays on /images", async ({ page }) => {
    await page.goto("/images");
    await page.waitForLoadState("networkidle");

    // URL should remain at /images (no redirect away)
    expect(page.url()).toContain("/images");
  });

  test("profile page loads without redirecting away", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Authenticated user should see profile page, not be redirected
    expect(page.url()).toContain("/profile");
  });

  test("request upload page loads with drop zone", async ({ page }) => {
    await page.goto("/request/upload");
    await page.waitForLoadState("networkidle");

    // Upload page should have a file input (from DropZone component)
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });
});
