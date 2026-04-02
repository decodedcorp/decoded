import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

/**
 * Image proxy for WebGL textures.
 * Fetches external images and serves them with CORS headers,
 * allowing CircularGallery (OGL) to use them as WebGL textures.
 *
 * Usage: /api/v1/image-proxy?url=<encoded-image-url>
 */
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
