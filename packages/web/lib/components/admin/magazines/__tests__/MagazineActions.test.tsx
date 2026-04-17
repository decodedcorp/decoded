/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MagazineActions } from "../MagazineActions";

describe("MagazineActions", () => {
  it("renders Approve + Reject for pending", () => {
    render(
      <MagazineActions
        status="pending"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /approve/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /unpublish/i })).toBeNull();
  });

  it("renders Unpublish only for published", () => {
    render(
      <MagazineActions
        status="published"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /unpublish/i })
    ).toBeInTheDocument();
  });

  it("renders placeholder for draft and rejected", () => {
    const { rerender } = render(
      <MagazineActions
        status="draft"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <MagazineActions
        status="rejected"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("fires onApprove / onReject callbacks", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <MagazineActions
        status="pending"
        onApprove={onApprove}
        onReject={onReject}
        onRevert={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("fires onRevert when Unpublish clicked", () => {
    const onRevert = vi.fn();
    render(
      <MagazineActions
        status="published"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={onRevert}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /unpublish/i }));
    expect(onRevert).toHaveBeenCalledOnce();
  });

  it("honors disabled prop", () => {
    render(
      <MagazineActions
        status="pending"
        disabled
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDisabled();
  });
});
