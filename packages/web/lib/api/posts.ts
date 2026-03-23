/**
 * Posts API 함수
 * - 이미지 업로드
 * - AI 분석
 * - Post 생성
 */

import { apiClient, getAuthToken } from "./client";
import type {
  UploadResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  ExtractPostMetadataRequest,
  ExtractPostMetadataResponse,
  CreatePostRequest,
  CreatePostResponse,
  CreatePostWithSolutionRequest,
  PostsListResponse,
  PostsListParams,
  PostResponse,
  PostMagazineResponse,
} from "./mutation-types";
import { ApiError } from "./mutation-types";
import type { UpdatePostDto } from "./generated/models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Upload retry configuration
const UPLOAD_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000, // 1 second
  retryableStatuses: [502, 503, 504],
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Image Upload
// POST /api/v1/posts/upload
// 인증 필요
// ============================================================

export interface UploadImageOptions {
  file: File;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
}

export async function uploadImage({
  file,
  onProgress,
  maxRetries = UPLOAD_RETRY_CONFIG.maxRetries,
}: UploadImageOptions): Promise<UploadResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const formData = new FormData();
  formData.append("file", file);

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Progress: 10% start, add attempt offset for retry visibility
      const baseProgress = attempt > 0 ? 5 : 10;
      onProgress?.(baseProgress);

      const response = await fetch(`${API_BASE_URL}/api/v1/posts/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      onProgress?.(70);

      // Check if response is retryable
      if (UPLOAD_RETRY_CONFIG.retryableStatuses.includes(response.status)) {
        let errorData: ApiError & { retryable?: boolean };

        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: "서버가 일시적으로 응답하지 않습니다.",
            retryable: true,
          };
        }

        // If we have retries left and error is retryable, retry
        if (attempt < maxRetries && errorData.retryable !== false) {
          const delay = UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
          console.log(
            `Upload failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          attempt++;
          continue;
        }

        // No more retries, throw the error
        throw new Error(
          errorData.message ||
            "서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요."
        );
      }

      // Non-retryable error
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

      onProgress?.(100);

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Network errors are retryable
      if (
        attempt < maxRetries &&
        (lastError.message.includes("fetch") ||
          lastError.message.includes("network") ||
          lastError.message.includes("Failed to fetch"))
      ) {
        const delay = UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
        console.log(
          `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      throw lastError;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error("업로드에 실패했습니다.");
}

// ============================================================
// AI Image Analysis
// POST /api/v1/posts/analyze
// 인증 불필요
// ============================================================

export async function analyzeImage(imageUrl: string): Promise<AnalyzeResponse> {
  const request: AnalyzeRequest = { image_url: imageUrl };

  return apiClient<AnalyzeResponse>({
    path: "/api/v1/posts/analyze",
    method: "POST",
    body: request,
    requiresAuth: false,
  });
}

// ============================================================
// AI Metadata Extraction
// POST /api/v1/posts/extract-metadata
// 인증 불필요
// ============================================================

export async function extractPostMetadata(
  description: string
): Promise<ExtractPostMetadataResponse> {
  const request: ExtractPostMetadataRequest = { description };

  return apiClient<ExtractPostMetadataResponse>({
    path: "/api/v1/posts/extract-metadata",
    method: "POST",
    body: request,
    requiresAuth: false,
  });
}

// ============================================================
// Create Post
// POST /api/v1/posts
// 인증 필요
// ============================================================

export async function createPost(
  request: CreatePostRequest
): Promise<CreatePostResponse> {
  return apiClient<CreatePostResponse>({
    path: "/api/v1/posts",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}

// ============================================================
// Create Post with File (2-step: upload + create)
// POST /api/v1/posts
// 이미지 파일과 함께 포스트 생성
// ============================================================

export interface CreatePostWithFileRequest {
  file: File;
  spots: Array<{
    position_left: string;
    position_top: string;
  }>;
  media_source: {
    type: string;
    description?: string;
  };
  artist_name?: string;
  group_name?: string;
  context?: string;
  description?: string;
}

export interface CreatePostWithFileAndSolutionsRequest {
  file: File;
  spots: Array<{
    position_left: string;
    position_top: string;
    solution?: {
      original_url: string;
      title?: string;
      thumbnail_url?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };
  }>;
  media_source: {
    type: string;
    description?: string;
  };
  artist_name?: string;
  group_name?: string;
  context?: string;
  description?: string;
}

export async function createPostWithFile(
  request: CreatePostWithFileRequest
): Promise<CreatePostResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  // Send file directly via FormData to local proxy
  // Backend expects: "image" (file) + "data" (JSON with spots, media_source, etc.)
  const formData = new FormData();
  formData.append("image", request.file);

  const data = {
    image_url: "", // Placeholder - backend will use uploaded image
    spots: request.spots,
    media_source: request.media_source,
    artist_name: request.artist_name,
    group_name: request.group_name,
    context: request.context,
    description: request.description,
  };
  formData.append("data", JSON.stringify(data));

  // Use local proxy to forward FormData directly
  const response = await fetch("/api/v1/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type - browser will set multipart/form-data with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = "포스트 생성에 실패했습니다.";
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage =
        errorJson.message || errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================
// Create Post with File and Solutions
// POST /api/v1/posts/with-solutions
// 솔루션(링크)을 아는 유저용
// ============================================================

export async function createPostWithFileAndSolutions(
  request: CreatePostWithFileAndSolutionsRequest
): Promise<CreatePostResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const formData = new FormData();
  formData.append("image", request.file);

  const data = {
    image_url: "",
    spots: request.spots,
    media_source: request.media_source,
    artist_name: request.artist_name,
    group_name: request.group_name,
    context: request.context,
    description: request.description,
  };
  formData.append("data", JSON.stringify(data));

  const response = await fetch("/api/v1/posts/with-solutions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = "포스트 생성에 실패했습니다.";
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage =
        errorJson.message || errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================
// Create Post with Solution (JSON - deprecated, use createPostWithFileAndSolutions)
// POST /api/v1/posts/with-solution
// Solution을 아는 유저용
// ============================================================

export async function createPostWithSolution(
  request: CreatePostWithSolutionRequest
): Promise<CreatePostResponse> {
  return apiClient<CreatePostResponse>({
    path: "/api/v1/posts/with-solution",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}

// ============================================================
// Fetch Posts List (server-side only)
// GET /api/v1/posts
// For use in server components where generated hooks (React Query) are not available
// ============================================================

/**
 * Build query string from PostsListParams (used by fetchPostsServer)
 */
function buildPostsQueryString(params?: PostsListParams): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.artist_name) searchParams.set("artist_name", params.artist_name);
  if (params.group_name) searchParams.set("group_name", params.group_name);
  if (params.context) searchParams.set("context", params.context);
  if (params.category) searchParams.set("category", params.category);
  if (params.user_id) searchParams.set("user_id", params.user_id);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.per_page !== undefined)
    searchParams.set("per_page", String(params.per_page));
  if (params.has_solutions !== undefined)
    searchParams.set("has_solutions", String(params.has_solutions));
  if (params.has_magazine !== undefined)
    searchParams.set("has_magazine", String(params.has_magazine));

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetch posts list from API (server-side)
 * For use in server components where Supabase auth is not available
 */
export async function fetchPostsServer(
  params?: PostsListParams
): Promise<PostsListResponse> {
  const queryString = buildPostsQueryString(params);
  const serverApiBase = process.env.API_BASE_URL || API_BASE_URL;

  const response = await fetch(`${serverApiBase}/api/v1/posts${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    // Return empty response on error for graceful degradation
    console.error(`Failed to fetch posts: ${response.status}`);
    return {
      data: [],
      pagination: {
        current_page: params?.page ?? 1,
        per_page: params?.per_page ?? 20,
        total_items: 0,
        total_pages: 0,
      },
    };
  }

  return response.json();
}

// ============================================================
// Fetch Post Magazine
// GET /api/v1/post-magazines/{magazineId}
// ============================================================

export async function fetchPostMagazine(
  magazineId: string
): Promise<PostMagazineResponse> {
  return apiClient<PostMagazineResponse>({
    path: `/api/v1/post-magazines/${magazineId}`,
    method: "GET",
    requiresAuth: false,
  });
}

// ============================================================
// Update Post
// PATCH /api/v1/posts/{postId}
// 인증 필요
// ============================================================

/**
 * Update a post
 * PATCH /api/v1/posts/{postId}
 * Requires authentication
 */
export async function updatePost(
  postId: string,
  data: UpdatePostDto
): Promise<PostResponse> {
  return apiClient<PostResponse>({
    path: `/api/v1/posts/${postId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Delete Post
// DELETE /api/v1/posts/{postId}
// 인증 필요
// ============================================================

/**
 * Delete a post
 * DELETE /api/v1/posts/{postId}
 * Requires authentication
 */
export async function deletePost(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}
