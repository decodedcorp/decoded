/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UploadFlowSteps } from "../UploadFlowSteps";
import { useRequestStore, getRequestActions } from "@/lib/stores/requestStore";

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
});
