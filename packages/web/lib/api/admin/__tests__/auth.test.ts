import { describe, it, expect, vi, beforeEach } from "vitest";

const getUser = vi.fn();
const dbCheckIsAdmin = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  checkIsAdmin: (...args: unknown[]) => dbCheckIsAdmin(...args),
}));

describe("checkIsAdmin (api wrapper)", () => {
  beforeEach(() => {
    getUser.mockReset();
    dbCheckIsAdmin.mockReset();
  });

  it("returns { isAdmin: false } when no user session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { checkIsAdmin } = await import("../auth");
    const res = await checkIsAdmin();
    expect(res.isAdmin).toBe(false);
    expect(res.userId).toBeUndefined();
    expect(dbCheckIsAdmin).not.toHaveBeenCalled();
  });

  it("returns { isAdmin: true, userId } when db says admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    dbCheckIsAdmin.mockResolvedValue(true);
    const { checkIsAdmin } = await import("../auth");
    const res = await checkIsAdmin();
    expect(res).toEqual({ isAdmin: true, userId: "u-1" });
  });

  it("returns { isAdmin: false } when user exists but not admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u-2" } } });
    dbCheckIsAdmin.mockResolvedValue(false);
    const { checkIsAdmin } = await import("../auth");
    const res = await checkIsAdmin();
    expect(res.isAdmin).toBe(false);
    expect(res.userId).toBeUndefined();
  });
});
