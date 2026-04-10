/**
 * E2E tests for user engagement on post detail page.
 * Tests verify that engagement UI elements render correctly.
 */
import { test, expect } from "@playwright/test";
import { mockContentAPIs, mockEngagementAPIs } from "./helpers";

test.describe("Engagement", () => {
  test.beforeEach(async ({ page }) => {
    await mockContentAPIs(page);
    await mockEngagementAPIs(page);
  });

  test("post detail page shows item with solution section", async ({
    page,
  }) => {
    await page.goto("/posts/post-1");

    // Item detail card should render
    const itemCard = page.getByTestId("item-detail-card");
    await expect(itemCard.first()).toBeVisible({ timeout: 15_000 });

    // "Test Dress" from mock data should appear
    await expect(page.getByText("Test Dress").first()).toBeVisible();
  });

  test("post detail page shows shop the look section", async ({ page }) => {
    await page.goto("/posts/post-1");

    await expect(page.getByText("Shop the Look").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("back button navigates away from post detail", async ({ page }) => {
    await page.goto("/posts/post-1");

    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible({ timeout: 15_000 });

    await backButton.click();
    // Should navigate away from post detail
    await expect(page).not.toHaveURL(/\/posts\/post-1/);
  });
});
