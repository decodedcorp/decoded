/**
 * Posts Proxy API Route
 * GET /api/v1/posts - Fetch posts list (no auth required)
 * POST /api/v1/posts - Create a new post (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

/**
 * GET /api/v1/posts
 * Fetch posts list with optional query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Forward query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/posts?${queryString}`
      : `${API_BASE_URL}/api/v1/posts`;

    // Forward the request to the backend
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Parse response - handle both JSON and non-JSON (e.g., nginx HTML errors)
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON response (e.g., nginx error page)
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
      };
    }

    // Return the response preserving the backend's status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Posts GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}

/**
 * POST /api/v1/posts
 * Create a new post (requires authentication)
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
    // Get FormData from request and forward directly
    const incomingFormData = await request.formData();

    // Create new FormData for backend
    const formData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      formData.append(key, value);
    }

    // Forward the request to the backend as multipart/form-data
    const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
      method: "POST",
      headers: {
        // Don't set Content-Type - let fetch set it with boundary
        Authorization: authHeader,
      },
      body: formData,
    });

    // Parse response - handle both JSON and text responses
    const responseText = await response.text();

    // Try to parse as JSON, fallback to text error
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON response (likely an error message)
      data = { message: responseText || "Unknown backend error" };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Posts POST proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
