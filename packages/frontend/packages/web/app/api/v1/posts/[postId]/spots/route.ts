/**
 * Spots List Proxy API Route
 * GET /api/v1/posts/[postId]/spots - List spots (public)
 * POST /api/v1/posts/[postId]/spots - Create spot (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ postId: string }>;
};

/**
 * GET /api/v1/posts/[postId]/spots
 * List all spots for a post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

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
    console.error("Spots GET proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to fetch spots",
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
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

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
    console.error("Spots POST proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to create spot",
      },
      { status: 502 }
    );
  }
}
