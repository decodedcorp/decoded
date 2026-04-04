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
  const { id } = await params;

  // Fetch artist/group + brand profile data in parallel
  const [artistProfileMap, brandProfileMap] = await Promise.all([
    buildArtistProfileMap(),
    buildBrandProfileMap(),
  ]);

  const artistProfiles: Record<string, { name: string; profileImageUrl: string | null }> = {};
  artistProfileMap.forEach((value, key) => {
    artistProfiles[key] = value;
  });

  const brandProfiles: Record<string, { name: string; profileImageUrl: string | null }> = {};
  brandProfileMap.forEach((value, key) => {
    brandProfiles[key] = value;
  });

  return <ImageDetailPage imageId={id} artistProfiles={artistProfiles} brandProfiles={brandProfiles} />;
}
