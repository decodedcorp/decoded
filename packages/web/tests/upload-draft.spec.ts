/**
 * E2E for upload draft restore toast.
 *
 * Covers #145 PR-3 C3: useUploadFlow's offline draft restore. Once a user
 * has marked spots or selected userKnowsItems, the draft auto-saves to
 * localStorage. A page reload should surface a "Restore" toast; the second
 * reload within the same session should NOT show it again (once-per-session
 * dedup handled by toast duration + loadDraft() call placement on mount).
 */
import { test, expect } from "@playwright/test";

test.describe("Upload draft restore", () => {
  test("draft restore toast appears after reload when a draft exists", async ({
    page,
  }) => {
    await page.goto("/request/upload");

    // Seed a draft by selecting an image and declaring user-type.
    const fileInput = page.locator("input[type='file']").first();
    await fileInput.setInputFiles("tests/fixtures/test-image.jpg");

    // Selecting userKnowsItems satisfies auto-save guard
    // (detectedSpots.length === 0 && userKnowsItems === null skip).
    await page
      .getByRole("button", { name: /no.*curious/i })
      .click({ timeout: 10_000 });

    // Trigger a reload — loadDraft() runs once on mount and should fire toast.
    await page.reload();

    // Toast body from useUploadFlow.ts: "You have an unsaved request draft."
    await expect(page.getByText(/unsaved request draft/i)).toBeVisible({
      timeout: 15_000,
    });
    // Restore action label — ensure the toast exposes the restore affordance.
    await expect(page.getByRole("button", { name: /restore/i })).toBeVisible();
  });
});
