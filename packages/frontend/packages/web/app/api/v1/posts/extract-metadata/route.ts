/**
 * AI Metadata Extraction Proxy API Route
 * POST /api/v1/posts/extract-metadata
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
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { message: "Description is required" },
        { status: 400 }
      );
    }

    // Proxy to backend
    const response = await fetch(
      `${API_BASE_URL}/api/v1/posts/extract-metadata`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      }
    );

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
    console.error("Extract metadata proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to extract metadata",
      },
      { status: 502 }
    );
  }
}
