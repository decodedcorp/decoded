const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared package from monorepo
  transpilePackages: ["@decoded/shared"],
  images: {
    localPatterns: [{ pathname: "/**" }],
    // Direct-optimization allowlist — must stay in sync with
    // `lib/image-loader.ts` ALLOWED_OPTIMIZER_HOSTS (see #253).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-6354054b117b46b9a0fe99e4a546e681.r2.dev",
        pathname: "/**",
      },
    ],
    loaderFile: "./lib/image-loader.ts",
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
