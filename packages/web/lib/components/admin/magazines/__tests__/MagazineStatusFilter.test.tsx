/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MagazineStatusFilter } from "../MagazineStatusFilter";

describe("MagazineStatusFilter", () => {
  it("renders All + 4 status buttons", () => {
    render(<MagazineStatusFilter value={undefined} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pending/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /published/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /draft/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rejected/i })
    ).toBeInTheDocument();
  });

  it("calls onChange with selected status when a status button is clicked", () => {
    const onChange = vi.fn();
    render(<MagazineStatusFilter value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /pending/i }));
    expect(onChange).toHaveBeenCalledWith("pending");
  });

  it("calls onChange with undefined when All is clicked", () => {
    const onChange = vi.fn();
    render(<MagazineStatusFilter value="pending" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("marks the active button with aria-pressed", () => {
    render(<MagazineStatusFilter value="pending" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /pending/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
