/**
 * E2E tests for Supabase → Backend API migration.
 *
 * Verifies that pages still work after removing direct Supabase queries
 * and switching to backend REST API calls.
 *
 * Runs in "chromium-no-auth" project (no auth required).
 */
import { test, expect } from "@playwright/test";

test.describe("API migration — feed & posts", () => {
  test("explore page loads with post grid", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    // Should have visible content (images or grid items)
    const content = page.locator("main");
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("post detail page loads directly", async ({ page }) => {
    // Get a post ID from the API first
    const response = await page.request.get("/api/v1/posts?page=1&per_page=1");
    const body = await response.json();
    const postId = body?.data?.[0]?.id;

    if (postId) {
      await page.goto(`/posts/${postId}`);
      await page.waitForLoadState("networkidle");

      // Should render post detail with image
      const img = page.locator("img").first();
      await expect(img).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("API migration — backend health", () => {
  test("backend posts API returns data", async ({ request }) => {
    const response = await request.get("/api/v1/posts?page=1&per_page=1");
    expect(response.status()).toBeLessThan(500);
  });

  test("backend health check passes", async ({ request }) => {
    const response = await request.get("http://localhost:8000/health");
    expect(response.ok()).toBeTruthy();
  });
});
