import { describe, it, expect } from "vitest";
import { toDecodeShowcaseData } from "./toDecodeShowcaseData";
import type { NormalizedItem } from "../types";

describe("toDecodeShowcaseData", () => {
  const baseItem: NormalizedItem = {
    id: 1,
    image_id: "img-1",
    product_name: "Wool Coat",
    sam_prompt: null,
    description: null,
    center: null,
    cropped_image_path: null,
    metadata: {
      brand: "COS",
      sub_category: "Outerwear",
    } as unknown as string[],
    created_at: "2026-01-01",
    spot_id: "spot-1",
    normalizedCenter: { x: 0.25, y: 0.35 },
    normalizedBox: { top: 0.3, left: 0.2, width: 0.1, height: 0.1 },
    // Required ItemRow fields
    brand: null,
    price: null,
    status: null,
    bboxes: null,
    scores: null,
    ambiguity: null,
    citations: null,
  };

  it("converts normalizedItems with coordinates to DetectedItem[]", () => {
    const items = [
      baseItem,
      {
        ...baseItem,
        id: 2,
        product_name: "Denim Jacket",
        normalizedCenter: { x: 0.7, y: 0.6 },
        metadata: { brand: "Acne Studios" },
      },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "NEWJEANS",
    });

    expect(result.sourceImageUrl).toBe("https://example.com/image.jpg");
    expect(result.artistName).toBe("NEWJEANS");
    expect(result.detectedItems).toHaveLength(2);
    expect(result.detectedItems[0]).toEqual({
      id: "1",
      label: "Wool Coat",
      brand: "COS",
      imageUrl: undefined,
      bbox: { x: 25, y: 35, width: 0, height: 0 },
    });
    expect(result.detectedItems[1]).toEqual({
      id: "2",
      label: "Denim Jacket",
      brand: "Acne Studios",
      imageUrl: undefined,
      bbox: { x: 70, y: 60, width: 0, height: 0 },
    });
  });

  it("skips items without normalizedCenter", () => {
    const items = [
      baseItem,
      { ...baseItem, id: 3, normalizedCenter: null },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "IVE",
    });

    expect(result.detectedItems).toHaveLength(1);
  });

  it("limits to 4 items max", () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      ...baseItem,
      id: i + 1,
      normalizedCenter: { x: 0.1 * (i + 1), y: 0.1 * (i + 1) },
    })) as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems).toHaveLength(4);
  });

  it("includes cropped_image_path as imageUrl via proxy", () => {
    const items = [
      {
        ...baseItem,
        cropped_image_path: "https://storage.example.com/cropped/1.jpg",
      },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems[0].imageUrl).toBe(
      "/api/v1/image-proxy?url=https%3A%2F%2Fstorage.example.com%2Fcropped%2F1.jpg"
    );
  });

  it("returns fallback when no valid items", () => {
    const result = toDecodeShowcaseData({
      items: [],
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems).toHaveLength(0);
    expect(result.sourceImageUrl).toBe("https://example.com/image.jpg");
  });
});
