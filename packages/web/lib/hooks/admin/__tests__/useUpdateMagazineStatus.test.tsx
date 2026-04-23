/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateMagazineStatus } from "../useUpdateMagazineStatus";

let client: QueryClient;
let invalidateSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  invalidateSpy = vi.fn();
  client.invalidateQueries = invalidateSpy as never;
});

function makeWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useUpdateMagazineStatus", () => {
  it("PATCHes status and invalidates admin magazines list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "m1", status: "published" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useUpdateMagazineStatus(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ id: "m1", status: "published" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/posts/magazines/m1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "published" }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["admin", "magazines"] })
    );
  });

  it("includes rejectionReason in body when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "m1", status: "rejected" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useUpdateMagazineStatus(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: "m1",
      status: "rejected",
      rejectionReason: "off-topic",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      status: "rejected",
      rejectionReason: "off-topic",
    });
  });

  it("throws Error with server message on non-OK", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "invalid_transition: draft -> published" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useUpdateMagazineStatus(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ id: "m1", status: "published" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain(
      "invalid_transition"
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
