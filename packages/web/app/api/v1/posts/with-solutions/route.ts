/**
 * Posts with Solutions Proxy API Route
 * POST /api/v1/posts/with-solutions - Create a new post with solutions (auth required)
 *
 * For users who know the product info (links) for spotted items.
 * Proxies multipart/form-data to the backend API.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const incomingFormData = await request.formData();
    const formData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      formData.append(key, value);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/posts/with-solutions`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      }
    );

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText || "Unknown backend error" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Posts with-solutions POST proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
