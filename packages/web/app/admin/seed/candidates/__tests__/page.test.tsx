/**
 * @vitest-environment jsdom
 *
 * CandidatesPage (seed) empty / loading / error state tests.
 *
 * Filter: currentStatus || searchQuery (from URL params).
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
const useCandidateListMock = vi.fn();

vi.mock("@/lib/api/admin/candidates", () => ({
  useCandidateList: (...args: unknown[]) => useCandidateListMock(...args),
  useApproveCandidate: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCandidate: () => ({ mutate: vi.fn(), isPending: false }),
}));

import CandidatesPage from "../page";

beforeEach(() => {
  useCandidateListMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("CandidatesPage — empty state", () => {
  test("renders AdminEmptyState when no data and no filter", () => {
    useCandidateListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<CandidatesPage />);

    expect(screen.getByText("No candidates yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Seed post candidates will appear here once the ETL pipeline runs."
      )
    ).toBeInTheDocument();
  });

  test("does NOT render AdminEmptyState when status filter is active and data is empty", () => {
    searchParamsRef.current = new URLSearchParams("status=draft");
    useCandidateListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<CandidatesPage />);

    expect(screen.queryByText("No candidates yet")).not.toBeInTheDocument();
    expect(screen.getByText("No candidates found")).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    useCandidateListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "cand-1",
            image_url: "https://example.com/img.jpg",
            status: "draft",
            context: null,
            artist_account_id: null,
            group_account_id: null,
            source_post_id: null,
            source_image_id: null,
            backend_post_id: null,
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

    render(<CandidatesPage />);

    expect(screen.queryByText("No candidates yet")).not.toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    useCandidateListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<CandidatesPage />);

    expect(
      screen.getByText(
        "Failed to load candidates. Please try refreshing the page."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("No candidates yet")).not.toBeInTheDocument();
  });
});
