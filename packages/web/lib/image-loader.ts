import type { ImageLoaderProps } from "next/image";

/**
 * Custom image loader — routes external images through our proxy
 * so Next.js can optimize them (resize, WebP/AVIF) regardless of hostname.
 *
 * Flow: browser → /_next/image → /api/v1/image-proxy → external origin
 * After first request, Next.js caches the optimized result.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const q = quality || 75;

  // External URLs: proxy through our API so Next.js sees them as local
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const proxied = `/api/v1/image-proxy?url=${encodeURIComponent(src)}`;
    return `/_next/image?url=${encodeURIComponent(proxied)}&w=${width}&q=${q}`;
  }

  // Local/relative URLs: standard Next.js optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
