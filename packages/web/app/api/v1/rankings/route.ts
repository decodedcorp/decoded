/**
 * Rankings Proxy API Route
 * GET /api/v1/rankings - 전체 랭킹 (선택적 인증)
 *
 * Proxies requests to the backend API.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/rankings?${queryString}`
      : `${API_BASE_URL}/api/v1/rankings`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers.Authorization = authHeader;

    const response = await fetch(url, { method: "GET", headers });

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
      console.error("Rankings GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
