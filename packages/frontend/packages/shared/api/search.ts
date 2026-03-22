/**
 * Search API Functions
 *
 * Client-side API calls for search functionality.
 * Based on API spec: docs/api/search.md
 */

import type {
  SearchParams,
  SearchResponse,
  PopularSearchesResponse,
  RecentSearchesResponse,
  PopularKeywordsResponse,
  SearchResultItem,
  GroupedSearchResults,
} from "../types/search";

// ============================================================
// API Configuration
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// ============================================================
// Helper Functions
// ============================================================

function buildSearchParams(params: SearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", params.category);
  if (params.media_type) searchParams.set("media_type", params.media_type);
  if (params.context) searchParams.set("context", params.context);
  if (params.has_adopted !== undefined)
    searchParams.set("has_adopted", String(params.has_adopted));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  return searchParams;
}

async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Search API Functions
// ============================================================

/**
 * Fetch unified search results
 *
 * @param params - Search parameters
 * @returns Search response with data, facets, and pagination
 */
export async function fetchUnifiedSearch(
  params: SearchParams
): Promise<SearchResponse> {
  const searchParams = buildSearchParams(params);
  const url = `${API_BASE_URL}/search?${searchParams.toString()}`;

  return fetchWithErrorHandling<SearchResponse>(url);
}

/**
 * Fetch popular search terms
 *
 * @returns List of popular search terms with rank and count
 */
export async function fetchPopularSearches(): Promise<PopularSearchesResponse> {
  const url = `${API_BASE_URL}/search/popular`;
  return fetchWithErrorHandling<PopularSearchesResponse>(url);
}

/**
 * Fetch recent search history (requires authentication)
 *
 * @param token - Authentication token
 * @returns List of recent searches for the authenticated user
 */
export async function fetchRecentSearches(
  token?: string
): Promise<RecentSearchesResponse> {
  const url = `${API_BASE_URL}/search/recent`;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetchWithErrorHandling<RecentSearchesResponse>(url, { headers });
}

/**
 * Delete recent search history (requires authentication)
 *
 * @param token - Authentication token
 * @param id - Optional: specific search ID to delete. If not provided, deletes all.
 */
export async function deleteRecentSearches(
  token: string,
  id?: string
): Promise<void> {
  const url = id
    ? `${API_BASE_URL}/search/recent?id=${id}`
    : `${API_BASE_URL}/search/recent`;

  await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Fetch popular keywords for tag cloud/chips
 *
 * @returns List of popular keywords with counts
 */
export async function fetchPopularKeywords(): Promise<PopularKeywordsResponse> {
  const url = `${API_BASE_URL}/search/keywords/popular`;
  return fetchWithErrorHandling<PopularKeywordsResponse>(url);
}

// ============================================================
// Helper: Group Search Results by Type
// ============================================================

/**
 * Group search results by type for "All" tab display
 *
 * @param results - Raw search results
 * @returns Grouped results by people, media, and items
 */
export function groupSearchResults(
  results: SearchResultItem[]
): GroupedSearchResults {
  const grouped: GroupedSearchResults = {
    people: [],
    media: [],
    items: [],
    totalCount: results.length,
  };

  for (const item of results) {
    switch (item.type) {
      case "person":
        grouped.people.push(item);
        break;
      case "media":
        grouped.media.push(item);
        break;
      case "item":
      case "post":
        grouped.items.push(item);
        break;
    }
  }

  return grouped;
}

// ============================================================
// Mock Data Functions (for development/testing)
// ============================================================

/**
 * Generate mock search response for development
 */
export function getMockSearchResponse(query: string): SearchResponse {
  const mockPeople: SearchResultItem[] = [
    {
      id: "person-1",
      type: "person",
      image_url: "https://images.decoded.co/person1.jpg",
      artist_name: query,
      profile_image_url: "https://images.decoded.co/person1.jpg",
      category: "K-POP",
      item_count: 42,
    },
    {
      id: "person-2",
      type: "person",
      image_url: "https://images.decoded.co/person2.jpg",
      artist_name: `Kim ${query}`,
      profile_image_url: "https://images.decoded.co/person2.jpg",
      category: "K-Drama",
      item_count: 15,
    },
  ];

  const mockMedia: SearchResultItem[] = [
    {
      id: "media-1",
      type: "media",
      image_url: "https://images.decoded.co/media1.jpg",
      poster_url: "https://images.decoded.co/media1.jpg",
      media_source: { type: "drama", title: `${query} Drama` },
      year: 2024,
      item_count: 28,
    },
  ];

  const mockItems: SearchResultItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `item-${i}`,
    type: "item" as const,
    image_url: `https://images.decoded.co/item${i}.jpg`,
    thumbnail_url: `https://images.decoded.co/item${i}.jpg`,
    brand: "Brand Name",
    product_name: `Product ${i + 1}`,
  }));

  return {
    data: [...mockPeople, ...mockMedia, ...mockItems],
    facets: {
      category: { fashion: 45, living: 12, tech: 3, beauty: 8 },
      media_type: { drama: 20, movie: 10, mv: 35, youtube: 5, variety: 13 },
      context: {
        airport: 15,
        stage: 25,
        mv: 28,
        red_carpet: 10,
        photoshoot: 8,
        interview: 5,
        daily: 12,
      },
    },
    pagination: {
      current_page: 1,
      per_page: 20,
      total_items: mockPeople.length + mockMedia.length + mockItems.length,
      total_pages: 1,
    },
    query,
    took_ms: 45,
  };
}

/**
 * Generate mock popular searches for development
 */
export function getMockPopularSearches(): PopularSearchesResponse {
  return {
    data: [
      { rank: 1, query: "아이유", search_count: 1520 },
      { rank: 2, query: "뉴진스", search_count: 1380 },
      { rank: 3, query: "더 글로리", search_count: 980 },
      { rank: 4, query: "BTS", search_count: 850 },
      { rank: 5, query: "공항패션", search_count: 720 },
    ],
  };
}

/**
 * Generate mock popular keywords for development
 */
export function getMockPopularKeywords(): PopularKeywordsResponse {
  return {
    keywords: [
      { keyword: "블레이저", count: 520 },
      { keyword: "공항패션", count: 480 },
      { keyword: "오버사이즈", count: 350 },
      { keyword: "미니백", count: 280 },
      { keyword: "니트", count: 250 },
    ],
  };
}
