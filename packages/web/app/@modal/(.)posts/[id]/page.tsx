import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";
import { prefetchPostDetail } from "@/lib/api/server-prefetch";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModalPostDetailPage({ params }: Props) {
  const { id } = await params;

  const prefetchedDetail = await prefetchPostDetail(id);

  return (
    <ImageDetailModal
      imageId={id}
      variant="explore-preview"
      serverData={prefetchedDetail}
    />
  );
}
