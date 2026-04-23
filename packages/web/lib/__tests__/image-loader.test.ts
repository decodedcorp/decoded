import { describe, it, expect } from "vitest";
import imageLoader from "../image-loader";

/**
 * Regression coverage for #253 — Vercel image optimizer rejected double-wrapped
 * URLs (`/_next/image?url=/api/v1/image-proxy?url=...`) with
 * `x-vercel-error: INVALID_IMAGE_OPTIMIZE_REQUEST` (HTTP 400).
 *
 * Contract:
 * - Hosts listed in `images.remotePatterns` (R2 public bucket) → direct
 *   `/_next/image` optimization, no proxy.
 * - Other external hosts → bare `/api/v1/image-proxy` (no `/_next/image`
 *   wrapping). Loses Next optimization but avoids the 400.
 * - Local/relative src → `/_next/image`.
 */

const R2_HOST = "pub-6354054b117b46b9a0fe99e4a546e681.r2.dev";

describe("image-loader", () => {
  it("routes R2 URLs directly through /_next/image (optimized)", () => {
    const url = `https://${R2_HOST}/items/abc/1.jpg`;
    const out = imageLoader({ src: url, width: 384, quality: 75 });
    expect(out).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=384&q=75`);
    expect(out).not.toContain("image-proxy");
  });

  it("handles blur-placeholder width/quality for R2 URLs", () => {
    const url = `https://${R2_HOST}/items/abc/2.jpg`;
    const out = imageLoader({ src: url, width: 32, quality: 1 });
    expect(out).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=32&q=1`);
  });

  it("routes non-allowlisted external URLs through bare image-proxy (no /_next/image wrap)", () => {
    const url = "https://i.pinimg.com/originals/ab/cd/ef/ghi.jpg";
    const out = imageLoader({ src: url, width: 384, quality: 75 });
    expect(out).toBe(`/api/v1/image-proxy?url=${encodeURIComponent(url)}`);
    expect(out).not.toContain("_next/image");
  });

  it("defaults quality to 75 when undefined", () => {
    const url = `https://${R2_HOST}/items/abc/3.jpg`;
    const out = imageLoader({ src: url, width: 128, quality: undefined });
    expect(out).toContain("q=75");
  });

  it("routes local/relative paths through /_next/image", () => {
    const out = imageLoader({ src: "/logo.png", width: 256, quality: 90 });
    expect(out).toBe(
      `/_next/image?url=${encodeURIComponent("/logo.png")}&w=256&q=90`
    );
  });

  it("does not double-wrap R2 URL with nested ?url= query (#253 regression)", () => {
    const url = `https://${R2_HOST}/items/abc/4.jpg`;
    const out = imageLoader({ src: url, width: 32, quality: 1 });
    expect(out).not.toMatch(/url=.*image-proxy.*%3Furl%3D/);
  });

  it("falls back to proxy when URL parse fails (malformed host)", () => {
    // No throw; degrades to proxy path.
    const out = imageLoader({
      src: "https://not a valid host/x.jpg",
      width: 128,
      quality: 75,
    });
    expect(out).toContain("/api/v1/image-proxy");
  });
});
