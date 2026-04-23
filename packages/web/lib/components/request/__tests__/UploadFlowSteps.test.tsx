/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UploadFlowSteps } from "../UploadFlowSteps";
import { useRequestStore, getRequestActions } from "@/lib/stores/requestStore";
import { toast } from "sonner";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
  compressImage: vi.fn(async (f: File) => ({ file: f })),
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
vi.mock("@/lib/api/posts", () => ({
  createPostWithFile: vi.fn(async () => ({ id: "p1" })),
  createPostWithFileAndSolutions: vi.fn(async () => ({ id: "p2" })),
}));
// gsap may be pulled by DetectionView — no-op it
vi.mock("gsap", () => ({
  gsap: { to: vi.fn(), set: vi.fn() },
  default: { to: vi.fn(), set: vi.fn() },
}));

describe("UploadFlowSteps — step branches", () => {
  beforeEach(() => {
    cleanup();
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
  });

  test("renders DropZone when no image uploaded", () => {
    render(<UploadFlowSteps />);
    expect(screen.getByTestId("upload-flow-dropzone")).toBeInTheDocument();
  });

  test("renders userKnowsItems fork after image upload", () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    // Mark as uploaded so hasImages selector returns true
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    render(<UploadFlowSteps />);
    expect(screen.getByTestId("upload-flow-fork")).toBeInTheDocument();
  });

  test("fork screen shows an image preview so users can confirm the upload (#295)", () => {
    const file = new File(["x"], "outfit.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    render(<UploadFlowSteps />);

    const preview = screen.getByTestId("upload-flow-fork-preview");
    expect(preview).toBeInTheDocument();
    const imgEl = preview.querySelector("img");
    expect(imgEl).not.toBeNull();
    // Screen readers should announce this as an uploaded preview, not
    // just the raw (often cryptic) filename.
    expect(imgEl?.getAttribute("alt")).toBe(
      "Uploaded image preview: outfit.jpg"
    );
    // Loader may wrap the URL, but the mocked previewUrl token must be
    // referenced so the rendered <img> reflects the uploaded file.
    expect(imgEl?.getAttribute("src")).toContain(img.previewUrl);
  });
});

describe("UploadFlowSteps — step indicator progression", () => {
  beforeEach(() => {
    cleanup();
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
  });

  const currentStepLabel = () => {
    // StepProgress marks the current step's label with the text-foreground
    // class (non-current labels use text-muted-foreground).
    const labels = ["Upload", "Detect", "Details", "Submit"];
    for (const label of labels) {
      const el = screen.getByText(label);
      if (el.className.includes("text-foreground")) return label;
    }
    return null;
  };

  test("step 1 Upload active before image upload", () => {
    render(<UploadFlowSteps />);
    expect(currentStepLabel()).toBe("Upload");
  });

  test("step 1 Upload active while on fork screen", () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    render(<UploadFlowSteps />);
    expect(currentStepLabel()).toBe("Upload");
  });

  test("step 2 Detect active after fork selected, before any spot", () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    getRequestActions().setUserKnowsItems(false);
    render(<UploadFlowSteps />);
    expect(currentStepLabel()).toBe("Detect");
  });

  test("step 3 Details active once a spot is placed", () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    getRequestActions().setUserKnowsItems(false);
    getRequestActions().addSpot(0.5, 0.5);
    render(<UploadFlowSteps />);
    expect(currentStepLabel()).toBe("Details");
  });
});

describe("UploadFlowSteps — spot delete undo (#291)", () => {
  beforeEach(() => {
    cleanup();
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
    vi.mocked(toast).mockClear();
  });

  test("clicking trash deletes the spot and offers an Undo toast that restores it", () => {
    const file = new File(["x"], "x.jpg", { type: "image/jpeg" });
    getRequestActions().addImage(file);
    const img = useRequestStore.getState().images[0];
    getRequestActions().setImageUploadedUrl(img.id, "data:x");
    getRequestActions().setUserKnowsItems(false);
    getRequestActions().addSpot(0.25, 0.5);
    getRequestActions().addSpot(0.75, 0.5);
    const [, second] = useRequestStore.getState().detectedSpots;

    render(<UploadFlowSteps />);

    // Trash icons live on each spot row in the sidebar; pick the second.
    const trashButtons = screen.getAllByRole("button", {
      name: /remove spot/i,
    });
    expect(trashButtons).toHaveLength(2);
    fireEvent.click(trashButtons[1]);

    // Spot was removed from the store…
    const afterDelete = useRequestStore.getState().detectedSpots;
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete.find((s) => s.id === second.id)).toBeUndefined();

    // …and a toast was raised with an Undo action.
    const mockedToast = toast as unknown as ReturnType<typeof vi.fn>;
    expect(mockedToast).toHaveBeenCalledTimes(1);
    const [, options] = mockedToast.mock.calls[0];
    expect(options.action?.label).toBe("Undo");

    // Invoking the Undo action restores the deleted spot at its original slot
    // with indices renumbered.
    options.action.onClick();
    const afterUndo = useRequestStore.getState().detectedSpots;
    expect(afterUndo).toHaveLength(2);
    expect(afterUndo.map((s) => s.index)).toEqual([1, 2]);
    expect(afterUndo.find((s) => s.id === second.id)).toBeDefined();
  });
});
