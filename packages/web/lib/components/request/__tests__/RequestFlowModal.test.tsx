/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn(),
    set: vi.fn(),
    fromTo: vi.fn(),
    timeline: (opts?: { onComplete?: () => void }) => {
      // Invoke onComplete synchronously so close-path tests work in jsdom
      opts?.onComplete?.();
      return { to: vi.fn() };
    },
    context: (fn: () => void) => {
      fn();
      return { add: (cb: () => void) => cb(), revert: vi.fn() };
    },
  },
  default: {},
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/stores/requestStore", () => ({
  getRequestActions: () => ({ resetRequestFlow: vi.fn() }),
}));

import { RequestFlowModal } from "../RequestFlowModal";

describe("RequestFlowModal — maxWidth prop", () => {
  beforeAll(() => {
    Object.defineProperty(window, "history", {
      value: { length: 2 },
      writable: true,
    });
  });

  test("defaults to max-w-4xl when maxWidth not supplied", () => {
    render(
      <RequestFlowModal>
        <div data-testid="child">c</div>
      </RequestFlowModal>
    );
    const dialog = screen.getByTestId("request-flow-modal-dialog");
    expect(dialog.className).toMatch(/max-w-4xl/);
  });

  test("applies max-w-6xl when maxWidth='6xl'", () => {
    render(
      <RequestFlowModal maxWidth="6xl">
        <div data-testid="child">c</div>
      </RequestFlowModal>
    );
    const dialog = screen.getByTestId("request-flow-modal-dialog");
    expect(dialog.className).toMatch(/max-w-6xl/);
    expect(dialog.className).not.toMatch(/max-w-4xl/);
  });
});

describe("RequestFlowModal — onClose prop", () => {
  test("adds data-testid to backdrop for testability", () => {
    const { container } = render(
      <RequestFlowModal>
        <div>child</div>
      </RequestFlowModal>,
    );
    expect(container.querySelector("[data-testid='request-flow-modal-backdrop']")).toBeTruthy();
  });

  test("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <RequestFlowModal onClose={onClose}>
        <div>child</div>
      </RequestFlowModal>,
    );
    const backdrop = container.querySelector("[data-testid='request-flow-modal-backdrop']") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("does not crash when onClose is not supplied (legacy path)", () => {
    const { container } = render(
      <RequestFlowModal>
        <div>child</div>
      </RequestFlowModal>,
    );
    const backdrop = container.querySelector("[data-testid='request-flow-modal-backdrop']") as HTMLElement;
    expect(() => fireEvent.click(backdrop)).not.toThrow();
  });
});
