import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";

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
  return <ImageDetailModal imageId={id} variant={variant} />;
}
