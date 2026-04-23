/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DiscardProgressDialog } from "@/lib/components/request/DiscardProgressDialog";

// jsdom은 HTMLDialogElement.showModal을 구현하지 않음 — 폴리필
function polyfillDialog() {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
  }
}

describe("DiscardProgressDialog", () => {
  test("renders when open=true", () => {
    polyfillDialog();
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.getByText("Discard progress?")).toBeInTheDocument();
  });

  test("calls onCancel when Cancel button clicked", () => {
    polyfillDialog();
    const onCancel = vi.fn();
    render(
      <DiscardProgressDialog open onCancel={onCancel} onConfirm={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("calls onConfirm when Discard button clicked", () => {
    polyfillDialog();
    const onConfirm = vi.fn();
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByText("Discard and go back"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("Escape keydown inside dialog stops propagation", () => {
    polyfillDialog();
    const outerHandler = vi.fn();
    window.addEventListener("keydown", outerHandler);
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />
    );
    const dialog = document.querySelector("dialog");
    fireEvent.keyDown(dialog!, { key: "Escape" });
    expect(outerHandler).not.toHaveBeenCalled();
    window.removeEventListener("keydown", outerHandler);
  });
});
