/**
 * Playwright auth setup fixture.
 *
 * Creates a Supabase session via signInWithPassword and saves storageState so
 * authenticated E2E tests can reuse the session without repeating login.
 *
 * Run order: "setup" project → "chromium" project (dependency chain).
 * The saved file (.playwright/storageState.json) is gitignored — it contains
 * real auth tokens and must never be committed.
 */
import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../.playwright/storageState.json"
);

setup("authenticate", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    );
  }

  if (!testEmail || !testPassword) {
    throw new Error(
      "Missing test credentials: TEST_USER_EMAIL and TEST_USER_PASSWORD are required."
    );
  }

  // Sign in via Supabase REST API (no browser interaction needed)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error || !data.session) {
    throw new Error(
      `Supabase auth failed: ${error?.message ?? "No session returned"}`
    );
  }

  const { session } = data;

  // Navigate to base URL so localStorage is scoped to the correct origin
  await page.goto("/");

  // Extract the Supabase project ref from the URL (subdomain part)
  // e.g. https://abcdefgh.supabase.co → projectRef = "abcdefgh"
  const urlObj = new URL(supabaseUrl);
  const projectRef = urlObj.hostname.split(".")[0];
  const localStorageKey = `sb-${projectRef}-auth-token`;

  // Inject the session into localStorage — Supabase v2 createClient reads this key
  await page.evaluate(
    ({ key, sessionData }) => {
      localStorage.setItem(key, JSON.stringify(sessionData));
    },
    {
      key: localStorageKey,
      sessionData: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      },
    }
  );

  // Ensure the .playwright directory exists before saving state
  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Persist the browser storage state (localStorage + cookies) for reuse
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
