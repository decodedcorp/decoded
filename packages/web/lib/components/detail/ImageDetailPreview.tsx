"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { AISummarySection } from "./AISummarySection";

type ImagePreviewProps = {
  imageUrl: string;
  alt?: string;
};

function ImagePreview({ imageUrl, alt = "Post" }: ImagePreviewProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted md:max-w-sm">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 384px"
      />
    </div>
  );
}

type Props = {
  image: {
    id: string;
    image_url?: string | null;
    ai_summary?: string | null;
    items?: { length: number } | unknown[];
    postImages?: { post?: { account?: string; account_id?: string } }[];
  };
  magazineTitle?: string | null;
  artistTags?: string[];
  brands?: string[];
  styleTags?: string[];
  onViewFull: () => void;
};

/**
 * Lightweight preview for modal drawer.
 * Order: image (mobile only) → 타이틀 → summary → 전체 에디토리얼 보기 CTA
 */
export function ImageDetailPreview({
  image,
  magazineTitle,
  artistTags,
  brands,
  styleTags,
  onViewFull,
}: Props) {
  const imageUrl =
    (image as { image_url?: string }).image_url ??
    (image as { postImages?: { post?: { image_url?: string } }[] })
      ?.postImages?.[0]?.post?.image_url;

  const aiSummary = (image as { ai_summary?: string | null }).ai_summary;
  const itemCount = image.items?.length ?? 0;
  const account = (image.postImages?.[0]?.post?.account as string) || "unknown";

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      {/* Image - mobile only (desktop has floating image) */}
      <div className="block md:hidden">
        {imageUrl && (
          <ImagePreview imageUrl={imageUrl} alt={`Post by @${account}`} />
        )}
      </div>

      {/* Magazine title (타이틀) */}
      <div className="space-y-2">
        {magazineTitle && (
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
            {magazineTitle}
          </h2>
        )}
        {itemCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {itemCount}개의 아이템이 포함된 룩
          </p>
        )}
        {((artistTags?.length ?? 0) > 0 ||
          (brands?.length ?? 0) > 0 ||
          (styleTags?.length ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {artistTags?.map((a) => (
              <span
                key={a}
                className="rounded-full border border-border bg-foreground/10 px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {a}
              </span>
            ))}
            {brands?.map((b) => (
              <span
                key={b}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground/80"
              >
                {b}
              </span>
            ))}
            {styleTags?.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground"
              >
                #{s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="w-full">
          <AISummarySection summary={aiSummary} isModal />
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onViewFull}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
      >
        <Maximize2 className="h-4 w-4" />
        전체 에디토리얼 보기
      </button>
    </div>
  );
}
