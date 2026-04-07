import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServerClient();

  // Fetch all active posts with image_url
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .eq("status", "active")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  const postEntries: MetadataRoute.Sitemap = (posts ?? []).map(
    (post: { id: string; updated_at: string }) => ({
      url: `${SITE_URL}/posts/${post.id}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  return [...staticPages, ...postEntries];
}
