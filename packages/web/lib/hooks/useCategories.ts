/**
 * 카테고리 조회 훅
 * React Query를 사용하여 카테고리 목록을 캐싱합니다.
 */

import { useQuery } from "@tanstack/react-query";
import { getCategories, type Category } from "@/lib/api";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

/**
 * 카테고리 목록 조회 훅
 */
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 60, // 1시간 동안 fresh
    gcTime: 1000 * 60 * 60 * 24, // 24시간 캐시 유지
  });
}

/**
 * 카테고리 코드로 ID 찾기
 */
export function useFindCategoryId(code: string | undefined) {
  const { data: categories } = useCategories();

  if (!code || !categories) return undefined;

  return categories.find((cat) => cat.code === code)?.id;
}

/**
 * 카테고리 ID로 정보 찾기
 */
export function useFindCategory(id: string | undefined): Category | undefined {
  const { data: categories } = useCategories();

  if (!id || !categories) return undefined;

  return categories.find((cat) => cat.id === id);
}

/**
 * 카테고리 코드 맵 생성 (code -> id)
 */
export function useCategoryCodeMap(): Map<string, string> {
  const { data: categories } = useCategories();

  if (!categories) return new Map();

  return new Map(categories.map((cat) => [cat.code, cat.id]));
}
