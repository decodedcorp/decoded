/**
 * E2E for direct-URL /request/upload rendering.
 *
 * Covers #145 PR-4 Section 9 / D5: direct browser navigation should render
 * the full-page layout, NOT the RequestFlowModal dialog chrome. Intercept
 * behaviour is covered by upload-intercept.spec.ts.
 */
import { test, expect } from "@playwright/test";

test.describe("Upload direct URL", () => {
  test("direct navigation renders full-page, not modal dialog", async ({
    page,
  }) => {
    await page.goto("/request/upload");

    // Full-page: StepProgress + DropZone visible.
    await expect(page.getByText("Drag and drop images")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/Step 1 of/)).toBeVisible();

    // No modal chrome for direct URL.
    await expect(page.getByTestId("request-flow-modal-dialog")).toHaveCount(0);
    await expect(page.getByTestId("request-flow-modal-backdrop")).toHaveCount(
      0
    );
  });
});
