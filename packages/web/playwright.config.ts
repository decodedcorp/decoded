import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",

  // Visual QA optimizations
  timeout: 30 * 1000, // 30 seconds per test (pages may have animations)
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Screenshot optimizations
    screenshot: "only-on-failure",
    video: "off", // Disable video for screenshot-only tests
  },

  outputDir: "test-results/",

  projects: [
    // Auth setup — runs first, saves storageState for authenticated tests
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Authenticated tests — depend on setup project to have storageState ready
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright/storageState.json",
      },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /login\.spec\.ts/],
    },

    // Unauthenticated tests — login flow, no storageState dependency
    {
      name: "chromium-no-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /login\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120000, // 2 minute timeout for server startup
  },
});
