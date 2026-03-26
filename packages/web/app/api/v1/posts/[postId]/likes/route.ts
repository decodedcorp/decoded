/**
 * Post Likes Proxy API Route
 * GET /api/v1/posts/[postId]/likes - Get like stats (optional auth)
 * POST /api/v1/posts/[postId]/likes - Like post (auth required)
 * DELETE /api/v1/posts/[postId]/likes - Unlike post (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

async function proxy(
  postId: string,
  request: NextRequest,
  method: "GET" | "POST" | "DELETE"
) {
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
    if (process.env.NODE_ENV === "development") {
      console.error("Likes GET proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
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
    if (process.env.NODE_ENV === "development") {
      console.error("Likes POST proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
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
    if (process.env.NODE_ENV === "development") {
      console.error("Likes DELETE proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
