/**
 * @vitest-environment jsdom
 *
 * GroupMembersPage empty / loading / error state tests.
 *
 * Group members has no search/status filter, so isEmpty is simply:
 * not loading AND not error AND no rows.
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
const useGroupMemberListMock = vi.fn();

vi.mock("@/lib/api/admin/entities", () => ({
  useGroupMemberList: (...args: unknown[]) => useGroupMemberListMock(...args),
}));

import GroupMembersPage from "../page";

beforeEach(() => {
  useGroupMemberListMock.mockReset();
});

describe("GroupMembersPage — empty state", () => {
  test("renders AdminEmptyState when no data", () => {
    useGroupMemberListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<GroupMembersPage />);

    expect(screen.getByText("No group members")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Artist–group relationships will appear here once they are seeded."
      )
    ).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    useGroupMemberListMock.mockReturnValue({
      data: {
        data: [
          {
            artist_id: "artist-uuid-1234",
            group_id: "group-uuid-5678",
            is_active: true,
            metadata: null,
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

    render(<GroupMembersPage />);

    expect(screen.queryByText("No group members")).not.toBeInTheDocument();
    // row data is rendered (truncated artist_id prefix)
    expect(screen.getByText("artist-u…")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    useGroupMemberListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<GroupMembersPage />);

    expect(
      screen.getByText(
        "Failed to load group members. Please try refreshing the page."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("No group members")).not.toBeInTheDocument();
  });
});
