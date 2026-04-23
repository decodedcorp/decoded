/**
 * @vitest-environment jsdom
 *
 * PostImagesPage empty / loading / error state tests.
 *
 * Filter: currentStatus || currentWithItems (from URL params).
 * - no filter + empty → AdminEmptyState
 * - filter active + empty → table emptyMessage (not AdminEmptyState)
 * - data present → table rendered
 * - error → error banner
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mock next/navigation ---
const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsRef.current,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

// --- Mock the data hooks ---
const usePostImageListMock = vi.fn();

vi.mock("@/lib/api/admin/seed", () => ({
  usePostImageList: (...args: unknown[]) => usePostImageListMock(...args),
  usePostSpotList: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

import PostImagesPage from "../page";

beforeEach(() => {
  usePostImageListMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("PostImagesPage — empty state", () => {
  test("renders AdminEmptyState when no data and no filter", () => {
    usePostImageListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<PostImagesPage />);

    expect(screen.getByText("No post images yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "ETL-collected images from artist posts will appear here once the pipeline runs."
      )
    ).toBeInTheDocument();
  });

  test("does NOT render AdminEmptyState when status filter is active and data is empty", () => {
    searchParamsRef.current = new URLSearchParams("status=pending");
    usePostImageListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<PostImagesPage />);

    expect(screen.queryByText("No post images yet")).not.toBeInTheDocument();
    expect(screen.getByText("No images found")).toBeInTheDocument();
  });

  test("does NOT render AdminEmptyState when with_items filter is active and data is empty", () => {
    searchParamsRef.current = new URLSearchParams("with_items=true");
    usePostImageListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<PostImagesPage />);

    expect(screen.queryByText("No post images yet")).not.toBeInTheDocument();
    expect(screen.getByText("No images found")).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    usePostImageListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "img-1",
            image_url: "https://example.com/img.jpg",
            created_at: "2026-01-01T00:00:00Z",
            image_hash: "abc123",
            status: "pending",
            with_items: false,
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

    render(<PostImagesPage />);

    expect(screen.queryByText("No post images yet")).not.toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    usePostImageListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<PostImagesPage />);

    expect(
      screen.getByText(
        "Failed to load post images. Please try refreshing the page."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("No post images yet")).not.toBeInTheDocument();
  });
});
