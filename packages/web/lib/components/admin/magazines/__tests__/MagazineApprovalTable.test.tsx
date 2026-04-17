/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MagazineApprovalTable } from "../MagazineApprovalTable";
import type { AdminMagazineListItem } from "@/lib/api/admin/magazines";

const baseItem: AdminMagazineListItem = {
  id: "m1",
  title: "Sample Magazine",
  status: "pending",
  keyword: "spring",
  subtitle: "A seasonal preview",
  published_at: null,
  rejection_reason: null,
  approved_by: null,
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

describe("MagazineApprovalTable", () => {
  it("renders title, keyword and status", () => {
    render(
      <MagazineApprovalTable
        items={[baseItem]}
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.getByText("Sample Magazine")).toBeInTheDocument();
    expect(screen.getByText("spring")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("fires onApprove with item id", () => {
    const onApprove = vi.fn();
    render(
      <MagazineApprovalTable
        items={[baseItem]}
        onApprove={onApprove}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledWith("m1");
  });

  it("fires onReject and onRevert with item id per row status", () => {
    const onReject = vi.fn();
    const onRevert = vi.fn();
    const items: AdminMagazineListItem[] = [
      baseItem,
      { ...baseItem, id: "m2", status: "published" },
    ];
    render(
      <MagazineApprovalTable
        items={items}
        onApprove={() => {}}
        onReject={onReject}
        onRevert={onRevert}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    fireEvent.click(screen.getByRole("button", { name: /unpublish/i }));
    expect(onReject).toHaveBeenCalledWith("m1");
    expect(onRevert).toHaveBeenCalledWith("m2");
  });

  it("disables row actions for mutatingId match", () => {
    render(
      <MagazineApprovalTable
        items={[baseItem]}
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
        mutatingId="m1"
      />
    );
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDisabled();
  });

  it("falls back to placeholders for missing fields", () => {
    const bare: AdminMagazineListItem = {
      ...baseItem,
      title: "",
      keyword: null,
      subtitle: null,
    };
    render(
      <MagazineApprovalTable
        items={[bare]}
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.getByText("Untitled")).toBeInTheDocument();
    // keyword cell shows em-dash fallback
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
