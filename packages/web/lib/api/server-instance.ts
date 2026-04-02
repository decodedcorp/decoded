/**
 * Server-side API fetch utility for React Server Components.
 *
 * Calls the Rust backend directly using API_BASE_URL (same as proxy routes).
 * Returns Orval generated types for type safety.
 *
 * Usage:
 *   const posts = await serverApiGet<PaginatedResponsePostListItem>('/api/v1/posts?sort=popular');
 */

import { API_BASE_URL } from "@/lib/server-env";

interface ServerFetchOptions {
  /** Next.js revalidation in seconds (default: 60) */
  revalidate?: number | false;
  /** Request headers */
  headers?: Record<string, string>;
}

/**
 * GET request to backend API from server components.
 * Uses Rust backend directly (no Next.js proxy hop).
 */
export async function serverApiGet<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { revalidate = 60, headers = {} } = options;

  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    next: revalidate === false ? { revalidate: false } : { revalidate },
  });

  if (!res.ok) {
    console.error(
      `[serverApiGet] ${res.status} ${res.statusText} — ${url}`
    );
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
