/**
 * @vitest-environment jsdom
 *
 * ContentManagementPage empty state tests.
 *
 * Verifies that when the posts/reports lists return no entries (and no
 * filter is active), the page renders the shared <AdminEmptyState/>
 * component for each tab. When data is present, the corresponding table
 * is rendered instead.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks for next/navigation (drives the active tab) ---

const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsRef.current,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

// --- Mocks for the data hooks ---

const useAdminPostListMock = vi.fn();
const useAdminReportListMock = vi.fn();

vi.mock("@/lib/hooks/admin/useAdminPosts", () => ({
  useAdminPostList: (...args: unknown[]) => useAdminPostListMock(...args),
  useUpdatePostStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/hooks/admin/useAdminReports", () => ({
  useAdminReportList: (...args: unknown[]) => useAdminReportListMock(...args),
  useUpdateReportStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

// AdminPostTable / ReportTable are not the unit under test — replace with
// thin stubs so that the table's own "No posts found" / "No reports found"
// fallbacks don't collide with the page-level empty state we're verifying.
vi.mock("@/lib/components/admin/content/AdminPostTable", () => ({
  AdminPostTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="admin-post-table" data-rows={data.length} />
  ),
}));

vi.mock("@/lib/components/admin/content/ReportTable", () => ({
  ReportTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="report-table" data-rows={data.length} />
  ),
}));

import ContentManagementPage from "../page";

beforeEach(() => {
  useAdminPostListMock.mockReset();
  useAdminReportListMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("ContentManagementPage — posts tab empty state", () => {
  test("renders AdminEmptyState when posts data is empty", () => {
    searchParamsRef.current = new URLSearchParams();
    useAdminPostListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });
    useAdminReportListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });

    render(<ContentManagementPage />);

    expect(screen.getByText("No posts found")).toBeInTheDocument();
    expect(
      screen.getByText("Posts submitted by users will appear here.")
    ).toBeInTheDocument();
    // Table stub must not be rendered when empty state is up
    expect(screen.queryByTestId("admin-post-table")).not.toBeInTheDocument();
  });

  test("renders AdminPostTable when posts data has rows", () => {
    useAdminPostListMock.mockReturnValue({
      data: {
        data: [{ id: "p1" }],
        pagination: { current_page: 1, total_pages: 1 },
      },
      isLoading: false,
    });
    useAdminReportListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });

    render(<ContentManagementPage />);

    expect(screen.getByTestId("admin-post-table")).toBeInTheDocument();
    expect(screen.queryByText("No posts found")).not.toBeInTheDocument();
  });
});

describe("ContentManagementPage — reports tab empty state", () => {
  test("renders AdminEmptyState when reports data is empty", () => {
    searchParamsRef.current = new URLSearchParams("tab=reports");
    useAdminPostListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });
    useAdminReportListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });

    render(<ContentManagementPage />);

    expect(screen.getByText("No reports to review")).toBeInTheDocument();
    expect(
      screen.getByText(
        "User-submitted reports will appear here for moderation."
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId("report-table")).not.toBeInTheDocument();
  });

  test("renders ReportTable when reports data has rows", () => {
    searchParamsRef.current = new URLSearchParams("tab=reports");
    useAdminPostListMock.mockReturnValue({
      data: { data: [], pagination: { current_page: 1, total_pages: 1 } },
      isLoading: false,
    });
    useAdminReportListMock.mockReturnValue({
      data: {
        data: [{ id: "r1" }],
        pagination: { current_page: 1, total_pages: 1 },
      },
      isLoading: false,
    });

    render(<ContentManagementPage />);

    expect(screen.getByTestId("report-table")).toBeInTheDocument();
    expect(screen.queryByText("No reports to review")).not.toBeInTheDocument();
  });
});
