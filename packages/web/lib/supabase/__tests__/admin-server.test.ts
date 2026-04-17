import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ mocked: true })),
}));

describe("createAdminSupabaseClient", () => {
  let originalServiceRoleKey: string | undefined;
  let originalSupabaseUrl: string | undefined;

  beforeEach(() => {
    originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
    if (originalSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    }
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createAdminSupabaseClient } = await import("../admin-server");
    expect(() => createAdminSupabaseClient()).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/
    );
  });

  it("returns client when env set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";

    const { createAdminSupabaseClient } = await import("../admin-server");
    const client = createAdminSupabaseClient();
    expect(client).toBeDefined();
  });

  it("passes service_role key and disables session to createClient", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

    const { createClient } = await import("@supabase/supabase-js");
    const { createAdminSupabaseClient } = await import("../admin-server");
    createAdminSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-role",
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: false,
          autoRefreshToken: false,
        }),
      })
    );
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is empty string", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

    const { createAdminSupabaseClient } = await import("../admin-server");
    expect(() => createAdminSupabaseClient()).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/
    );
  });
});
