/**
 * Server-side API fetch utility for React Server Components.
 *
 * Calls the Next.js internal API routes which proxy to the Rust backend.
 * Uses NEXT_PUBLIC_SITE_URL or falls back to localhost.
 * Returns Orval generated types for type safety.
 *
 * Usage:
 *   const posts = await serverApiGet<PaginatedResponsePostListItem>('/api/v1/posts?sort=popular');
 */

interface ServerFetchOptions {
  /** Next.js revalidation in seconds (default: 60) */
  revalidate?: number | false;
  /** Request headers */
  headers?: Record<string, string>;
}

function getBaseUrl(): string {
  // Vercel/production
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Local dev
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * GET request to backend API from server components.
 * Routes through Next.js API proxy (/api/v1/* → Rust backend).
 */
export async function serverApiGet<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { revalidate = 60, headers = {} } = options;

  const url = `${getBaseUrl()}${path}`;

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
