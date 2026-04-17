/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

describe("useBodyScrollLock", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  test("locks body overflow when active=true", () => {
    renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("nested locks count — outer unmount does not release while inner locked", () => {
    const outer = renderHook(() => useBodyScrollLock(true));
    const inner = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    outer.unmount();
    expect(document.body.style.overflow).toBe("hidden");

    inner.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  test("does not lock when active=false", () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.overflow).toBe("");
  });

  test("releases lock when active transitions true → false", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useBodyScrollLock(active),
      { initialProps: { active: true } }
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ active: false });
    expect(document.body.style.overflow).toBe("");
  });
});
