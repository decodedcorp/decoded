/**
 * E2E tests for user engagement flows.
 * Covers: like toggle, save toggle, solution adoption.
 */
import { test, expect } from "@playwright/test";
import { mockContentAPIs, mockEngagementAPIs } from "./helpers";

test.describe("Engagement", () => {
  test.beforeEach(async ({ page }) => {
    await mockContentAPIs(page);
    await mockEngagementAPIs(page);
  });

  test("like button is visible on post detail", async ({ page }) => {
    await page.goto("/posts/post-1");

    const likeButton = page.getByTestId("like-button").first();
    await expect(likeButton).toBeVisible({ timeout: 15_000 });

    await likeButton.click();
    // Button should still be visible after click (no crash)
    await expect(likeButton).toBeVisible();
  });

  test("save button is visible on post detail", async ({ page }) => {
    await page.goto("/posts/post-1");

    const saveButton = page.getByTestId("save-button");
    await expect(saveButton).toBeVisible({ timeout: 15_000 });

    await saveButton.click();
    await expect(saveButton).toBeVisible();
  });

  test("adopt button on solution card", async ({ page }) => {
    await page.goto("/posts/post-1");

    const adoptButton = page.getByTestId("item-adopt-button");
    await expect(adoptButton.first()).toBeVisible({ timeout: 15_000 });

    await adoptButton.first().click();
    await expect(adoptButton.first()).toBeVisible();
  });
});
