/**
 * Shared test helpers for E2E tests.
 * Provides API mock setup and common navigation utilities.
 */
import { Page } from "@playwright/test";

/** Mock response matching PaginatedResponsePostListItemDataItem */
const MOCK_POSTS_RESPONSE = {
  data: [
    {
      doc_id: "post-1",
      image_url: "https://placehold.co/400x600",
      like_count: 10,
      created_at: "2025-01-01T00:00:00Z",
      item_count: 2,
      post_account: { name: "test-user", profile_image: null },
    },
    {
      doc_id: "post-2",
      image_url: "https://placehold.co/400x600",
      like_count: 5,
      created_at: "2025-01-02T00:00:00Z",
      item_count: 1,
      post_account: { name: "test-user-2", profile_image: null },
    },
  ],
  pagination: {
    current_page: 1,
    per_page: 20,
    total_items: 2,
    total_pages: 1,
  },
};

/** Mock response matching PostDetailResponse */
const MOCK_POST_DETAIL = {
  id: "post-1",
  image_url: "https://placehold.co/800x1200",
  like_count: 10,
  comment_count: 0,
  view_count: 100,
  status: "extracted",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  user_has_liked: false,
  user_has_saved: false,
  user: { id: "user-1", username: "test-user", profile_image: null },
  media_source: { type: "upload", source_url: null },
  spots: [
    {
      id: "spot-1",
      position_left: "50%",
      position_top: "30%",
      status: "matched",
      created_at: "2025-01-01T00:00:00Z",
      top_solution: {
        id: "sol-1",
        title: "Test Dress",
        thumbnail_url: "https://placehold.co/100x100",
        original_url: "https://example.com",
        affiliate_url: null,
        metadata: { brand: "TestBrand" },
      },
    },
  ],
};

/**
 * Set up common API mocks for content consumption tests.
 */
export async function mockContentAPIs(page: Page) {
  // Post detail — /api/v1/posts/{id} (ends at id, not followed by /sub-resource)
  // Register FIRST so it takes precedence over listing pattern
  await page.route(/\/api\/v1\/posts\/[\w-]+$/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_POST_DETAIL),
      });
    } else {
      await route.continue();
    }
  });

  // Search endpoint
  await page.route(/\/api\/v1\/search(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_POSTS_RESPONSE),
    });
  });

  // Posts listing (explore browse + home feed) — only matches /api/v1/posts?...
  await page.route(/\/api\/v1\/posts\?/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_POSTS_RESPONSE),
      });
    } else {
      await route.continue();
    }
  });

  // Feed endpoint
  await page.route("**/api/v1/feed*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_POSTS_RESPONSE),
    });
  });
}

/**
 * Mock engagement endpoints (like, save, adopt).
 */
export async function mockEngagementAPIs(page: Page) {
  // Like toggle (POST/DELETE /api/v1/posts/{postId}/likes)
  await page.route("**/api/v1/posts/*/likes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ liked: route.request().method() === "POST" }),
    });
  });

  // Save toggle (POST/DELETE /api/v1/posts/{postId}/saved)
  await page.route("**/api/v1/posts/*/saved", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ saved: route.request().method() === "POST" }),
    });
  });

  // Adopt solution (POST/DELETE /api/v1/solutions/{solutionId}/adopt)
  await page.route("**/api/v1/solutions/*/adopt", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ adopted: route.request().method() === "POST" }),
    });
  });
}

export { MOCK_POSTS_RESPONSE, MOCK_POST_DETAIL };
