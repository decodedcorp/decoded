/**
 * AI Image Analysis Proxy API Route
 * POST /api/v1/posts/analyze
 *
 * Proxies JSON requests to the backend API to avoid CORS issues.
 * No authentication required.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  // Validate server configuration
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    // Get the JSON body from the request
    const body = await request.json();

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get response as text first to handle non-JSON error responses
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON response (likely an error message)
      console.error("Backend returned non-JSON response:", responseText);
      return NextResponse.json(
        { message: responseText || "Backend error" },
        { status: response.status || 500 }
      );
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Analyze proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to analyze image",
      },
      { status: 502 }
    );
  }
}
