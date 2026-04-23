/**
 * @vitest-environment jsdom
 *
 * EditorialCandidatesPage empty state tests.
 *
 * Verifies that when the candidates list is empty, the page renders the
 * shared <AdminEmptyState/> component (wrapped in a card container) instead
 * of the table's own placeholder. When data is present, the table is
 * rendered as before.
 *
 * The page has no filters — only pagination — so a simple length===0 check
 * drives the empty state.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks for next/navigation ---

const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsRef.current,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

// --- Mocks for the data hooks ---

const useEditorialCandidatesMock = vi.fn();
const useGenerateEditorialMock = vi.fn();

vi.mock("@/lib/hooks/admin/useEditorialCandidates", () => ({
  useEditorialCandidates: (...args: unknown[]) =>
    useEditorialCandidatesMock(...args),
  useGenerateEditorial: (...args: unknown[]) =>
    useGenerateEditorialMock(...args),
}));

// CandidateTable is not the unit under test — replace with a thin stub so
// that its own "No eligible posts found" placeholder doesn't collide with
// the page-level empty state we're verifying.
vi.mock("@/lib/components/admin/editorial/CandidateTable", () => ({
  CandidateTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="candidate-table" data-rows={data.length} />
  ),
  CandidateTableSkeleton: () => <div data-testid="candidate-table-skeleton" />,
}));

import EditorialCandidatesPage from "../page";

beforeEach(() => {
  useEditorialCandidatesMock.mockReset();
  useGenerateEditorialMock.mockReset();
  useGenerateEditorialMock.mockReturnValue({
    mutate: vi.fn(),
    isError: false,
    isSuccess: false,
    error: null,
  });
  searchParamsRef.current = new URLSearchParams();
});

describe("EditorialCandidatesPage — empty state", () => {
  test("renders AdminEmptyState when candidates list is empty", () => {
    useEditorialCandidatesMock.mockReturnValue({
      data: { data: [], total: 0, page: 1, per_page: 20 },
      isLoading: false,
      isError: false,
    });

    render(<EditorialCandidatesPage />);

    expect(screen.getByText("No editorial candidates")).toBeInTheDocument();
    // CandidateTable stub must not be rendered when empty state is up
    expect(screen.queryByTestId("candidate-table")).not.toBeInTheDocument();
  });

  test("renders CandidateTable when at least one candidate exists", () => {
    useEditorialCandidatesMock.mockReturnValue({
      data: {
        data: [
          {
            id: "post-1",
            image_url: "https://example.com/img.jpg",
            title: "Post 1",
            artist_name: "Artist",
            group_name: null,
            context: null,
            spot_count: 4,
            min_solutions_per_spot: 1,
            total_solution_count: 6,
            view_count: 100,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        per_page: 20,
      },
      isLoading: false,
      isError: false,
    });

    render(<EditorialCandidatesPage />);

    expect(screen.getByTestId("candidate-table")).toBeInTheDocument();
    expect(
      screen.queryByText("No editorial candidates")
    ).not.toBeInTheDocument();
  });

  test("renders skeleton while loading (empty state must not appear)", () => {
    useEditorialCandidatesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<EditorialCandidatesPage />);

    expect(screen.getByTestId("candidate-table-skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("No editorial candidates")
    ).not.toBeInTheDocument();
  });

  test("does not render empty state on error (skeleton fallback shown)", () => {
    useEditorialCandidatesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<EditorialCandidatesPage />);

    expect(
      screen.queryByText("No editorial candidates")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("candidate-table-skeleton")).toBeInTheDocument();
  });
});
