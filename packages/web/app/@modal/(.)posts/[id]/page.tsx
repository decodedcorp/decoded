import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";
import {
  buildArtistProfileMap,
  buildBrandProfileMap,
} from "@/lib/supabase/queries/warehouse-entities.server";

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
  const [{ id }, { from }, artistProfileMap, brandProfileMap] =
    await Promise.all([
      params,
      searchParams,
      buildArtistProfileMap(),
      buildBrandProfileMap(),
    ]);
  const variant = from === "explore" ? "explore-preview" : "full";

  // TODO: filter to only relevant entries for this post to reduce RSC payload
  const artistProfiles = Object.fromEntries(artistProfileMap);
  const brandProfiles = Object.fromEntries(brandProfileMap);

  return (
    <ImageDetailModal
      imageId={id}
      variant={variant}
      artistProfiles={artistProfiles}
      brandProfiles={brandProfiles}
    />
  );
}
