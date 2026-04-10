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

/** Mock response for post detail */
const MOCK_POST_DETAIL = {
  doc_id: "post-1",
  image_url: "https://placehold.co/800x1200",
  like_count: 10,
  is_liked: false,
  is_saved: false,
  created_at: "2025-01-01T00:00:00Z",
  post_account: { name: "test-user", profile_image: null },
  items: [
    {
      doc_id: "item-1",
      label: "Dress",
      position: { x: 0.5, y: 0.3 },
      solutions: [
        {
          doc_id: "sol-1",
          brand: "TestBrand",
          name: "Test Dress",
          link: "https://example.com",
          is_adopted: false,
        },
      ],
    },
  ],
};

/** Mock search response */
const MOCK_SEARCH_RESPONSE = {
  data: MOCK_POSTS_RESPONSE.data,
  pagination: MOCK_POSTS_RESPONSE.pagination,
};

/**
 * Set up common API mocks for content consumption tests.
 * Mocks posts listing, search, post detail, and feed endpoints.
 */
export async function mockContentAPIs(page: Page) {
  // Search endpoint
  await page.route("**/api/v1/search?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SEARCH_RESPONSE),
    });
  });

  // Posts listing (used by explore browse mode AND feed)
  await page.route("**/api/v1/posts?*", async (route) => {
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

  // Post detail — match /api/v1/posts/{id} (not /api/v1/posts?query)
  await page.route(/\/api\/v1\/posts\/[^?]+$/, async (route) => {
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

export { MOCK_POSTS_RESPONSE, MOCK_POST_DETAIL, MOCK_SEARCH_RESPONSE };
