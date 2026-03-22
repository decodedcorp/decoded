/**
 * Post Likes Proxy API Route
 * GET /api/v1/posts/[postId]/likes - Get like stats (optional auth)
 * POST /api/v1/posts/[postId]/likes - Like post (auth required)
 * DELETE /api/v1/posts/[postId]/likes - Unlike post (auth required)
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  params: Promise<{ postId: string }>;
};

async function proxy(
  postId: string,
  request: NextRequest,
  method: "GET" | "POST" | "DELETE"
) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const url = `${API_BASE_URL}/api/v1/posts/${postId}/likes`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(url, {
    method,
    headers,
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params;
  try {
    return proxy(postId, request, "GET");
  } catch (error) {
    console.error("Likes GET proxy error:", error);
    return NextResponse.json(
      { message: "Failed to fetch like stats" },
      { status: 500 }
    );
  }
}

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
    return proxy(postId, request, "POST");
  } catch (error) {
    console.error("Likes POST proxy error:", error);
    return NextResponse.json(
      { message: "Failed to like post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { postId } = await params;
  try {
    return proxy(postId, request, "DELETE");
  } catch (error) {
    console.error("Likes DELETE proxy error:", error);
    return NextResponse.json(
      { message: "Failed to unlike post" },
      { status: 500 }
    );
  }
}
