/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminMagazineList } from "../useAdminMagazineList";

beforeEach(() => {
  vi.restoreAllMocks();
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAdminMagazineList", () => {
  it("fetches magazines with status filter + pagination", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, page: 1, limit: 20 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(
      () => useAdminMagazineList({ status: "pending", page: 1, limit: 20 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("status=pending"),
      expect.anything()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.anything()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("limit=20"),
      expect.anything()
    );
  });

  it("omits status query param when undefined", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, page: 1, limit: 20 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminMagazineList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("status=");
  });

  it("throws on non-OK HTTP response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "forbidden" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAdminMagazineList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
