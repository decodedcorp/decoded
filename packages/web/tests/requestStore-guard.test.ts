/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
}));

describe("requestStore — activeInstanceId guard", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
  });

  test("setActiveInstance stores id", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    expect(useRequestStore.getState().activeInstanceId).toBe("inst-1");
  });

  test("setActiveInstance(null) clears id", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    useRequestStore.getState().setActiveInstance(null);
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });

  test("resetIfActive resets only when instance matches", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    useRequestStore.setState({ description: "draft text" });

    useRequestStore.getState().resetIfActive("other-id");
    expect(useRequestStore.getState().description).toBe("draft text");
    expect(useRequestStore.getState().activeInstanceId).toBe("inst-1");

    useRequestStore.getState().resetIfActive("inst-1");
    expect(useRequestStore.getState().description).toBe("");
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });

  test("resetIfActive with no active instance is a no-op", () => {
    useRequestStore.setState({ description: "draft text" });
    useRequestStore.getState().resetIfActive("any");
    expect(useRequestStore.getState().description).toBe("draft text");
  });

  test("resetRequestFlow clears activeInstanceId", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    useRequestStore.getState().resetRequestFlow();
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });
});
