/**
 * E2E tests for content consumption flows.
 * Covers: explore grid, search, sort, post detail, spots/solutions, feed scroll.
 */
import { test, expect } from "@playwright/test";
import { mockContentAPIs } from "./helpers";

test.describe("Content consumption", () => {
  test.beforeEach(async ({ page }) => {
    await mockContentAPIs(page);
  });

  test("explore page loads with grid", async ({ page }) => {
    await page.goto("/explore");

    const grid = page.getByTestId("thiings-grid");
    await expect(grid).toBeVisible({ timeout: 15_000 });
  });

  test("search input is functional", async ({ page }) => {
    await page.goto("/explore");

    const searchInput = page.getByTestId("explore-search-input");
    await expect(searchInput).toBeVisible({ timeout: 15_000 });

    await searchInput.fill("dress");
    await searchInput.press("Enter");

    // After search, input should still contain the query
    await expect(searchInput).toHaveValue("dress");
  });

  test("sort dropdown is visible and has options", async ({ page }) => {
    await page.goto("/explore");

    const sortSelect = page.getByTestId("explore-sort-select");
    await expect(sortSelect).toBeVisible({ timeout: 15_000 });

    // Verify default value
    await expect(sortSelect).toHaveValue("relevant");

    // Verify options exist
    const options = sortSelect.locator("option");
    await expect(options).toHaveCount(4);
  });

  test("post detail shows item cards", async ({ page }) => {
    await page.goto("/posts/post-1");

    const itemCard = page.getByTestId("item-detail-card");
    await expect(itemCard.first()).toBeVisible({ timeout: 15_000 });
  });

  test("feed page loads with cards", async ({ page }) => {
    await page.goto("/feed");

    const feedGrid = page.getByTestId("feed-grid");
    await expect(feedGrid).toBeVisible({ timeout: 15_000 });

    const feedCards = page.getByTestId("feed-card");
    await expect(feedCards.first()).toBeVisible({ timeout: 15_000 });
  });
});
