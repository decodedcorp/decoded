import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";

export interface ItemData {
  id: string;
  title: string;
  thumbnail_url: string;
  description: string | null;
  keywords: string[] | null;
}

export type Category = "tops" | "bottoms";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "tops", label: "Tops" },
  { key: "bottoms", label: "Bottoms" },
];

interface UseVtonItemFetchResult {
  items: ItemData[];
  isLoadingItems: boolean;
}

/**
 * Fetches VTON items by category with debounced search.
 * Uses AbortController pattern to cancel in-flight requests.
 */
export function useVtonItemFetch(
  isOpen: boolean,
  activeCategory: Category,
  searchQuery: string,
  preloadedItems?: ItemData[]
): UseVtonItemFetchResult {
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const debouncedQuery = useDebounce(searchQuery.trim(), 300);

  useEffect(() => {
    if (!isOpen) return;

    if (preloadedItems && preloadedItems.length > 0) {
      setItems(preloadedItems);
      return;
    }

    const controller = new AbortController();
    setIsLoadingItems(true);

    const params = new URLSearchParams({ category: activeCategory });
    if (debouncedQuery) params.set("q", debouncedQuery);

    fetch(`/api/v1/vton/items?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setIsLoadingItems(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setItems([]);
        setIsLoadingItems(false);
      });

    return () => controller.abort();
  }, [isOpen, activeCategory, debouncedQuery, preloadedItems]);

  return { items, isLoadingItems };
}
