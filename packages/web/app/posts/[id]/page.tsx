import { cache } from "react";
import type { Metadata } from "next";
import { ImageDetailPage } from "@/lib/components/detail/ImageDetailPage";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JsonLdArticle } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

const POST_SELECT =
  "id, title, context, artist_name, group_name, image_url, image_width, image_height, created_at, ai_summary" as const;

const getCachedPost = cache(async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .single();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getCachedPost(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const artistLabel = post.artist_name || post.group_name || "Unknown";
  const title = post.title || post.context || `${artistLabel}'s Style`;
  const description =
    post.ai_summary ||
    post.context ||
    `Discover ${artistLabel}'s style — AI-powered item detection on Decoded.`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artistLabel)}&image=${encodeURIComponent(post.image_url || "")}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/posts/${post.id}`,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/posts/${post.id}`,
      images: [
        {
          url: ogImageUrl,
          width: post.image_width || 1200,
          height: post.image_height || 630,
          alt: title,
        },
      ],
      publishedTime: post.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Filter profile maps to only entries relevant to this post.
 * Reduces RSC payload from ~1,500 entries to 1-2 entries.
 */
function filterArtistProfiles(
  map: Map<string, { name: string; profileImageUrl: string | null }>,
  artistName: string | null | undefined,
  groupName: string | null | undefined
): Record<string, { name: string; profileImageUrl: string | null }> {
  const result: Record<
    string,
    { name: string; profileImageUrl: string | null }
  > = {};
  for (const raw of [artistName, groupName]) {
    if (!raw) continue;
    const key = raw.toLowerCase();
    const entry = map.get(key);
    if (entry) result[key] = entry;
  }
  return result;
}

/**
 * Full page route for /posts/[id]
 * Uses ImageDetailPage (image-centric UI)
 */
export default async function PostDetailPageRoute({ params }: Props) {
  const { id } = await params;

  const [post, artistProfileMap] = await Promise.all([
    getCachedPost(id),
    buildArtistProfileMap(),
  ]);

  const artistProfiles = filterArtistProfiles(
    artistProfileMap,
    post?.artist_name,
    post?.group_name
  );

  const artistLabel = post?.artist_name || post?.group_name || "Unknown";
  const title = post?.title || post?.context || `${artistLabel}'s Style`;
  const description =
    post?.ai_summary ||
    post?.context ||
    `Discover ${artistLabel}'s style on Decoded.`;

  return (
    <>
      {post && (
        <JsonLdArticle
          title={title}
          description={description}
          imageUrl={post.image_url}
          publishedTime={post.created_at}
          url={`${SITE_URL}/posts/${post.id}`}
          artistName={artistLabel}
        />
      )}
      <ImageDetailPage imageId={id} artistProfiles={artistProfiles} />
    </>
  );
}
