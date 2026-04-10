/**
 * E2E tests for content creation flow.
 * Covers: upload page rendering and step progress.
 */
import { test, expect } from "@playwright/test";

test.describe("Content creation", () => {
  test("upload page renders with file input and dropzone", async ({ page }) => {
    await page.goto("/request/upload");

    // File input should be attached (DropZone renders hidden input)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 15_000 });

    // Drag and drop text should be visible
    await expect(page.getByText("Drag and drop images")).toBeVisible();
  });

  test("upload page shows step progress indicators", async ({ page }) => {
    await page.goto("/request/upload");

    // Step progress group should be present (aria-label "Step 1 of 3")
    await expect(page.getByLabel(/Step 1 of/)).toBeVisible({ timeout: 15_000 });

    // Detect and Details steps should be present
    await expect(page.getByText("Detect")).toBeVisible();
    await expect(page.getByText("Details")).toBeVisible();
  });

  test("upload page shows supported formats", async ({ page }) => {
    await page.goto("/request/upload");

    await expect(page.getByText("JPG, PNG, WebP")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Max 10MB")).toBeVisible();
  });
});
