/**
 * Unit tests for GET /api/v1/admin/posts
 *
 * Verifies that:
 * - 401 is returned when no Supabase session exists
 * - 403 is returned when session exists but user is not admin
 * - 401 is returned when session has no access_token
 * - The Supabase session access_token is forwarded as `Authorization: Bearer <token>`
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const checkIsAdminMock = vi.fn();
const backendFetchMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  checkIsAdmin: (...args: unknown[]) => checkIsAdminMock(...args),
}));

vi.mock("@/lib/server-env", () => ({
  API_BASE_URL: "http://api.test",
}));

const getUserMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: () => getUserMock(),
      getSession: () => getSessionMock(),
    },
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url = "http://localhost/api/v1/admin/posts") {
  return new NextRequest(url);
}

function mockAdminSession(accessToken = "test-token") {
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  checkIsAdminMock.mockResolvedValue(true);
  getSessionMock.mockResolvedValue({
    data: { session: { access_token: accessToken } },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/v1/admin/posts", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getSessionMock.mockReset();
    checkIsAdminMock.mockReset();
    backendFetchMock.mockReset();
    vi.stubGlobal("fetch", backendFetchMock);
  });

  it("returns 401 when no user session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    checkIsAdminMock.mockResolvedValue(false);

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 401 when session has no access_token", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    checkIsAdminMock.mockResolvedValue(true);
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("forwards Supabase access_token as Bearer to Rust backend", async () => {
    mockAdminSession("supabase-jwt-posts");

    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [],
          pagination: { current_page: 1, total_pages: 1 },
        }),
    });

    const { GET } = await import("../route");
    await GET(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledOnce();
    const [url, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/admin/posts");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer supabase-jwt-posts"
    );
  });

  it("returns 200 with backend data on success", async () => {
    mockAdminSession();

    const payload = {
      data: [{ id: "p1" }],
      pagination: { current_page: 1, total_pages: 1 },
    };
    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify(payload),
    });

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("returns 502 when backend fetch throws", async () => {
    mockAdminSession();
    backendFetchMock.mockRejectedValue(new Error("network error"));

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(502);
  });

  it("forwards status query param to backend URL", async () => {
    mockAdminSession();

    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [],
          pagination: { current_page: 1, total_pages: 1 },
        }),
    });

    const { GET } = await import("../route");
    await GET(
      makeRequest("http://localhost/api/v1/admin/posts?status=hidden&page=2")
    );

    const [url] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("status=hidden");
    expect(url).toContain("page=2");
  });
});
