"use client";

import { usePostDetailForImage, usePostMagazine } from "@/lib/hooks/useImages";
import { ImageDetailContent } from "./ImageDetailContent";
import { useEffect, useRef, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/lib/components/shared";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import type { ImageDetailWithPostOwner } from "@/lib/api/adapters/postDetailToImageDetail";
import type { ImageDetail } from "@/lib/supabase/queries/images";

const LenisProvider = lazy(() =>
  import("./LenisProvider").then((m) => ({ default: m.LenisProvider }))
);

type Props = {
  imageId: string;
  serverData?: ImageDetail | null;
};

/**
 * Full page version of image detail.
 * Accepts optional serverData prefetched by the RSC to eliminate client waterfall.
 */
export function ImageDetailPage({ imageId, serverData }: Props) {
  const router = useRouter();
  const {
    data: image,
    isLoading,
    error,
  } = usePostDetailForImage(imageId, serverData ?? undefined);
  const magazineId = (image as ImageDetailWithPostOwner)?.post_magazine_id;
  const { data: magazine, isLoading: magazineLoading } =
    usePostMagazine(magazineId);
  const pageRef = useRef<HTMLDivElement>(null);
  const track = useTrackEvent();

  useEffect(() => {
    if (!imageId) return;
    track({ event_type: "post_view", entity_id: imageId });
  }, [imageId]);

  useEffect(() => {
    if (!pageRef.current) return;
    pageRef.current.style.opacity = "0";
    requestAnimationFrame(() => {
      if (pageRef.current) {
        pageRef.current.style.transition = "opacity 0.4s ease-out";
        pageRef.current.style.opacity = "1";
      }
    });
  }, []);

  const handleBack = () => {
    router.back();
  };

  const showMagazine =
    !!magazineId && !!magazine?.layout_json && magazine.status === "published";

  if (isLoading || (magazineId && magazineLoading)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
      >
        <div className="space-y-4 w-full max-w-2xl px-4">
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorState
          message="Failed to load post"
          details={error instanceof Error ? error.message : undefined}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <Suspense fallback={<div ref={pageRef} className="relative mt-4 md:mt-6" />}>
      <LenisProvider>
        <div ref={pageRef} className="relative mt-4 md:mt-6">
          <div className="fixed left-4 top-16 md:top-20 z-50">
            <button
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform transition-colors hover:scale-105 hover:bg-background/90"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <ImageDetailContent
            image={image}
            magazineLayout={showMagazine ? magazine!.layout_json : null}
            relatedEditorials={magazine?.related_editorials ?? []}
            commentCount={
              (image as ImageDetailWithPostOwner & { comment_count?: number })
                .comment_count
            }
          />
        </div>
      </LenisProvider>
    </Suspense>
  );
}
