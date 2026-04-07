import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/posts/", "/explore", "/search"],
        disallow: [
          "/api/",
          "/admin/",
          "/lab/",
          "/login",
          "/profile",
          "/request/",
          "/debug/",
          "/feed",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
