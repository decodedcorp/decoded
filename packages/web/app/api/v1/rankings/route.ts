/**
 * Rankings Proxy API Route
 * GET /api/v1/rankings - List rankings (optional auth for my_ranking)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const queryString = url.searchParams.toString();
  const authHeader = request.headers.get("Authorization");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/rankings${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    const data = await response.json().catch(() => ({
      message: `Backend error: ${response.status}`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
