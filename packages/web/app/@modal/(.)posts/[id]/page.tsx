import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ModalPostDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const variant = from === "explore" ? "explore-preview" : "full";

  return <ImageDetailModal imageId={id} variant={variant} />;
}
