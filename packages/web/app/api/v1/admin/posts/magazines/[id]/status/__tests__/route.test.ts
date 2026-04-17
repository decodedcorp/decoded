import { describe, it, expect, vi, beforeEach } from "vitest";

const checkIsAdmin = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/api/admin/auth", () => ({
  checkIsAdmin: (...args: unknown[]) => checkIsAdmin(...args),
}));

vi.mock("@/lib/supabase/admin-server", () => ({
  createAdminSupabaseClient: () => ({ rpc }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/x", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/admin/posts/magazines/[id]/status", () => {
  beforeEach(() => {
    checkIsAdmin.mockReset();
    rpc.mockReset();
  });

  it("returns 403 when not admin", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: false });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid_json body", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/x", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "m1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it("rejects invalid status with 400", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "foo" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_status");
  });

  it("requires rejection_reason when rejecting (empty string)", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    const { PATCH } = await import("../route");
    const res = await PATCH(
      makeRequest({ status: "rejected", rejectionReason: "   " }),
      { params: Promise.resolve({ id: "m1" }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("rejection_reason_required");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("approves pending → published via RPC", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: [{ id: "m1", status: "published" }],
      error: null,
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_magazine_status", {
      p_magazine_id: "m1",
      p_new_status: "published",
      p_admin_user_id: "admin-1",
    });
  });

  it("passes rejection_reason through RPC", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: [{ id: "m1", status: "rejected" }],
      error: null,
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(
      makeRequest({ status: "rejected", rejectionReason: "low quality" }),
      { params: Promise.resolve({ id: "m1" }) }
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_magazine_status", {
      p_magazine_id: "m1",
      p_new_status: "rejected",
      p_admin_user_id: "admin-1",
      p_rejection_reason: "low quality",
    });
  });

  it("maps magazine_not_found to 404", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "magazine_not_found", code: "P0002" },
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(404);
  });

  it("maps invalid_transition to 409", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: "invalid_transition: draft -> published",
        code: "P0001",
      },
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("invalid_transition");
  });

  it("maps unknown RPC error to 500 with generic message", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "kaboom — raw db internals" },
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must not leak raw DB message to client.
    expect(body.error).toBe("internal_error");
    expect(body).not.toHaveProperty("message");
  });

  it("maps caller_not_admin from RPC to 403", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "caller_not_admin", code: "P0003" },
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("maps caller_mismatch from RPC to 403", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "caller_mismatch", code: "P0003" },
    });
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(403);
  });

  it("rejects rejection_reason longer than 2000 chars before RPC", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    const { PATCH } = await import("../route");
    const tooLong = "x".repeat(2001);
    const res = await PATCH(
      makeRequest({ status: "rejected", rejectionReason: tooLong }),
      { params: Promise.resolve({ id: "m1" }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("rejection_reason_too_long");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps rejection_reason_too_long from RPC (defense-in-depth) to 400", async () => {
    checkIsAdmin.mockResolvedValue({ isAdmin: true, userId: "admin-1" });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "rejection_reason_too_long", code: "P0001" },
    });
    const { PATCH } = await import("../route");
    // Route pre-check won't fire (reason within limit), so the RPC
    // branch is the one exercised.
    const res = await PATCH(
      makeRequest({ status: "rejected", rejectionReason: "ok" }),
      { params: Promise.resolve({ id: "m1" }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("rejection_reason_too_long");
  });
});
