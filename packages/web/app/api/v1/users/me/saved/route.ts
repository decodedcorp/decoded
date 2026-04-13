/**
 * My Saved Posts Proxy API Route
 * GET /api/v1/users/me/saved - List saved posts (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/users/me/saved${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("My saved GET proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
