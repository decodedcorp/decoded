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
  // Explicit backend URL (recommended for production with Rust backend)
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  // Local dev — default Rust backend port
  // NOTE: Do NOT fall back to NEXT_PUBLIC_SITE_URL — that causes self-referencing
  // requests on Vercel (server component → own serverless function → deadlock).
  // When no backend is configured, serverApiGet will throw → Supabase fallback.
  return "http://localhost:8000";
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
    throw new Error(`[serverApiGet] ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}
