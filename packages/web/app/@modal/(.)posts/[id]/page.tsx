import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const [{ id }, { from }, artistProfileMap] = await Promise.all([
    params,
    searchParams,
    buildArtistProfileMap(),
  ]);
  const variant = from === "explore" ? "explore-preview" : "full";

  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("artist_name, group_name")
    .eq("id", id)
    .single();

  const artistProfiles: Record<
    string,
    { name: string; profileImageUrl: string | null }
  > = {};
  for (const raw of [post?.artist_name, post?.group_name]) {
    if (!raw) continue;
    const key = raw.toLowerCase();
    const entry = artistProfileMap.get(key);
    if (entry) artistProfiles[key] = entry;
  }

  return (
    <ImageDetailModal
      imageId={id}
      variant={variant}
      artistProfiles={artistProfiles}
    />
  );
}
