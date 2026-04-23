/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
}));

describe("requestStore — structuredMetadata (#305)", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("initial state is empty object", () => {
    expect(useRequestStore.getState().structuredMetadata).toEqual({});
  });

  test("setStructuredMetadata sets a single key", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "The Glory" });
    expect(useRequestStore.getState().structuredMetadata).toEqual({
      title: "The Glory",
    });
  });

  test("setStructuredMetadata merges with existing values (patch semantics)", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "The Glory" });
    useRequestStore.getState().setStructuredMetadata({ platform: "Netflix" });
    expect(useRequestStore.getState().structuredMetadata).toEqual({
      title: "The Glory",
      platform: "Netflix",
    });
  });

  test("setStructuredMetadata with undefined value clears the key", () => {
    useRequestStore.getState().setStructuredMetadata({ year: "2023" });
    useRequestStore.getState().setStructuredMetadata({ year: undefined });
    expect(useRequestStore.getState().structuredMetadata.year).toBeUndefined();
  });

  test("resetRequestFlow clears structuredMetadata", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "x" });
    useRequestStore.getState().resetRequestFlow();
    expect(useRequestStore.getState().structuredMetadata).toEqual({});
  });

  describe("source type 전환 정책", () => {
    test("drama ↔ movie transition preserves all fields (same shape)", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "" },
        structuredMetadata: {
          title: "The Glory",
          platform: "Netflix",
          year: "2023",
        },
      });
      useRequestStore.getState().changeMediaType("movie");
      const s = useRequestStore.getState();
      expect(s.mediaSource?.type).toBe("movie");
      expect(s.structuredMetadata).toEqual({
        title: "The Glory",
        platform: "Netflix",
        year: "2023",
      });
    });

    test("movie → variety drops unsupported keys (platform, year) and keeps title", () => {
      useRequestStore.setState({
        mediaSource: { type: "movie", title: "" },
        structuredMetadata: {
          title: "Parasite",
          platform: "Theater",
          year: "2019",
        },
      });
      useRequestStore.getState().changeMediaType("variety");
      const s = useRequestStore.getState();
      expect(s.mediaSource?.type).toBe("variety");
      expect(s.structuredMetadata).toEqual({ title: "Parasite" });
    });

    test("music_video → event keeps title + year, drops episode if any", () => {
      useRequestStore.setState({
        mediaSource: { type: "music_video", title: "" },
        structuredMetadata: {
          title: "How You Like That",
          year: "2020",
        },
      });
      useRequestStore.getState().changeMediaType("event");
      const s = useRequestStore.getState();
      expect(s.structuredMetadata).toEqual({
        title: "How You Like That",
        year: "2020",
      });
    });
  });
});
