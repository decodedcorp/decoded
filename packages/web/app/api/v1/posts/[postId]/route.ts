/**
 * Post Proxy API Route
 * GET /api/v1/posts/[postId] - Get post detail (spots + solutions)
 * PATCH /api/v1/posts/[postId] - Update post (auth required)
 * DELETE /api/v1/posts/[postId] - Delete post (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

/**
 * GET /api/v1/posts/[postId]
 * Get post detail with spots and top solution per spot
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
      method: "GET",
      headers,
    });

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
      console.error("Posts GET detail proxy error:", error);
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
 * PATCH /api/v1/posts/[postId]
 * Update a post
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

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
      console.error("Posts PATCH proxy error:", error);
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
 * DELETE /api/v1/posts/[postId]
 * Delete a post
 */
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
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

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
      console.error("Posts DELETE proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
