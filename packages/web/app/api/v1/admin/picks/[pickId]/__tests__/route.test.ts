import { describe, it, expect, vi, beforeEach } from "vitest";

const checkIsAdmin = vi.fn();
const writeAuditLogMock = vi.fn();
const preSingle = vi.fn();
const updateSingle = vi.fn();
const deleteFn = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  checkIsAdmin: (...args: unknown[]) => checkIsAdmin(...args),
}));

vi.mock("@/lib/api/admin/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

let fromCallCount = 0;
let secondChainMode: "update" | "delete" = "update";

vi.mock("@/lib/supabase/server", () => {
  function createPreChain() {
    const chain: Record<string, unknown> = {};
    ["select", "eq"].forEach((m) => {
      chain[m] = () => chain;
    });
    chain.maybeSingle = (...args: unknown[]) => preSingle(...args);
    return chain;
  }
  function createUpdateChain() {
    const chain: Record<string, unknown> = {};
    ["update", "eq", "select"].forEach((m) => {
      chain[m] = () => chain;
    });
    chain.single = (...args: unknown[]) => updateSingle(...args);
    return chain;
  }
  function createDeleteChain() {
    const chain: Record<string, unknown> = {};
    chain.delete = () => chain;
    chain.eq = (...args: unknown[]) => deleteFn(...args);
    return chain;
  }
  return {
    createSupabaseServerClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: "admin-1" } } }),
      },
      from: () => {
        fromCallCount++;
        if (fromCallCount === 1) return createPreChain();
        return secondChainMode === "delete"
          ? createDeleteChain()
          : createUpdateChain();
      },
    }),
  };
});

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/v1/admin/picks/pick-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function makeDeleteRequest() {
  return new Request("http://localhost/api/v1/admin/picks/pick-1", {
    method: "DELETE",
  }) as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  checkIsAdmin.mockReset();
  writeAuditLogMock.mockReset();
  preSingle.mockReset();
  updateSingle.mockReset();
  deleteFn.mockReset();
  fromCallCount = 0;
});

describe("PATCH /api/v1/admin/picks/:pickId", () => {
  beforeEach(() => {
    secondChainMode = "update";
  });

  it("returns 403 when caller is not admin", async () => {
    checkIsAdmin.mockResolvedValue(false);
    const { PATCH } = await import("../route");
    const res = await PATCH(makePatchRequest({ note: "x" }), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });
    expect(res.status).toBe(403);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });

  it("writes pick_update audit with before/after and changed fields", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({
      data: { id: "pick-1", note: "old" },
      error: null,
    });
    updateSingle.mockResolvedValue({
      data: { id: "pick-1", note: "new" },
      error: null,
    });

    const { PATCH } = await import("../route");
    const res = await PATCH(makePatchRequest({ note: "new" }), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });

    expect(res.status).toBe(200);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: "admin-1",
        action: "pick_update",
        targetTable: "decoded_picks",
        targetId: "pick-1",
        metadata: { fields: ["note"] },
      })
    );
  });

  it("skips audit on update error", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({
      data: { id: "pick-1" },
      error: null,
    });
    updateSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { PATCH } = await import("../route");
    const res = await PATCH(makePatchRequest({ note: "x" }), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });

    expect(res.status).toBe(500);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/admin/picks/:pickId", () => {
  beforeEach(() => {
    secondChainMode = "delete";
  });

  it("returns 403 when caller is not admin", async () => {
    checkIsAdmin.mockResolvedValue(false);
    const { DELETE } = await import("../route");
    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });
    expect(res.status).toBe(403);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });

  it("writes pick_delete audit with captured beforeState", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({
      data: { id: "pick-1", post_id: "p1" },
      error: null,
    });
    deleteFn.mockResolvedValue({ error: null });

    const { DELETE } = await import("../route");
    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });

    expect(res.status).toBe(200);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pick_delete",
        targetTable: "decoded_picks",
        targetId: "pick-1",
        beforeState: { id: "pick-1", post_id: "p1" },
        afterState: null,
      })
    );
  });

  it("skips audit when delete errors", async () => {
    checkIsAdmin.mockResolvedValue(true);
    preSingle.mockResolvedValue({
      data: { id: "pick-1" },
      error: null,
    });
    deleteFn.mockResolvedValue({ error: { message: "boom" } });

    const { DELETE } = await import("../route");
    const res = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ pickId: "pick-1" }),
    });

    expect(res.status).toBe(500);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });
});
