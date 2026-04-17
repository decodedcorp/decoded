/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RejectModal } from "../RejectModal";

describe("RejectModal", () => {
  it("does not render when open=false", () => {
    render(<RejectModal open={false} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog with required reason field when open", () => {
    render(<RejectModal open onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("disables Reject button when reason is empty", () => {
    render(<RejectModal open onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeDisabled();
  });

  it("enables Reject after typing non-empty reason", () => {
    render(<RejectModal open onClose={() => {}} onSubmit={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "off-topic" },
    });
    expect(
      screen.getByRole("button", { name: /^reject$/i })
    ).not.toBeDisabled();
  });

  it("calls onSubmit with trimmed reason", () => {
    const onSubmit = vi.fn();
    render(<RejectModal open onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  off-topic  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^reject$/i }));
    expect(onSubmit).toHaveBeenCalledWith("off-topic");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<RejectModal open onClose={onClose} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables form while submitting", () => {
    render(
      <RejectModal open onClose={() => {}} onSubmit={() => {}} submitting />
    );
    // textarea filled to ensure Reject would otherwise enable
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "off-topic" },
    });
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
