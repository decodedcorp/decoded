import { describe, it, expect, vi, beforeEach } from "vitest";

const checkIsAdmin = vi.fn();
const rangeFn = vi.fn();

vi.mock("@/lib/api/admin/auth", () => ({
  checkIsAdmin: (...args: unknown[]) => checkIsAdmin(...args),
}));

vi.mock("@/lib/supabase/server", () => {
  const chain: Record<string, unknown> = {};
  ["select", "eq", "order"].forEach((m) => {
    chain[m] = () => chain;
  });
  chain.range = (...args: unknown[]) => rangeFn(...args);
  return {
    createSupabaseServerClient: async () => ({
      from: () => chain,
    }),
  };
});

function makeRequest(url: string) {
  return new Request(url);
}

describe("GET /api/v1/admin/posts/magazines", () => {
  beforeEach(() => {
    checkIsAdmin.mockReset();
    rangeFn.mockReset();
  });

  it("returns 403 when not admin", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: false });
    const { GET } = await import("../route");
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines")
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid status", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    const { GET } = await import("../route");
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines?status=foo")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_status");
  });

  it("returns list with pending filter", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rangeFn.mockResolvedValue({
      data: [
        {
          id: "m1",
          title: "t",
          status: "pending",
          author_id: "u1",
          submitted_at: "2026-04-17T00:00:00Z",
          published_at: null,
          rejection_reason: null,
          approved_by: null,
        },
      ],
      count: 1,
      error: null,
    });
    const { GET } = await import("../route");
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/admin/posts/magazines?status=pending&page=2&limit=10"
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
    expect(body.data).toHaveLength(1);
    expect(rangeFn).toHaveBeenCalledWith(10, 19);
  });

  it("returns 500 when query errors", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rangeFn.mockResolvedValue({
      data: null,
      count: null,
      error: { message: "db boom" },
    });
    const { GET } = await import("../route");
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines")
    );
    expect(res.status).toBe(500);
  });

  it("clamps limit to 100 max and 1 min", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rangeFn.mockResolvedValue({ data: [], count: 0, error: null });
    const { GET } = await import("../route");
    await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines?limit=9999")
    );
    expect(rangeFn).toHaveBeenCalledWith(0, 99);
  });
});
