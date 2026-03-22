/**
 * Rankings Me Proxy API Route
 * GET /api/v1/rankings/me - 내 랭킹 상세 (인증 필요)
 *
 * Proxies requests to the backend API.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL environment variable is not configured");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/rankings/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
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
    console.error("Rankings/me GET proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Proxy error: ${error.message}`
            : "Failed to fetch my ranking",
      },
      { status: 502 }
    );
  }
}
