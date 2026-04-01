import { describe, test, expect, vi, beforeEach } from "vitest";

/**
 * Tests for hasMagazine filter in useInfinitePosts.
 *
 * Strategy: Mock supabaseBrowserClient with a chainable builder that records
 * method calls, then verify `.not("post_magazine_id", "is", null)` is called
 * only when hasMagazine=true.
 */

// Records all method calls on the query chain
let recordedCalls: { method: string; args: any[] }[] = [];

function makeChain(): any {
  const obj: any = {};
  const methods = [
    "select",
    "eq",
    "not",
    "ilike",
    "order",
    "range",
    "limit",
    "or",
    "filter",
  ];
  for (const m of methods) {
    obj[m] = (...args: any[]) => {
      recordedCalls.push({ method: m, args });
      return obj;
    };
  }
  // Terminal: make awaitable
  obj.then = (resolve: any) => resolve({ data: [], count: 0, error: null });
  return obj;
}

// Mock the Supabase client module
vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowserClient: {
    from: (table: string) => {
      recordedCalls.push({ method: "from", args: [table] });
      return makeChain();
    },
  },
}));

// Mock React Query -- capture queryFn for direct invocation
let capturedQueryFn: any = null;
vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (opts: any) => {
    capturedQueryFn = opts.queryFn;
    return {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };
  },
}));

import { useInfinitePosts } from "@/lib/hooks/useImages";

describe("useInfinitePosts hasMagazine filter", () => {
  beforeEach(() => {
    recordedCalls = [];
    capturedQueryFn = null;
  });

  test("hasMagazine=true adds .not(post_magazine_id, is, null) to query", async () => {
    useInfinitePosts({ hasMagazine: true });
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    const magazineNotCalls = recordedCalls.filter(
      (c) => c.method === "not" && c.args[0] === "post_magazine_id"
    );
    expect(magazineNotCalls).toHaveLength(1);
    expect(magazineNotCalls[0].args).toEqual([
      "post_magazine_id",
      "is",
      null,
    ]);
  });

  test("hasMagazine=false does NOT add post_magazine_id filter", async () => {
    useInfinitePosts({ hasMagazine: false });
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    const magazineNotCalls = recordedCalls.filter(
      (c) => c.method === "not" && c.args[0] === "post_magazine_id"
    );
    expect(magazineNotCalls).toHaveLength(0);
  });

  test("hasMagazine=undefined does NOT add post_magazine_id filter", async () => {
    useInfinitePosts({});
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    const magazineNotCalls = recordedCalls.filter(
      (c) => c.method === "not" && c.args[0] === "post_magazine_id"
    );
    expect(magazineNotCalls).toHaveLength(0);
  });
});
