import { describe, test, expect, vi, beforeEach } from "vitest";

/**
 * Tests for hasMagazine filter in useInfinitePosts.
 *
 * When hasMagazine=true, the hook should use REST API listPosts with has_magazine=true
 * instead of Supabase direct query (which lacks magazine columns).
 * When hasMagazine=false/undefined, it should use Supabase direct query as before.
 */

// Records all Supabase method calls on the query chain
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

// Track listPosts calls
let listPostsCalls: any[] = [];
vi.mock("@/lib/api/generated/posts/posts", () => ({
  getPost: vi.fn(),
  listPosts: vi.fn(async (params: any) => {
    listPostsCalls.push(params);
    return {
      data: [],
      pagination: { current_page: 1, total_pages: 0, total_items: 0, per_page: 40 },
    };
  }),
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
    listPostsCalls = [];
    capturedQueryFn = null;
  });

  test("hasMagazine=true uses REST API listPosts with has_magazine=true", async () => {
    useInfinitePosts({ hasMagazine: true });
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    // Should call REST API, not Supabase
    expect(listPostsCalls).toHaveLength(1);
    expect(listPostsCalls[0].has_magazine).toBe(true);
    // Should NOT touch Supabase
    const supabaseFromCalls = recordedCalls.filter((c) => c.method === "from");
    expect(supabaseFromCalls).toHaveLength(0);
  });

  test("hasMagazine=false does NOT use REST API, uses Supabase", async () => {
    useInfinitePosts({ hasMagazine: false });
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    // Should NOT call REST API
    expect(listPostsCalls).toHaveLength(0);
    // Should use Supabase
    const supabaseFromCalls = recordedCalls.filter((c) => c.method === "from");
    expect(supabaseFromCalls).toHaveLength(1);
  });

  test("hasMagazine=undefined does NOT use REST API, uses Supabase", async () => {
    useInfinitePosts({});
    expect(capturedQueryFn).toBeDefined();

    await capturedQueryFn({ pageParam: 1 });

    expect(listPostsCalls).toHaveLength(0);
    const supabaseFromCalls = recordedCalls.filter((c) => c.method === "from");
    expect(supabaseFromCalls).toHaveLength(1);
  });
});
