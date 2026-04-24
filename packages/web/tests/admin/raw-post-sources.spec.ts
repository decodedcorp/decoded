/**
 * E2E — Admin raw_post_sources management (#327).
 *
 * Exercises the admin UI at /admin/seed/raw-post-sources through a single
 * end-to-end flow (create → toggle → edit interval → delete). Cannot seed DB
 * rows directly: `warehouse` schema is not exposed via PostgREST, so each
 * scenario funnels through the UI / api-server proxy path we actually ship.
 *
 * The auth.setup.ts user must have `is_admin=true` in public.users.
 */
import { test, expect } from "@playwright/test";

const TAG = `e2e-327-${Date.now()}`;
const IDENTIFIER = `e2e-327/${TAG}`;

test.describe("admin raw_post_sources", () => {
  test("sidebar link navigates to the sources page", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: /^Sources$/ }).click();
    await expect(page).toHaveURL(/\/admin\/seed\/raw-post-sources/);
    await expect(
      page.getByRole("heading", { name: "Raw Post Sources" })
    ).toBeVisible();
  });

  test("create → toggle → interval edit → delete roundtrip", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: /^Sources$/ }).click();
    await expect(page).toHaveURL(/\/admin\/seed\/raw-post-sources/);
    await expect(
      page.getByRole("heading", { name: "Raw Post Sources" })
    ).toBeVisible({ timeout: 10_000 });

    // --- create ---
    await page
      .getByRole("button", { name: /New Source/ })
      .first()
      .click();
    await page.getByPlaceholder(/user\/board-slug/).fill(IDENTIFIER);
    await page.getByPlaceholder(/Jennie/).fill(`${TAG}-label`);
    await page.getByRole("button", { name: "Create" }).click();

    const row = page.getByRole("row", { name: new RegExp(TAG) });
    await expect(row).toBeVisible({ timeout: 8_000 });
    await expect(row.getByText(IDENTIFIER)).toBeVisible();
    await expect(row.getByText(/^active$/i)).toBeVisible();
    await expect(row.getByRole("button", { name: /^1h$/ })).toBeVisible();

    // --- toggle is_active: active → hidden ---
    await row.getByText(/^active$/i).click();
    await expect(row.getByText(/^hidden$/i)).toBeVisible({ timeout: 5_000 });

    // --- inline interval edit: 1h → 2h ---
    await row.getByRole("button", { name: /^1h$/ }).click();
    const input = row.getByRole("spinbutton");
    await input.fill("7200");
    await row.getByRole("button", { name: "save" }).click();
    await expect(row.getByRole("button", { name: /^2h$/ })).toBeVisible({
      timeout: 5_000,
    });

    // --- delete via confirm modal ---
    await row.getByTitle(/Delete source/).click();
    await expect(page.getByText(/Delete Source/)).toBeVisible();
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await expect(row).toHaveCount(0, { timeout: 5_000 });
  });

  test("active filter narrows to is_active=true rows", async ({ page }) => {
    // Seed two via UI: one active, one we'll deactivate
    await page.goto("/admin");
    await page.getByRole("link", { name: /^Sources$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Raw Post Sources" })
    ).toBeVisible({ timeout: 10_000 });

    const aId = `e2e-327-filter-a/${TAG}`;
    const bId = `e2e-327-filter-b/${TAG}`;

    for (const [identifier, label] of [
      [aId, `${TAG}-a`],
      [bId, `${TAG}-b`],
    ] as const) {
      await page
        .getByRole("button", { name: /New Source/ })
        .first()
        .click();
      await page.getByPlaceholder(/user\/board-slug/).fill(identifier);
      await page.getByPlaceholder(/Jennie/).fill(label);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(page.getByText(label)).toBeVisible({ timeout: 8_000 });
    }

    // Deactivate row B
    const rowB = page.getByRole("row", { name: new RegExp(`${TAG}-b`) });
    await rowB.getByText(/^active$/i).click();
    await expect(rowB.getByText(/^hidden$/i)).toBeVisible({ timeout: 5_000 });

    // Filter: Active
    await page.getByRole("button", { name: /^Active$/ }).click();
    await expect(page.getByText(`${TAG}-a`)).toBeVisible();
    await expect(page.getByText(`${TAG}-b`)).toHaveCount(0);

    // Filter: Inactive
    await page.getByRole("button", { name: /^Inactive$/ }).click();
    await expect(page.getByText(`${TAG}-b`)).toBeVisible();
    await expect(page.getByText(`${TAG}-a`)).toHaveCount(0);

    // Cleanup — delete both via "All" filter
    await page.getByRole("button", { name: /^All$/ }).click();
    for (const label of [`${TAG}-a`, `${TAG}-b`]) {
      const row = page.getByRole("row", { name: new RegExp(label) });
      await row.getByTitle(/Delete source/).click();
      await page.getByRole("button", { name: /^Delete$/ }).click();
      await expect(row).toHaveCount(0, { timeout: 5_000 });
    }
  });
});
