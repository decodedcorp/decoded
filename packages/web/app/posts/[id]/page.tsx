import { ImageDetailPage } from "@/lib/components/detail/ImageDetailPage";
import { buildArtistProfileMap, buildBrandProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";

type Props = {
  params: Promise<{ id: string }>;
};

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

  // TODO: filter to only relevant entries for this post to reduce RSC payload
  const artistProfiles = Object.fromEntries(artistProfileMap);
  const brandProfiles = Object.fromEntries(brandProfileMap);

  return <ImageDetailPage imageId={id} artistProfiles={artistProfiles} brandProfiles={brandProfiles} />;
}
