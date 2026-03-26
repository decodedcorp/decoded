/**
 * AI Image Analysis Proxy API Route
 * POST /api/v1/posts/analyze
 *
 * Proxies JSON requests to the backend API to avoid CORS issues.
 * No authentication required.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  if (!checkRateLimit(clientKey, { windowMs: 60_000, max: 10 })) {
    return rateLimitResponse(60);
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
      if (process.env.NODE_ENV === "development") {
        console.error("Backend returned non-JSON response:", responseText);
      }
      return NextResponse.json(
        { message: responseText || "Backend error" },
        { status: response.status || 500 }
      );
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Analyze proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
