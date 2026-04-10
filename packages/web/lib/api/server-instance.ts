/**
 * Server-side API fetch utility for React Server Components.
 *
 * Calls the Rust backend directly using API_BASE_URL (same env var used by
 * /app/api/v1/* proxy route handlers via @/lib/server-env). Returns Orval
 * generated types for type safety.
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
 * GET request to Rust backend from server components.
 * Throws when API_BASE_URL is unset or backend returns non-2xx.
 */
export async function serverApiGet<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { revalidate = 60, headers = {} } = options;

  if (!API_BASE_URL) {
    throw new Error("[serverApiGet] API_BASE_URL is not configured");
  }

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
    throw new Error(`[serverApiGet] ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}
