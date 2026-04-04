"use client";

import { usePostDetailForImage, usePostMagazine } from "@/lib/hooks/useImages";
import { ImageDetailContent } from "./ImageDetailContent";
import { LenisProvider } from "./LenisProvider";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Lightbox } from "./Lightbox";
import { ErrorState } from "@/lib/components/shared";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import type { ImageDetailWithPostOwner } from "@/lib/api/adapters/postDetailToImageDetail";

type Props = {
  imageId: string;
  artistProfiles?: Record<string, { name: string; profileImageUrl: string | null }>;
  brandProfiles?: Record<string, { name: string; profileImageUrl: string | null }>;
};

/**
 * Full page version of image detail
 * Used when directly accessing URL or refreshing page
 * Now renders post data instead of old image data
 */
export function ImageDetailPage({ imageId, artistProfiles, brandProfiles }: Props) {
  const router = useRouter();
  const { data: image, isLoading, error } = usePostDetailForImage(imageId);
  const magazineId = (image as ImageDetailWithPostOwner)?.post_magazine_id;
  const { data: magazine, isLoading: magazineLoading } =
    usePostMagazine(magazineId);
  const pageRef = useRef<HTMLDivElement>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const track = useTrackEvent();

  // Track post_view on page mount (once per post)
  useEffect(() => {
    if (!imageId) return;
    track({ event_type: "post_view", entity_id: imageId });
  }, [imageId]);

  // Fade-in animation for direct access
  useEffect(() => {
    if (!pageRef.current) return;

    gsap.fromTo(
      pageRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      }
    );
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
    <LenisProvider>
      <div ref={pageRef} className="relative">
        {/* Back Button */}
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
          artistProfiles={artistProfiles}
          brandProfiles={brandProfiles}
        />

        {/* Lightbox */}
        <Lightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          imageUrl={(image as { image_url?: string }).image_url || ""}
          alt={`Post ${image.id}`}
        />
      </div>
    </LenisProvider>
  );
}
