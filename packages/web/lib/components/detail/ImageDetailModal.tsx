"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Maximize2 } from "lucide-react";
import { usePostDetailForImage, usePostMagazine } from "@/lib/hooks/useImages";
import { ImageDetailContent } from "./ImageDetailContent";
import { ImageCanvas } from "./ImageCanvas";
import { normalizeItem } from "./types";
import type { UiItem } from "./types";
import type { Json } from "@/lib/supabase/types";
import { useTransitionStore } from "@/lib/stores/transitionStore";
import { ReportErrorButton } from "./ReportErrorButton";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import type { ImageDetailWithPostOwner } from "@/lib/api/adapters/postDetailToImageDetail";
import { useImageModalAnimation } from "@/lib/hooks/useImageModalAnimation";

type Props = {
  imageId: string;
};

/**
 * Side Drawer version of image detail page
 * Used when navigating from grid (intercepting route)
 */
export function ImageDetailModal({ imageId }: Props) {
  const router = useRouter();
  const { data: image, isLoading, error } = usePostDetailForImage(imageId);
  const magazineId = (image as ImageDetailWithPostOwner)?.post_magazine_id;
  const { data: magazine } = usePostMagazine(magazineId);
  const { originRect, reset, imgSrc } = useTransitionStore();
  const track = useTrackEvent();

  // Refs for animation targets
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const floatingImageRef = useRef<HTMLImageElement>(null);
  const leftImageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Floating image sizing state (for fallback img path)
  const [_naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Active item index for scroll-spot sync
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Image source: store (immediate) -> fetched data
  const activeImageSrc =
    imgSrc ||
    (image as { image_url?: string })?.image_url ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (image as any)?.postImages?.[0]?.post?.image_url;

  // Normalize items for ImageCanvas (same logic as ImageDetailContent)
  const normalizedItems: UiItem[] = useMemo(() => {
    if (!image?.items) return [];
    const firstPostImage = image.postImages?.[0];
    const itemLocations = firstPostImage?.item_locations;
    const locMap: Record<
      string,
      { bbox?: number[] | null; center?: Json | null; score?: number | null }
    > = {};
    if (Array.isArray(itemLocations)) {
      itemLocations.forEach((loc: Record<string, unknown>) => {
        if (loc?.item_id) {
          locMap[String(loc.item_id)] = {
            bbox: loc.bbox as number[] | null,
            center: (loc.center as Json | null) || (loc as unknown as Json),
            score: loc.score as number | null,
          };
        }
      });
    } else if (itemLocations && typeof itemLocations === "object") {
      Object.assign(locMap, itemLocations);
    }
    return image.items.map((item) =>
      normalizeItem(item, undefined, locMap[item.id.toString()])
    );
  }, [image?.items, image?.postImages]);

  const hasItemsWithCoordinates = normalizedItems.some(
    (item) => item.normalizedBox !== null
  );

  const {
    handleClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMaximize,
  } = useImageModalAnimation({
    imageId,
    activeImageSrc,
    originRect,
    reset,
    backdropRef,
    drawerRef,
    leftImageContainerRef,
    containerRef,
    scrollContainerRef,
    router,
  });

  // Track post_view on modal open (once per post)
  useEffect(() => {
    if (!imageId) return;
    track({ event_type: "post_view", entity_id: imageId });
  }, [imageId]);

  // Debug logging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (imageId) console.log("[ImageDetailModal] imageId:", imageId);
      if (image) console.log("[ImageDetailModal] image loaded:", image);
    }
    if (error) console.error("[ImageDetailModal] error:", error);
  }, [imageId, image, error]);

  // Forward scroll from floating image to drawer content (desktop)
  const handleImageScroll = useCallback((e: React.WheelEvent) => {
    scrollContainerRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  }, []);

  // Render drawer content based on data state
  const renderContent = () => {
    if (!imageId) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-4 text-lg text-destructive">Image ID is missing</p>
            <button
              onClick={() => handleClose()}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading image data...</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-2 text-lg text-destructive">Failed to load post</p>
            <p className="mb-4 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Post ID: {imageId}
            </p>
            <button
              onClick={() => handleClose()}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    if (!image) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-4 text-lg text-destructive">Image not found</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Image ID: {imageId}
            </p>
            <button
              onClick={() => handleClose()}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    const publishedMagazineLayout =
      magazineId && magazine?.layout_json && magazine.status === "published"
        ? magazine.layout_json
        : null;

    // Magazine posts: use same ImageDetailContent as full page (with isModal to skip GSAP)
    if (publishedMagazineLayout) {
      return (
        <ImageDetailContent
          image={image}
          magazineLayout={publishedMagazineLayout}
          relatedEditorials={magazine?.related_editorials ?? []}
          isModal
          scrollContainerRef={
            scrollContainerRef as React.RefObject<HTMLElement>
          }
        />
      );
    }

    // Non-magazine posts
    return (
      <ImageDetailContent
        image={image}
        magazineLayout={null}
        relatedEditorials={[]}
        isModal
        hideImage
        scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement>}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      data-testid="image-detail-modal"
      className="fixed inset-0 z-[10000] flex items-end md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      style={{ perspective: "1200px" }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40"
        aria-hidden="true"
      />

      {/* Floating Image / Left Side Image (desktop only) */}
      {activeImageSrc && (
        <div
          ref={leftImageContainerRef}
          className="hidden md:block fixed z-60 shadow-2xl rounded-lg overflow-hidden"
          style={{ opacity: 0 }}
          onWheel={handleImageScroll}
        >
          {/* Blur backdrop */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `url(${activeImageSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(24px)",
              transform: "scale(1.08)",
            }}
          />
          {/* ImageCanvas with contain mode for scroll-spot sync */}
          {image && hasItemsWithCoordinates ? (
            <ImageCanvas
              image={image}
              items={normalizedItems}
              activeIndex={activeIndex}
              objectFit="contain"
            />
          ) : (
            <img
              data-testid="image-detail-image"
              ref={floatingImageRef}
              src={activeImageSrc}
              alt="Post image"
              className="w-full h-full object-contain pointer-events-none"
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }}
            />
          )}
        </div>
      )}

      {/* Drawer (mobile: bottom sheet ~90vh, desktop: right-side drawer full height) */}
      <aside
        ref={drawerRef}
        className="relative z-[70] flex h-[90vh] md:h-full w-full flex-col bg-background shadow-2xl rounded-t-[20px] md:rounded-none md:w-[50vw] lg:w-[600px] xl:w-[700px] translate-y-full md:translate-x-full md:translate-y-0 overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-lenis-prevent
      >
        {/* Drag handle - mobile only */}
        <div className="md:hidden flex items-center justify-center py-3 shrink-0">
          <div className="w-10 h-1 bg-[#3D3D3D] rounded-sm" />
        </div>
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          {renderContent()}
        </div>
        <div className="absolute top-4 right-4 md:top-auto md:right-auto md:bottom-6 md:left-6 z-20 flex gap-3">
          <ReportErrorButton postId={image?.id} size="md" />
          <button
            onClick={handleMaximize}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white backdrop-blur-sm transition-transform hover:scale-105 hover:bg-black active:scale-95 dark:bg-white/80 dark:text-black dark:hover:bg-white"
            aria-label="View Full Page"
            title="Open in full page"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <button
            data-testid="image-detail-close"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-transform hover:scale-105 hover:bg-accent active:scale-95"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </aside>
    </div>
  );
}
