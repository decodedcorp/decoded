/**
 * @vitest-environment jsdom
 *
 * BrandsPage empty / loading / error state tests.
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mock next/navigation ---
const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsRef.current,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

// --- Mock the data hooks ---
const useBrandListMock = vi.fn();

vi.mock("@/lib/api/admin/entities", () => ({
  useBrandList: (...args: unknown[]) => useBrandListMock(...args),
  useCreateBrand: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBrand: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteBrand: () => ({ mutate: vi.fn(), isPending: false }),
}));

import BrandsPage from "../page";

beforeEach(() => {
  useBrandListMock.mockReset();
  searchParamsRef.current = new URLSearchParams();
});

describe("BrandsPage — empty state", () => {
  test("renders AdminEmptyState when no data and no filter", () => {
    useBrandListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<BrandsPage />);

    expect(screen.getByText("No brands yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first brand entity using the button above.")
    ).toBeInTheDocument();
  });

  test("does NOT render AdminEmptyState when search filter is active and data is empty", () => {
    searchParamsRef.current = new URLSearchParams("search=nonexistent");
    useBrandListMock.mockReturnValue({
      data: { data: [], pagination: undefined },
      isLoading: false,
      isError: false,
    });

    render(<BrandsPage />);

    expect(screen.queryByText("No brands yet")).not.toBeInTheDocument();
    expect(screen.getByText("No brands found")).toBeInTheDocument();
  });

  test("renders table when data has rows", () => {
    useBrandListMock.mockReturnValue({
      data: {
        data: [
          {
            id: "brand-1",
            name_en: "Test Brand",
            name_ko: "테스트 브랜드",
            logo_image_url: null,
            primary_instagram_account_id: null,
            metadata: null,
          },
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_items: 1,
          total_pages: 1,
        },
      },
      isLoading: false,
      isError: false,
    });

    render(<BrandsPage />);

    expect(screen.queryByText("No brands yet")).not.toBeInTheDocument();
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", () => {
    useBrandListMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<BrandsPage />);

    expect(
      screen.getByText("Failed to load brands. Please try refreshing the page.")
    ).toBeInTheDocument();
    expect(screen.queryByText("No brands yet")).not.toBeInTheDocument();
  });
});
