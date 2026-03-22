/**
 * Categories API 함수
 */

import { CategoriesResponse, Category, ApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * API 에러 처리
 */
async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiError;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
  }

  throw new Error(errorData.message || `API Error: ${response.status}`);
}

// ============================================================
// Get Categories
// GET /api/v1/categories
// 인증 불필요
// ============================================================

export async function getCategories(): Promise<CategoriesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
}

/**
 * 카테고리 코드로 ID 찾기
 */
export function findCategoryIdByCode(
  categories: Category[],
  code: string
): string | undefined {
  return categories.find((cat) => cat.code === code)?.id;
}

/**
 * 카테고리 ID로 정보 찾기
 */
export function findCategoryById(
  categories: Category[],
  id: string
): Category | undefined {
  return categories.find((cat) => cat.id === id);
}
