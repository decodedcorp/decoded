/**
 * E2E tests for the login page and unauthenticated access flows.
 *
 * These run in the "chromium-no-auth" project (no storageState dependency)
 * so they always start from a fresh, unauthenticated browser context.
 */
import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("login page renders with OAuth button and guest option", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Page title / brand should be visible
    await expect(page.getByText("decoded")).toBeVisible();
    await expect(page.getByText("Welcome to Decoded")).toBeVisible();

    // Google OAuth button must be present (primary CTA)
    // OAuthButton renders a button — match by accessible role + provider label text
    await expect(
      page.getByRole("button", { name: /google/i })
    ).toBeVisible();

    // Guest login button must also be present
    await expect(
      page.getByRole("button", { name: /continue as guest/i })
    ).toBeVisible();
  });

  test("login page has correct meta title", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Decoded/i);
  });

  test("admin route redirects unauthenticated users away from admin", async ({
    page,
  }) => {
    // The proxy.ts protects /admin/* and redirects to / for unauthenticated users
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Should not remain on /admin — redirect to home
    expect(page.url()).not.toContain("/admin");
  });
});
