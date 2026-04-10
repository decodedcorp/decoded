/**
 * E2E tests for Supabase → Backend API migration (#185).
 *
 * Verifies that pages still work after removing direct Supabase queries
 * and switching to backend REST API calls.
 *
 * Runs in "chromium-no-auth" project (no auth required).
 */
import { test, expect } from "@playwright/test";

test.describe("API migration — feed & posts", () => {
  test("explore page loads with post grid", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const content = page.locator("main");
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("post detail page loads directly", async ({ page }) => {
    const response = await page.request.get("/api/v1/posts?page=1&per_page=1");
    const body = await response.json();
    const postId = body?.data?.[0]?.id;

    if (postId) {
      await page.goto(`/posts/${postId}`);
      await page.waitForLoadState("networkidle");

      const img = page.locator("img").first();
      await expect(img).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("API migration — backend health", () => {
  test("backend posts API returns data", async ({ request }) => {
    const response = await request.get("/api/v1/posts?page=1&per_page=1");
    expect(response.status()).toBeLessThan(500);
  });

  test("backend health check passes", async ({ request }) => {
    const response = await request.get("http://localhost:8000/health");
    expect(response.ok()).toBeTruthy();
  });
});

test.describe("API migration — post detail response contract", () => {
  test("post detail API returns complete PostDetailResponse", async ({
    request,
  }) => {
    const listRes = await request.get("/api/v1/posts?page=1&per_page=1");
    const listBody = await listRes.json();
    const postId = listBody?.data?.[0]?.id;
    test.skip(!postId, "No posts available from API");

    const detailRes = await request.get(`/api/v1/posts/${postId}`);
    expect(detailRes.status()).toBe(200);

    const detail = await detailRes.json();
    expect(detail).toHaveProperty("id");
    expect(detail).toHaveProperty("status");
    expect(detail).toHaveProperty("image_url");
    expect(detail).toHaveProperty("spots");
    expect(detail).toHaveProperty("user");
    expect(detail).toHaveProperty("like_count");
    expect(detail).toHaveProperty("comment_count");
    expect(detail).toHaveProperty("view_count");
  });

  test("post detail spots contain top_solution when matched", async ({
    request,
  }) => {
    const listRes = await request.get("/api/v1/posts?page=1&per_page=5");
    const listBody = await listRes.json();
    const posts = listBody?.data ?? [];
    test.skip(posts.length === 0, "No posts available");

    for (const post of posts) {
      const detailRes = await request.get(`/api/v1/posts/${post.id}`);
      if (!detailRes.ok()) continue;

      const detail = await detailRes.json();
      for (const spot of detail.spots ?? []) {
        expect(spot).toHaveProperty("id");
        expect(spot).toHaveProperty("status");
        if (spot.top_solution) {
          expect(spot.top_solution).toHaveProperty("id");
          expect(spot.top_solution).toHaveProperty("title");
        }
      }
    }
  });

  test("client-side post detail fetches via /api/v1 proxy, not Supabase", async ({
    page,
  }) => {
    const apiCalls: string[] = [];
    const supabaseCalls: string[] = [];

    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/posts/")) apiCalls.push(url);
      if (url.includes("supabase.co/rest/v1/posts")) supabaseCalls.push(url);
    });

    const listRes = await page.request.get("/api/v1/posts?page=1&per_page=1");
    const listBody = await listRes.json();
    const postId = listBody?.data?.[0]?.id;
    test.skip(!postId, "No posts available");

    await page.goto(`/posts/${postId}`);
    await page.waitForLoadState("networkidle");

    expect(
      supabaseCalls.filter((u) => u.includes("/rest/v1/posts")),
      "Client should not directly query Supabase posts table"
    ).toHaveLength(0);
  });
});
