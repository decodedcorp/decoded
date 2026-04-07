import type { Metadata } from "next";
import { ImageDetailPage } from "@/lib/components/detail/ImageDetailPage";
import {
  buildArtistProfileMap,
  buildBrandProfileMap,
} from "@/lib/supabase/queries/warehouse-entities.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JsonLdArticle } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, context, artist_name, group_name, image_url, created_at, ai_summary"
    )
    .eq("id", id)
    .single();

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
          width: 1200,
          height: 630,
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
 * Full page route for /posts/[id]
 * Uses ImageDetailPage (image-centric UI)
 */
export default async function PostDetailPageRoute({ params }: Props) {
  const [{ id }, artistProfileMap, brandProfileMap] = await Promise.all([
    params,
    buildArtistProfileMap(),
    buildBrandProfileMap(),
  ]);

  // Fetch post data for JSON-LD (lightweight query)
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, context, artist_name, group_name, image_url, created_at, ai_summary"
    )
    .eq("id", id)
    .single();

  // TODO: filter to only relevant entries for this post to reduce RSC payload
  const artistProfiles = Object.fromEntries(artistProfileMap);
  const brandProfiles = Object.fromEntries(brandProfileMap);

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
      <ImageDetailPage
        imageId={id}
        artistProfiles={artistProfiles}
        brandProfiles={brandProfiles}
      />
    </>
  );
}
