/**
 * E2E tests for engagement mutations on post detail page.
 * Verifies that like/save/adopt actually trigger API calls and update UI state.
 */
import { test, expect, Page } from "@playwright/test";
import { mockContentAPIs } from "./helpers";

/**
 * Set up engagement API mocks with request tracking.
 */
async function mockEngagementWithTracking(page: Page) {
  const calls = {
    likePost: 0,
    likeDelete: 0,
    savePost: 0,
    saveDelete: 0,
    adoptPost: 0,
  };

  await page.route(/\/api\/v1\/posts\/[\w-]+\/likes/, async (route) => {
    const method = route.request().method();
    if (method === "POST") calls.likePost++;
    if (method === "DELETE") calls.likeDelete++;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ liked: method === "POST" }),
    });
  });

  await page.route(/\/api\/v1\/posts\/[\w-]+\/saved/, async (route) => {
    const method = route.request().method();
    if (method === "POST") calls.savePost++;
    if (method === "DELETE") calls.saveDelete++;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ saved: method === "POST" }),
    });
  });

  await page.route(/\/api\/v1\/solutions\/[\w-]+\/adopt/, async (route) => {
    if (route.request().method() === "POST") calls.adoptPost++;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ adopted: true }),
    });
  });

  // Comment count (called by useCommentCount)
  await page.route(
    /\/api\/v1\/posts\/[\w-]+\/comments(\?|$)/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
  );

  return calls;
}

test.describe("Engagement mutations", () => {
  test.beforeEach(async ({ page }) => {
    await mockContentAPIs(page);
  });

  test("like button toggles and calls API (POST → DELETE)", async ({
    page,
  }) => {
    const calls = await mockEngagementWithTracking(page);

    await page.goto("/posts/post-1");

    const likeButton = page.getByTestId("like-button");
    await likeButton.scrollIntoViewIfNeeded();
    await expect(likeButton).toBeVisible({ timeout: 15_000 });

    // First click → POST
    await likeButton.click();
    await expect.poll(() => calls.likePost, { timeout: 5_000 }).toBe(1);

    // Heart should be filled red
    await expect(likeButton.locator("svg.fill-red-500")).toBeVisible({
      timeout: 3_000,
    });

    // Second click → DELETE
    await likeButton.click();
    await expect.poll(() => calls.likeDelete, { timeout: 5_000 }).toBe(1);
  });

  test("save button toggles and calls API (POST → DELETE)", async ({
    page,
  }) => {
    const calls = await mockEngagementWithTracking(page);

    await page.goto("/posts/post-1");

    const saveButton = page.getByTestId("save-button");
    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeVisible({ timeout: 15_000 });

    await saveButton.click();
    await expect.poll(() => calls.savePost, { timeout: 5_000 }).toBe(1);

    await expect(saveButton.locator("svg.fill-primary")).toBeVisible({
      timeout: 3_000,
    });

    await saveButton.click();
    await expect.poll(() => calls.saveDelete, { timeout: 5_000 }).toBe(1);
  });

  test("like and save are independent mutations", async ({ page }) => {
    const calls = await mockEngagementWithTracking(page);

    await page.goto("/posts/post-1");

    const likeButton = page.getByTestId("like-button");
    const saveButton = page.getByTestId("save-button");

    await likeButton.scrollIntoViewIfNeeded();
    await expect(likeButton).toBeVisible({ timeout: 15_000 });

    await likeButton.click();
    await expect.poll(() => calls.likePost, { timeout: 5_000 }).toBe(1);
    expect(calls.savePost).toBe(0);

    await saveButton.click();
    await expect.poll(() => calls.savePost, { timeout: 5_000 }).toBe(1);
    expect(calls.likePost).toBe(1); // unchanged
  });

  test("post detail page renders item cards and shop section", async ({
    page,
  }) => {
    await page.goto("/posts/post-1");

    const itemCard = page.getByTestId("item-detail-card");
    await expect(itemCard.first()).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText("Shop the Look").first()).toBeVisible();
  });

  test("back button navigates away from post detail", async ({ page }) => {
    await page.goto("/posts/post-1");

    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible({ timeout: 15_000 });

    await backButton.click();
    await expect(page).not.toHaveURL(/\/posts\/post-1/);
  });
});
