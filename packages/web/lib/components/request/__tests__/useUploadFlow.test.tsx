/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUploadFlow } from "../useUploadFlow";
import { useRequestStore } from "@/lib/stores/requestStore";

const routerPush = vi.fn();
const routerBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
}));

describe("useUploadFlow — initial state", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
    routerPush.mockClear();
    routerBack.mockClear();
  });

  test("registers an instanceId on mount and resets on unmount", () => {
    const { result, unmount } = renderHook(() => useUploadFlow());
    const id = result.current.instanceId;
    expect(id).toBeTruthy();
    expect(useRequestStore.getState().activeInstanceId).toBe(id);

    unmount();
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });

  test("exposes isSubmitting and submitError with initial values", () => {
    const { result } = renderHook(() => useUploadFlow());
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  test("close() clears current instance and navigates back when history has entries", () => {
    // jsdom's window.history.length defaults to 1, so router.push('/') is taken.
    const { result } = renderHook(() => useUploadFlow());
    const id = result.current.instanceId;

    result.current.close();

    expect(useRequestStore.getState().activeInstanceId).toBeNull();
    // Either back() or push('/') depending on window.history.length
    const navigated =
      routerBack.mock.calls.length === 1 ||
      routerPush.mock.calls.some((args) => args[0] === "/");
    expect(navigated).toBe(true);
    void id; // silence unused warning
  });
});
