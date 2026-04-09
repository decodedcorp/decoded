/**
 * Search API proxy — forwards to Rust API under /api/v1/search/*
 *
 * Covers:
 * - GET /api/v1/search?q=...
 * - GET /api/v1/search/popular
 * - GET /api/v1/search/recent
 * - GET /api/v1/search/similar?...
 * - GET /api/v1/search/keywords/popular (if backend exposes it)
 * - DELETE /api/v1/search/recent/{id}
 */

import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/server-env";

type RouteParams = {
  params: Promise<{ path?: string[] }>;
};

function buildBackendSearchUrl(request: NextRequest, pathSegments: string[] | undefined) {
  const suffix =
    pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const base = `${API_BASE_URL}/api/v1/search${suffix}`;
  return qs ? `${base}?${qs}` : base;
}

async function forwardSearch(
  request: NextRequest,
  method: string,
  pathSegments: string[] | undefined
) {
  const url = buildBackendSearchUrl(request, pathSegments);
  const authHeader = request.headers.get("Authorization");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const init: RequestInit = { method, headers };

  if (method !== "GET" && method !== "HEAD") {
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  const response = await fetch(url, init);

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseText = await response.text();
  let data: unknown;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = {
      message: `Backend error: ${response.status} ${response.statusText}`,
    };
  }

  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { path } = await params;
    return await forwardSearch(request, "GET", path);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Search GET proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { path } = await params;
    return await forwardSearch(request, "DELETE", path);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Search DELETE proxy error:", error);
    }
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}
