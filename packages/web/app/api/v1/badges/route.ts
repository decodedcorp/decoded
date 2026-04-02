/**
 * Badges Proxy API Route
 * GET /api/v1/badges - 전체 뱃지 목록 (공개)
 *
 * Proxies requests to the backend API.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/badges?${queryString}`
      : `${API_BASE_URL}/api/v1/badges`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
      console.error("Badges GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
