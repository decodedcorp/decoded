/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
}));

describe("requestStore — back navigation", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  describe("backToFork", () => {
    test("clears detectedSpots, metadata and userKnowsItems, preserves images", () => {
      // Arrange: Step 3 state (image + fork choice + spots + metadata)
      useRequestStore.setState({
        images: [
          {
            id: "img1",
            file: new File([], "a.jpg"),
            previewUrl: "blob:mock",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: true,
        detectedSpots: [
          {
            id: "s1",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "TOP",
            description: "",
          },
        ],
        selectedSpotId: "s1",
        mediaSource: { type: "drama", title: "My Drama" },
        groupName: "G",
        artistName: "A",
        context: "airport",
      });

      // Act
      useRequestStore.getState().backToFork();

      // Assert
      const s = useRequestStore.getState();
      expect(s.detectedSpots).toEqual([]);
      expect(s.selectedSpotId).toBeNull();
      expect(s.mediaSource).toEqual({ type: "user_upload", title: "" });
      expect(s.groupName).toBe("");
      expect(s.artistName).toBe("");
      expect(s.context).toBeNull();
      // userKnowsItems는 이제 클리어되어 fork 화면으로 돌아감
      expect(s.userKnowsItems).toBeNull();
      // Preserved:
      expect(s.images.length).toBe(1);
    });
  });

  describe("backToUpload", () => {
    test("clears images and userKnowsItems, revokes preview URLs", async () => {
      const { revokePreviewUrl } = await import("@/lib/utils/imageCompression");
      (revokePreviewUrl as ReturnType<typeof vi.fn>).mockClear();

      useRequestStore.setState({
        images: [
          {
            id: "img1",
            file: new File([], "a.jpg"),
            previewUrl: "blob:foo",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
      });

      useRequestStore.getState().backToUpload();

      const s = useRequestStore.getState();
      expect(s.images).toEqual([]);
      expect(s.userKnowsItems).toBeNull();
      expect(revokePreviewUrl).toHaveBeenCalledWith("blob:foo");
    });
  });

  describe("hasInProgressWork selector", () => {
    test("false when only userKnowsItems is set", () => {
      useRequestStore.setState({ userKnowsItems: true });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(false);
    });

    test("true when detectedSpots has at least one item", () => {
      useRequestStore.setState({
        detectedSpots: [
          {
            id: "s1",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("true when context is set", () => {
      useRequestStore.setState({ context: "airport" });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("false when mediaSource.title is whitespace only", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "   " },
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(false);
    });

    test("true when mediaSource.title is non-empty", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "Hi" },
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("true when artistName is non-empty", () => {
      useRequestStore.setState({ artistName: "A" });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });
  });

  describe("disabledReason selector", () => {
    test("need_image when no uploaded image", () => {
      expect(useRequestStore.getState().disabledReason()).toBe("need_image");
    });

    test("need_fork_choice when image uploaded but userKnowsItems=null", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBe(
        "need_fork_choice"
      );
    });

    test("need_spot when fork chosen but no spots", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
      });
      expect(useRequestStore.getState().disabledReason()).toBe("need_spot");
    });

    test("need_solution when userKnowsItems=true but spots lack solution", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: true,
        detectedSpots: [
          {
            id: "s",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBe("need_solution");
    });

    test("null when userKnowsItems=false and spots > 0", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
        detectedSpots: [
          {
            id: "s",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBeNull();
    });

    test("submitting when isSubmitting=true", () => {
      useRequestStore.setState({ isSubmitting: true });
      expect(useRequestStore.getState().disabledReason()).toBe("submitting");
    });
  });
});
