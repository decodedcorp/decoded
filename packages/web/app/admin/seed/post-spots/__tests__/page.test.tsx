/**
 * @vitest-environment jsdom
 *
 * PostSpotsPage empty / loading / error state tests.
 *
 * Post spots has no filter, so isEmpty = not loading AND not error AND no rows.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mock next/navigation ---
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

// --- Mock the data hooks ---
const usePostSpotListMock = vi.fn();

vi.mock("@/lib/api/admin/seed", () => ({
  usePostSpotList: (...args: unknown[]) => usePostSpotListMock(...args),
  usePostImageList: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

import PostSpotsPage from "../page";

beforeEach(() => {
  usePostSpotListMock.mockReset();
});

describe("PostSpotsPage — empty state", () => {
  test("renders AdminEmptyState when no data", () => {
    usePostSpotListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<PostSpotsPage />);

    expect(screen.getByText("No spots annotated yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Spots are created during the seed curation process and will appear here once available."
      )
    ).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    usePostSpotListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "spot-1",
            seed_post_id: "post-uuid-1234",
            position_left: "0.5",
            position_top: "0.3",
            request_order: 1,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_items: 1,
          total_pages: 1,
        },
      },
      isLoading: false,
      isError: false,
    });

    render(<PostSpotsPage />);

    expect(
      screen.queryByText("No spots annotated yet")
    ).not.toBeInTheDocument();
    // row data is rendered (truncated post id)
    expect(screen.getByText("post-uui…")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    usePostSpotListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<PostSpotsPage />);

    expect(
      screen.getByText(
        "Failed to load post spots. Please try refreshing the page."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No spots annotated yet")
    ).not.toBeInTheDocument();
  });
});
