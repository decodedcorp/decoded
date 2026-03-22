import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Intercepting route for /posts/[id]
 * Renders as modal overlay when navigating from grid (e.g. /images)
 */
export default async function ModalPostDetailPage({ params }: Props) {
  const { id } = await params;
  return <ImageDetailModal imageId={id} />;
}
