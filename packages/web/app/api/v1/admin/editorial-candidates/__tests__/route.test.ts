/**
 * Unit tests for GET /api/v1/admin/editorial-candidates
 *
 * Verifies that:
 * - 401 is returned when no Supabase session exists
 * - 403 is returned when session exists but user is not admin
 * - 401 is returned when session has no access_token
 * - The Supabase session access_token (not the incoming request Authorization
 *   header) is forwarded to the Rust backend as `Authorization: Bearer <token>`
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

// Supabase server client mock — returns configurable user/session
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

function makeRequest(
  url = "http://localhost/api/v1/admin/editorial-candidates"
) {
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

describe("GET /api/v1/admin/editorial-candidates", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getSessionMock.mockReset();
    checkIsAdminMock.mockReset();
    backendFetchMock.mockReset();
    // Reset the global fetch stub before each test
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
    mockAdminSession("supabase-jwt-abc123");

    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    const { GET } = await import("../route");
    await GET(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledOnce();
    const [url, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/admin/editorial-candidates");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer supabase-jwt-abc123"
    );
  });

  it("does NOT forward an empty Authorization header to Rust backend", async () => {
    mockAdminSession("my-session-token");

    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({ data: [], total: 0, page: 1, per_page: 20 }),
    });

    // Simulate a request with NO Authorization header (typical browser fetch)
    const { GET } = await import("../route");
    await GET(makeRequest());

    const [, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    // Must be a real Bearer token, not an empty string
    expect((init.headers as Record<string, string>)["Authorization"]).not.toBe(
      ""
    );
    expect((init.headers as Record<string, string>)["Authorization"]).not.toBe(
      "Bearer "
    );
  });

  it("returns 200 with backend data on success", async () => {
    mockAdminSession();

    const payload = {
      data: [{ id: "post-1" }],
      total: 1,
      page: 1,
      per_page: 20,
    };
    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify(payload),
    });

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("returns 502 when backend fetch throws", async () => {
    mockAdminSession();
    backendFetchMock.mockRejectedValue(new Error("connection refused"));

    const { GET } = await import("../route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(502);
  });

  it("forwards page and perPage query params to backend", async () => {
    mockAdminSession();

    backendFetchMock.mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({ data: [], total: 0, page: 2, per_page: 10 }),
    });

    const { GET } = await import("../route");
    await GET(
      makeRequest(
        "http://localhost/api/v1/admin/editorial-candidates?page=2&perPage=10"
      )
    );

    const [url] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("page=2");
    expect(url).toContain("per_page=10");
  });
});
