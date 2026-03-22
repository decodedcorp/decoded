/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared package from monorepo
  transpilePackages: ["@decoded/shared"],
  images: {
    // 외부 URL이 무한정인 경우 도메인 화이트리스트 관리 불가 → 전역 unoptimized
    // 어떤 URL이든 next/image 사용 가능. 대신 리사이즈/WebP 최적화는 비활성화.
    unoptimized: true,
  },
};

module.exports = nextConfig;
