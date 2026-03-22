import { test } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "desktop-lg", width: 1440, height: 900 },
];

const PAGES = [
  // Core navigation pages
  { name: "home", path: "/", waitFor: null }, // Hero carousel + trending sections
  { name: "explore", path: "/explore", waitFor: null }, // Category filtering grid
  { name: "feed", path: "/feed", waitFor: null }, // Social feed timeline
  { name: "search", path: "/search?q=dress", waitFor: null }, // Full-screen search overlay

  // Discovery & browsing
  { name: "images", path: "/images", waitFor: null }, // Image discovery grid

  // Request flow
  { name: "request", path: "/request", waitFor: null }, // Request landing page
  { name: "request-upload", path: "/request/upload", waitFor: null }, // Image upload with DropZone
  { name: "request-detect", path: "/request/detect", waitFor: null }, // AI detection results (requires mock)

  // User pages
  { name: "profile", path: "/profile", waitFor: null }, // User profile with activity/badges
  { name: "login", path: "/login", waitFor: null }, // OAuth authentication
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const page of PAGES) {
      test(`${page.name}`, async ({ page: p }) => {
        await p.goto(page.path);
        await p.waitForLoadState("networkidle");
        // Wait for animations to settle
        await p.waitForTimeout(500);
        await p.screenshot({
          path: `../../docs/qa-screenshots/${viewport.name}-${page.name}.png`,
          fullPage: true,
        });
      });
    }
  });
}
