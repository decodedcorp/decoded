/**
 * Categories Proxy API Route
 * GET /api/v1/categories
 *
 * Proxies requests to the backend API to avoid CORS issues.
 * No authentication required.
 */

import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET() {
  try {
    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
      console.error("Categories proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
