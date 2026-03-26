/**
 * Spots List Proxy API Route
 * GET /api/v1/posts/[postId]/spots - List spots (public)
 * POST /api/v1/posts/[postId]/spots - Create spot (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

/**
 * GET /api/v1/posts/[postId]/spots
 * List all spots for a post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/posts/${postId}/spots`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Spots GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}

/**
 * POST /api/v1/posts/[postId]/spots
 * Create a new spot
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { postId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/posts/${postId}/spots`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Spots POST proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
