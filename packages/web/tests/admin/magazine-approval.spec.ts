/**
 * E2E — Admin magazine approval flow.
 *
 * Exercises the full loop: pending list → approve / reject / unpublish, and
 * verifies server-side side effects via a service_role Supabase client
 * (status transitions + audit log rows).
 *
 * Env requirements (test is skipped if any are missing):
 * - NEXT_PUBLIC_DATABASE_API_URL
 * - DATABASE_SERVICE_ROLE_KEY
 *
 * The test user seeded by auth.setup.ts must have an admin row in
 * public.admin_users (or whichever table checkIsAdmin consults) — otherwise
 * the Magazines tab will 403 and all assertions will fail.
 */
import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DATABASE_API_URL = process.env.NEXT_PUBLIC_DATABASE_API_URL;
const SERVICE_ROLE_KEY = process.env.DATABASE_SERVICE_ROLE_KEY;

const skipReason = !DATABASE_API_URL
  ? "NEXT_PUBLIC_DATABASE_API_URL missing"
  : !SERVICE_ROLE_KEY
    ? "DATABASE_SERVICE_ROLE_KEY missing"
    : null;

test.describe("admin magazine approval", () => {
  test.skip(!!skipReason, skipReason ?? "");

  let admin: SupabaseClient;
  let magazineId: string;

  test.beforeAll(() => {
    admin = createClient(DATABASE_API_URL!, SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  test.beforeEach(async () => {
    const { data, error } = await admin
      .from("post_magazines")
      .insert({
        title: `E2E Test Magazine ${Date.now()}`,
        subtitle: "E2E fixture",
        keyword: "e2e",
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`Failed to seed magazine: ${error?.message}`);
    }
    magazineId = data.id as string;
  });

  test.afterEach(async () => {
    if (!magazineId) return;
    await admin.from("post_magazines").delete().eq("id", magazineId);
  });

  test("approves a pending magazine", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines&status=pending");

    const row = page.getByRole("row", {
      name: new RegExp(`E2E Test Magazine`),
    });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /approve/i }).click();

    await expect
      .poll(async () => {
        const { data } = await admin
          .from("post_magazines")
          .select("status, approved_by, published_at")
          .eq("id", magazineId)
          .single();
        return data?.status;
      })
      .toBe("published");

    const { data: final } = await admin
      .from("post_magazines")
      .select("approved_by, published_at")
      .eq("id", magazineId)
      .single();
    expect(final?.approved_by).not.toBeNull();
    expect(final?.published_at).not.toBeNull();
  });

  test("rejects with required reason", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines&status=pending");

    const row = page.getByRole("row", {
      name: new RegExp(`E2E Test Magazine`),
    });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /^reject$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Submit button is disabled until reason typed
    const submit = dialog.getByRole("button", { name: /^reject$/i });
    await expect(submit).toBeDisabled();

    await dialog.getByRole("textbox").fill("Off-topic content");
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect
      .poll(async () => {
        const { data } = await admin
          .from("post_magazines")
          .select("status, rejection_reason")
          .eq("id", magazineId)
          .single();
        return data?.status;
      })
      .toBe("rejected");

    const { data: final } = await admin
      .from("post_magazines")
      .select("rejection_reason")
      .eq("id", magazineId)
      .single();
    expect(final?.rejection_reason).toBe("Off-topic content");
  });

  test("writes an audit log entry on approval", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines&status=pending");

    const row = page.getByRole("row", {
      name: new RegExp(`E2E Test Magazine`),
    });
    await row.getByRole("button", { name: /approve/i }).click();

    await expect
      .poll(async () => {
        const { data } = await admin
          .schema("warehouse")
          .from("admin_audit_log")
          .select("action")
          .eq("target_id", magazineId)
          .eq("action", "magazine_approve");
        return data?.length ?? 0;
      })
      .toBeGreaterThan(0);
  });
});
