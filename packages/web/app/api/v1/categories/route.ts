/**
 * Categories Proxy API Route
 * GET /api/v1/categories
 *
 * Proxies requests to the backend API to avoid CORS issues.
 * No authentication required.
 */

import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET() {
  // Validate server configuration
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

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
    console.error("Categories proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to fetch categories",
      },
      { status: 502 }
    );
  }
}
