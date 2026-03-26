/**
 * Image Upload Proxy API Route
 * POST /api/v1/posts/upload
 *
 * Proxies multipart form data to the backend API to avoid CORS issues.
 * Requires authentication via Authorization header.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

export async function POST(request: NextRequest) {
  // Validate authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/upload`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    // Handle gateway errors (502, 503, 504)
    if (response.status >= 502 && response.status <= 504) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Backend gateway error: ${response.status}`);
      }
      return NextResponse.json(
        {
          message:
            "서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.",
          code: "GATEWAY_ERROR",
          retryable: true,
        },
        { status: response.status }
      );
    }

    // Check content-type before parsing as JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Unexpected content-type: ${contentType}`);
      }
      return NextResponse.json(
        {
          message: "서버 응답 형식이 올바르지 않습니다.",
          code: "INVALID_RESPONSE",
          retryable: true,
        },
        { status: 502 }
      );
    }

    // Parse response - handle both JSON and non-JSON responses
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: `Backend error: ${response.status} ${response.statusText}`,
        code: "PARSE_ERROR",
        retryable: true,
      };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Upload proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
        code: "UPLOAD_ERROR",
        retryable: true,
      },
      { status: 502 }
    );
  }
}
