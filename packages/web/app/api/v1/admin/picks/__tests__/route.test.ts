import { describe, it, expect, vi, beforeEach } from "vitest";

const checkIsAdmin = vi.fn();
const upsertSingle = vi.fn();
const preSingle = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  checkIsAdmin: (...args: unknown[]) => checkIsAdmin(...args),
}));

vi.mock("@/lib/api/admin/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

vi.mock("@/lib/supabase/server", () => {
  // Two distinct chains: one for the pre-read (maybeSingle) and one for the upsert (single).
  function createPreChain() {
    const chain: Record<string, unknown> = {};
    ["select", "eq"].forEach((m) => {
      chain[m] = () => chain;
    });
    chain.maybeSingle = (...args: unknown[]) => preSingle(...args);
    return chain;
  }
  function createUpsertChain() {
    const chain: Record<string, unknown> = {};
    ["upsert", "select"].forEach((m) => {
      chain[m] = () => chain;
    });
    chain.single = (...args: unknown[]) => upsertSingle(...args);
    return chain;
  }
  return {
    createSupabaseServerClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: "admin-1" } } }),
      },
      from: () => {
        // Alternate between pre-read (first call) and upsert (second call).
        fromCallCount++;
        return fromCallCount === 1 ? createPreChain() : createUpsertChain();
      },
    }),
  };
});

let fromCallCount = 0;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/v1/admin/picks", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  checkIsAdmin.mockReset();
  upsertSingle.mockReset();
  preSingle.mockReset();
  writeAuditLogMock.mockReset();
  fromCallCount = 0;
});

describe("POST /api/v1/admin/picks", () => {
  it("returns 403 when caller is not admin", async () => {
    checkIsAdmin.mockResolvedValue(false);
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ post_id: "p1" }));
    expect(res.status).toBe(403);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });

  it("writes pick_create audit on new date slot", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({ data: null, error: null });
    upsertSingle.mockResolvedValue({
      data: { id: "pick-1", post_id: "p1" },
      error: null,
    });

    const { POST } = await import("../route");
    const res = await POST(makeRequest({ post_id: "p1" }));

    expect(res.status).toBe(201);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: "admin-1",
        action: "pick_create",
        targetTable: "decoded_picks",
        targetId: "pick-1",
      })
    );
  });

  it("writes pick_update audit when slot already occupied", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({
      data: { id: "pick-old", post_id: "p_old" },
      error: null,
    });
    upsertSingle.mockResolvedValue({
      data: { id: "pick-old", post_id: "p1" },
      error: null,
    });

    const { POST } = await import("../route");
    const res = await POST(makeRequest({ post_id: "p1" }));

    expect(res.status).toBe(201);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "pick_update" })
    );
  });

  it("does not write audit log when insert errors", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({ data: null, error: null });
    upsertSingle.mockResolvedValue({
      data: null,
      error: { message: "db boom" },
    });

    const { POST } = await import("../route");
    const res = await POST(makeRequest({ post_id: "p1" }));

    expect(res.status).toBe(500);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });
});
