/**
 * Posts with Solution Proxy API Route
 * POST /api/v1/posts/with-solution - Create a new post with solutions (auth required)
 *
 * This endpoint is for users who know the solution (product info) for spotted items.
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

/**
 * POST /api/v1/posts/with-solution
 * Create a new post with solutions (requires authentication)
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get the JSON body from the request
    const body = await request.json();

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/with-solution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    // Parse response - handle both JSON and non-JSON responses
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Posts with solution POST proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
