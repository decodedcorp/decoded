import { ImageDetailPage } from "@/lib/components/detail/ImageDetailPage";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Full page route for /posts/[id]
 * Uses ImageDetailPage (image-centric UI)
 */
export default async function PostDetailPageRoute({ params }: Props) {
  const { id } = await params;

  // Fetch artist/group profile data for display
  const profileMap = await buildArtistProfileMap();
  const artistProfiles: Record<string, { name: string; profileImageUrl: string | null }> = {};
  profileMap.forEach((value, key) => {
    artistProfiles[key] = value;
  });

  return <ImageDetailPage imageId={id} artistProfiles={artistProfiles} />;
}
