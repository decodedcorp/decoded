/**
 * E2E for the intercepting /request/upload modal overlay.
 *
 * Covers #145 PR-3 Section 4: in-app navigation (Desktop SmartNav) routes
 * through the intercept, so the upload flow renders inside RequestFlowModal
 * on top of the previous page. Direct URL rendering is covered by
 * upload-direct.spec.ts.
 */
import { test, expect } from "@playwright/test";

test.describe("Upload intercept modal", () => {
  test("in-app nav opens intercept modal on /request/upload", async ({
    page,
  }) => {
    await page.goto("/");

    // SmartNav Upload button (desktop). Match case-insensitive; there may be
    // multiple Upload buttons (main nav + profile dropdown) — take the first.
    await page
      .getByRole("button", { name: /upload/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/request\/upload/);
    await expect(page.getByTestId("request-flow-modal-dialog")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("ESC closes the intercept modal and routes back", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /upload/i })
      .first()
      .click();

    const dialog = page.getByTestId("request-flow-modal-dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("Escape");

    // GSAP close timeline is ~0.2s; give the router + unmount time to settle.
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(page).not.toHaveURL(/\/request\/upload/);
  });

  test("backdrop click closes the intercept modal", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /upload/i })
      .first()
      .click();

    const dialog = page.getByTestId("request-flow-modal-dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("request-flow-modal-backdrop").click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});
