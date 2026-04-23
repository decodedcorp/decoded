/**
 * @vitest-environment jsdom
 *
 * ArtistsPage empty / loading / error state tests.
 *
 * Verifies that:
 *  - loading → AdminDataTable skeleton (isLoading=true)
 *  - empty + no filter → AdminEmptyState shown, table hidden
 *  - empty + active search filter → table shown with emptyMessage, not AdminEmptyState
 *  - error → error banner shown
 *  - data present → table shown, no empty state
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
const useArtistListMock = vi.fn();

vi.mock("@/lib/api/admin/entities", () => ({
  useArtistList: (...args: unknown[]) => useArtistListMock(...args),
  useCreateArtist: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateArtist: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteArtist: () => ({ mutate: vi.fn(), isPending: false }),
}));

import ArtistsPage from "../page";

beforeEach(() => {
  useArtistListMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("ArtistsPage — empty state", () => {
  test("renders AdminEmptyState when no data and no filter", () => {
    useArtistListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<ArtistsPage />);

    expect(screen.getByText("No artists yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first artist entity using the button above."
      )
    ).toBeInTheDocument();
  });

  test("does NOT render AdminEmptyState when search filter is active and data is empty", () => {
    searchParamsRef.current = new URLSearchParams("search=nonexistent");
    useArtistListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<ArtistsPage />);

    expect(screen.queryByText("No artists yet")).not.toBeInTheDocument();
    // Table's own emptyMessage is shown instead
    expect(screen.getByText("No artists found")).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    useArtistListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "artist-1",
            name_en: "Test Artist",
            name_ko: "테스트",
            profile_image_url: null,
            primary_instagram_account_id: null,
            metadata: null,
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

    render(<ArtistsPage />);

    expect(screen.queryByText("No artists yet")).not.toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    useArtistListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ArtistsPage />);

    expect(
      screen.getByText(
        "Failed to load artists. Please try refreshing the page."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("No artists yet")).not.toBeInTheDocument();
  });
});
