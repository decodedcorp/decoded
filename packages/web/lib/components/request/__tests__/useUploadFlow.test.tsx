/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUploadFlow } from "../useUploadFlow";
import { useRequestStore, getRequestActions } from "@/lib/stores/requestStore";
import {
  createPostWithFile,
  createPostWithFileAndSolutions,
} from "@/lib/api/posts";
import { clearDraft } from "@/lib/utils/offlineDraft";

const routerPush = vi.fn();
const routerBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
  compressImage: vi.fn(async (f: File) => ({ file: f })),
}));

vi.mock("@/lib/api/posts", () => ({
  createPostWithFile: vi.fn(async () => ({ id: "post-123" })),
  createPostWithFileAndSolutions: vi.fn(async () => ({ id: "post-456" })),
}));

vi.mock("@/lib/utils/offlineDraft", () => ({
  saveDraft: vi.fn(),
  saveDraftThumbnail: vi.fn(),
  loadDraft: vi.fn(() => null),
  clearDraft: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
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

describe("useUploadFlow — submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
    routerPush.mockClear();
    routerBack.mockClear();
    vi.mocked(createPostWithFile).mockResolvedValue({ id: "post-123" });
    vi.mocked(createPostWithFileAndSolutions).mockResolvedValue({
      id: "post-456",
    });
  });

  test("submit → success path: calls createPostWithFile and navigates", async () => {
    // Setup store state
    const actions = getRequestActions();
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    actions.addImage(file);
    actions.setUserKnowsItems(false);
    actions.addSpot(0.5, 0.5);
    actions.setMediaSource({ type: "user_upload", title: "" });

    const { result } = renderHook(() => useUploadFlow());

    await act(async () => {
      await result.current.submit();
    });

    expect(vi.mocked(createPostWithFile)).toHaveBeenCalledOnce();
    expect(vi.mocked(clearDraft)).toHaveBeenCalledOnce();
    expect(routerPush).toHaveBeenCalledWith("/posts/post-123");
    expect(result.current.submitError).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  test("submit → solutions path: calls createPostWithFileAndSolutions when userKnowsItems=true", async () => {
    const actions = getRequestActions();
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    actions.addImage(file);
    actions.setUserKnowsItems(true);
    actions.addSpot(0.3, 0.4);

    // Get the spot id to attach solution
    const spots = useRequestStore.getState().detectedSpots;
    const spotId = spots[0].id;
    actions.setSpotSolution(spotId, {
      originalUrl: "https://example.com/product",
      title: "Cool Jacket",
      thumbnailUrl: undefined,
      description: undefined,
      priceAmount: undefined,
      priceCurrency: undefined,
    });

    const { result } = renderHook(() => useUploadFlow());

    await act(async () => {
      await result.current.submit();
    });

    expect(vi.mocked(createPostWithFileAndSolutions)).toHaveBeenCalledOnce();
    expect(vi.mocked(createPostWithFile)).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith("/posts/post-456");
  });

  test("submit → failure: sets submitError and isSubmitting=false on API error", async () => {
    vi.mocked(createPostWithFile).mockRejectedValueOnce(
      new Error("Network error")
    );

    const actions = getRequestActions();
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    actions.addImage(file);
    actions.setUserKnowsItems(false);
    actions.addSpot(0.5, 0.5);

    const { result } = renderHook(() => useUploadFlow());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.submitError).toBe("Network error");
    expect(result.current.isSubmitting).toBe(false);
    expect(routerPush).not.toHaveBeenCalledWith(
      expect.stringContaining("/posts/")
    );
  });
});
