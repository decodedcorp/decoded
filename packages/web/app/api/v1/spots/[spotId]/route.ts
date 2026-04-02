/**
 * Individual Spot Proxy API Route
 * PATCH /api/v1/spots/[spotId] - Update spot (auth required)
 * DELETE /api/v1/spots/[spotId] - Delete spot (auth required)
 *
 * Proxies requests to the backend API to avoid CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ spotId: string }>;
};

/**
 * PATCH /api/v1/spots/[spotId]
 * Update a spot
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { spotId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/spots/${spotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
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
      console.error("Spot PATCH proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}

/**
 * DELETE /api/v1/spots/[spotId]
 * Delete a spot
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  const { spotId } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/spots/${spotId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

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
      console.error("Spot DELETE proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
