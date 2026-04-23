import type { ImageLoaderProps } from "next/image";

/**
 * Custom image loader.
 *
 * Historical behavior (pre-#253): every external URL was wrapped as
 * `/_next/image?url=/api/v1/image-proxy?url=<external>`. Vercel's image
 * optimizer rejects that shape with `INVALID_IMAGE_OPTIMIZE_REQUEST` (HTTP 400)
 * because the inner URL contains an embedded `?url=` query, breaking its
 * local-pattern validation. Every external image on PRD failed at /_next/image.
 *
 * Current behavior:
 * - Hosts in `ALLOWED_OPTIMIZER_HOSTS` (must ALSO be in
 *   `next.config.js` → `images.remotePatterns`) → direct `/_next/image`.
 *   Gets AVIF/WebP + resize.
 * - Other external hosts (Pinterest, unknown origins, etc.) → bare
 *   `/api/v1/image-proxy`. No optimization, but works and keeps the SSRF /
 *   referer / size-cap hardening from #256/#229.
 * - Local/relative → `/_next/image`.
 *
 * Keep `ALLOWED_OPTIMIZER_HOSTS` in sync with `next.config.js` remotePatterns.
 */
const ALLOWED_OPTIMIZER_HOSTS = new Set<string>([
  "pub-6354054b117b46b9a0fe99e4a546e681.r2.dev",
]);

function hostOf(src: string): string | null {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const q = quality ?? 75;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const host = hostOf(src);
    if (host && ALLOWED_OPTIMIZER_HOSTS.has(host)) {
      return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
    }
    return `/api/v1/image-proxy?url=${encodeURIComponent(src)}`;
  }

  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
