/**
 * Shared API Client
 * Provides reusable fetch wrapper with auth token injection and standardized error handling
 */

import { supabaseBrowserClient } from "@/lib/supabase/client";
import { ApiError } from "./mutation-types";

// Use empty string to route through Next.js API proxy (avoids CORS issues)
// The proxy routes forward requests to the actual backend via server-side API_BASE_URL
const API_BASE_URL = "";

/**
 * Get JWT token from Supabase Auth session
 */
export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabaseBrowserClient.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * API Client Options
 */
export interface ApiClientOptions {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Shared API client with automatic auth injection and error handling
 *
 * @example
 * // Authenticated request
 * const user = await apiClient<UserResponse>({
 *   path: "/api/v1/users/me",
 *   method: "GET",
 *   requiresAuth: true,
 * });
 *
 * @example
 * // Public request with body
 * const result = await apiClient<AnalyzeResponse>({
 *   path: "/api/v1/posts/analyze",
 *   method: "POST",
 *   body: { image_url: "https://..." },
 * });
 */
export async function apiClient<T>(options: ApiClientOptions): Promise<T> {
  const {
    path,
    method = "GET",
    body,
    requiresAuth = false,
    headers = {},
    signal,
  } = options;

  // Build headers
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Add Content-Type for JSON body
  if (body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Add Authorization header if required, or when token available (optional auth)
  const token = await getAuthToken();
  if (requiresAuth) {
    if (!token) {
      throw new Error("Sign in required.");
    }
    requestHeaders["Authorization"] = `Bearer ${token}`;
  } else if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Handle errors
  if (!response.ok) {
    let errorData: ApiError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Return typed response
  return response.json();
}
