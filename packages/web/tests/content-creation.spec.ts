/**
 * E2E tests for content creation flow.
 * Covers: upload page, image selection, spot placement, solution form.
 */
import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures", "test-image.jpg");

test.describe("Content creation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock AI analysis endpoint
    await page.route("**/api/v1/posts/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { id: "mock-1", label: "Dress", confidence: 0.95 },
            { id: "mock-2", label: "Bag", confidence: 0.87 },
          ],
        }),
      });
    });

    // Mock post creation
    await page.route("**/api/v1/posts", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock-post-id" }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("upload page renders with dropzone", async ({ page }) => {
    await page.goto("/request/upload");

    // Wait for either the dropzone or file input (AuthGuard may take a moment)
    const dropzone = page.getByTestId("upload-dropzone");
    const fileInput = page.locator('input[type="file"]');

    await expect(dropzone.or(fileInput)).toBeVisible({ timeout: 15_000 });
  });

  test("selecting image triggers user-type prompt", async ({ page }) => {
    await page.goto("/request/upload");

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 15_000 });
    await fileInput.setInputFiles(FIXTURE_IMAGE);

    await expect(page.getByText(/아이템을 알고 계신가요/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("choosing option shows spots panel", async ({ page }) => {
    await page.goto("/request/upload");

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 15_000 });
    await fileInput.setInputFiles(FIXTURE_IMAGE);

    await expect(page.getByText(/아이템을 알고 계신가요/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /아니요, 궁금해요/i }).click();

    await expect(page.getByText(/Spots/i)).toBeVisible({ timeout: 10_000 });
  });
});
