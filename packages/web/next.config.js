const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared package from monorepo
  transpilePackages: ["@decoded/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 1080, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry org and project for source map uploads
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress noisy build logs unless in CI
  silent: !process.env.CI,

  // Automatically hide source maps from client bundles
  hideSourceMaps: true,
});
