import { cache } from "react";
import type { Metadata } from "next";
import { ImageDetailPage } from "@/lib/components/detail/ImageDetailPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JsonLdArticle } from "@/lib/seo/json-ld";
import { prefetchPostDetail } from "@/lib/api/server-prefetch";

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

export default async function PostDetailPageRoute({ params }: Props) {
  const { id } = await params;

  const [post, prefetchedDetail] = await Promise.all([
    getCachedPost(id),
    prefetchPostDetail(id),
  ]);

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
      <ImageDetailPage imageId={id} serverData={prefetchedDetail} />
    </>
  );
}
