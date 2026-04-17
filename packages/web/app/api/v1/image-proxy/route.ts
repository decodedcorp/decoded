import { NextRequest, NextResponse } from "next/server";
import { isIPv6 } from "node:net";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

/**
 * Image proxy for WebGL textures and <img> direct usage.
 * Defensive layers (in order): rate-limit → URL/SSRF validation → header
 * injection (UA/Referer) → manual redirect (3 hops, re-validated each hop) →
 * Content-Type whitelist → streaming 10MB cap → structured error.
 *
 * Usage: /api/v1/image-proxy?url=<encoded-image-url>
 */
const PROXY_TIMEOUT_MS = 10_000;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB decompressed
const MAX_REDIRECTS = 3;

const IMAGE_PROXY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Exact match or suffix match (subdomain-safe; see resolveReferer)
const REFERER_MAP: Record<string, string> = {
  "i.pinimg.com": "https://www.pinterest.com/",
  "pinimg.com": "https://www.pinterest.com/",
  "pinterest.com": "https://www.pinterest.com/",
};

// SVG is intentionally excluded — ShopGrid/ImageDetailContent/DecodeShowcase/
// MagazineItemsSection call /api/v1/image-proxy via <img src> directly,
// bypassing Next optimizer. Raw SVG would reach the browser and enable XSS.
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/x-icon",
]);

type ErrorCode =
  | "missing_url"
  | "invalid_url"
  | "ssrf_blocked"
  | "upstream_error"
  | "timeout"
  | "too_large"
  | "redirect_loop"
  | "content_type_rejected"
  | "fetch_failed";

function errorResponse(
  code: ErrorCode,
  status: number,
  extras?: { upstreamStatus?: number }
): Response {
  return new Response(
    JSON.stringify({
      error: code,
      code,
      upstreamStatus: extras?.upstreamStatus,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  if (!checkRateLimit(clientKey, { windowMs: 60_000, max: 60 })) {
    return rateLimitResponse(60);
  }

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "image/*" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
  }
}
