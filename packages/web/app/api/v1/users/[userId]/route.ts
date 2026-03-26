/**
 * User by ID Proxy API Route
 * GET /api/v1/users/[userId] - Fetch public profile of another user (no auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/v1/users/[userId]
 * Fetch public profile of another user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
      console.error("Users/[userId] GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
