import type { NormalizedItem } from "../types";
import type { DecodeShowcaseData } from "@/lib/components/main-renewal/types";

interface ToDecodeShowcaseDataParams {
  items: NormalizedItem[];
  imageUrl: string;
  artistName: string;
}

/**
 * Adapts NormalizedItem[] to DecodeShowcaseData for the AI detection showcase section.
 * - Filters out items without normalizedCenter
 * - Limits to 4 items max
 * - Converts normalizedCenter (0-1) to bbox (0-100 percentage)
 * - Proxies cropped_image_path through /api/v1/image-proxy
 */
export function toDecodeShowcaseData({
  items,
  imageUrl,
  artistName,
}: ToDecodeShowcaseDataParams): DecodeShowcaseData {
  const detectedItems = items
    .filter((item) => item.normalizedCenter !== null)
    .slice(0, 4)
    .map((item) => {
      const meta = item.metadata as unknown as
        | Record<string, unknown>
        | undefined;
      const croppedUrl = item.cropped_image_path;
      return {
        id: String(item.id),
        label: item.product_name ?? item.sam_prompt ?? `Item ${item.id}`,
        brand: (meta?.brand as string) ?? undefined,
        imageUrl: croppedUrl
          ? `/api/v1/image-proxy?url=${encodeURIComponent(croppedUrl)}`
          : undefined,
        bbox: {
          x: Math.round(item.normalizedCenter!.x * 100),
          y: Math.round(item.normalizedCenter!.y * 100),
          width: 0,
          height: 0,
        },
      };
    });

  return {
    sourceImageUrl: imageUrl,
    artistName,
    detectedItems,
    tagline: "See how it's Decoded",
  };
}
