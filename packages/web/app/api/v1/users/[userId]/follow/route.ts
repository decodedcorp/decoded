/**
 * Follow/Unfollow Proxy API Route
 * POST /api/v1/users/[userId]/follow - Follow a user (auth required)
 * DELETE /api/v1/users/[userId]/follow - Unfollow a user (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/users/${userId}/follow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({
      message: `Backend error: ${response.status}`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Follow POST proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/users/${userId}/follow`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({
      message: `Backend error: ${response.status}`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Follow DELETE proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
