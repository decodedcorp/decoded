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
});
