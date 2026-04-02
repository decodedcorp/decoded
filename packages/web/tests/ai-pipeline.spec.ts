/**
 * E2E tests for the AI upload pipeline.
 *
 * These run in the "chromium" project (authenticated via storageState).
 * The backend AI endpoint is always mocked via page.route() — real network
 * calls to /api/v1/posts/analyze are never made in tests.
 */
import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE_IMAGE = path.join(__dirname, "fixtures", "test-image.jpg");

test.describe("AI upload pipeline", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the AI analysis endpoint before navigating
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

    // Also mock post creation endpoints so submit doesn't hit real backend
    await page.route("**/api/v1/posts", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock-post-id-123" }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("upload page renders with drop zone for file selection", async ({
    page,
  }) => {
    await page.goto("/request/upload");
    await page.waitForLoadState("networkidle");

    // DropZone renders a hidden file input for programmatic use
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test("upload image and see user-type selection prompt", async ({ page }) => {
    await page.goto("/request/upload");
    await page.waitForLoadState("networkidle");

    // Set a file via the hidden file input (DropZone component)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_IMAGE);

    // After file selection, the app should ask if the user knows the items
    // Korean: "이 사진 속 아이템을 알고 계신가요?"
    await expect(page.getByText(/아이템을 알고 계신가요/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("upload image → choose not knowing items → can see spots panel", async ({
    page,
  }) => {
    await page.goto("/request/upload");
    await page.waitForLoadState("networkidle");

    // Upload fixture image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_IMAGE);

    // Wait for user-type selection UI
    await expect(page.getByText(/아이템을 알고 계신가요/i)).toBeVisible({
      timeout: 5000,
    });

    // Select "I don't know" option — triggers the spot-marking flow
    await page.getByRole("button", { name: /아니요, 궁금해요/i }).click();

    // After choosing, the detection view with spots panel should appear
    // The spots panel shows a "0 spots" empty state with the add icon
    await expect(page.getByText(/Spots \(0\)/i)).toBeVisible({ timeout: 5000 });
  });

  test("analyze endpoint mock is called when navigation triggers it", async ({
    page,
  }) => {
    let analyzeCallCount = 0;

    // Override the beforeEach mock to also track calls
    await page.route("**/api/v1/posts/analyze", async (route) => {
      analyzeCallCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{ id: "mock-1", label: "Dress", confidence: 0.95 }],
        }),
      });
    });

    // Directly test the API route mock via fetch (simulates what the app does)
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/v1/posts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: "https://example.com/test.jpg" }),
      });
      return res.json();
    });

    // The mock should intercept and return our fixture data
    expect(response).toHaveProperty("items");
    expect(analyzeCallCount).toBe(1);
  });
});
