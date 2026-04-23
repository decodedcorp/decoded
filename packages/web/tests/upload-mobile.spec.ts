/**
 * E2E for the intercept modal under mobile viewport.
 *
 * Covers #145 PR-4 Section 9 / D5: iPhone SE viewport should render the
 * intercepting RequestFlowModal with `mobileFullScreen=true`, producing a
 * dialog that spans the full viewport width.
 */
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone SE (3rd gen)"] });

test.describe("Upload intercept modal — mobile", () => {
  test("mobile viewport → intercept modal is full-screen", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /upload/i })
      .first()
      .click();

    const dialog = page.getByTestId("request-flow-modal-dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    const box = await dialog.boundingBox();
    // iPhone SE width is 375 — allow ~5px margin for scrollbar / DPR rounding.
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(370);
  });
});
