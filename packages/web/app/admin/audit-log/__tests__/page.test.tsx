/**
 * @vitest-environment jsdom
 *
 * AuditLogPage empty state tests.
 *
 * Verifies that when the audit log returns no entries AND no filters are
 * active, the page renders the shared <AdminEmptyState/> component instead
 * of the data table. When filters are active or data exists, the table
 * should be rendered as before.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks for the data hook ---

const useAuditLogListMock = vi.fn();

vi.mock("@/lib/api/admin/audit-log-query", () => ({
  useAuditLogList: (...args: unknown[]) => useAuditLogListMock(...args),
}));

// AuditDiffViewer is a heavyweight component; stub it out so we don't pull
// non-essential deps (json diff libs etc.) into the unit test.
vi.mock("@/lib/components/admin/audit-log/AuditDiffViewer", () => ({
  AuditDiffViewer: () => <div data-testid="audit-diff-viewer-stub" />,
}));

import AuditLogPage from "../page";

beforeEach(() => {
  useAuditLogListMock.mockReset();
});

describe("AuditLogPage — empty state", () => {
  test("renders AdminEmptyState when no data AND no filters active", () => {
    useAuditLogListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
    });

    render(<AuditLogPage />);

    // AdminEmptyState title from Task 3 spec
    expect(screen.getByText("No audit log entries")).toBeInTheDocument();
    // The data table's empty message should NOT be shown in the empty state
    expect(
      screen.queryByText("No audit log entries found")
    ).not.toBeInTheDocument();
  });

  test("renders the data table when there is at least one entry", () => {
    useAuditLogListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "row-1",
            admin_user_id: "admin-1",
            action: "create",
            target_table: "artists",
            target_id: "target-1",
            before_state: null,
            after_state: { name: "Foo" },
            metadata: null,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 30,
          total_items: 1,
          total_pages: 1,
        },
      },
      isLoading: false,
    });

    render(<AuditLogPage />);

    // The empty state title must NOT appear when rows are present
    expect(screen.queryByText("No audit log entries")).not.toBeInTheDocument();
    // Table is rendered: the row's truncated target_id from fixture appears
    expect(screen.getByText("target-1")).toBeInTheDocument();
  });

  test("does NOT render empty state when data is empty but a filter is active", () => {
    useAuditLogListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
    });

    render(<AuditLogPage />);

    // Sanity: empty state is visible at first (no filters yet)
    expect(screen.getByText("No audit log entries")).toBeInTheDocument();

    // Activate the action filter — page state now has a non-empty filter
    const actionSelect = screen.getAllByRole("combobox")[0]!;
    fireEvent.change(actionSelect, { target: { value: "create" } });

    // With a filter active, the empty state must NOT be shown; the table's
    // own empty placeholder takes over instead.
    expect(screen.queryByText("No audit log entries")).not.toBeInTheDocument();
    expect(screen.getByText("No audit log entries found")).toBeInTheDocument();
  });
});
