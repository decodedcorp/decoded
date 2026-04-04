import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";
import { buildArtistProfileMap, buildBrandProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

/**
 * Intercepting route for /posts/[id]
 * Renders as modal overlay when navigating from grid
 * Uses explore-preview variant when navigated from /explore
 */
export default async function ModalPostDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const variant = from === "explore" ? "explore-preview" : "full";

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

  return <ImageDetailModal imageId={id} variant={variant} artistProfiles={artistProfiles} brandProfiles={brandProfiles} />;
}
