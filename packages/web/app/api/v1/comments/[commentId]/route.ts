/**
 * Comment Proxy API Route
 * DELETE /api/v1/comments/[commentId] - Delete comment (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ commentId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { commentId } = await params;
  const url = `${API_BASE_URL}/api/v1/comments/${commentId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Comment DELETE proxy error:", error);
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
