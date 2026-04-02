"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Maximize2 } from "lucide-react";
import { usePostDetailForImage, usePostMagazine } from "@/lib/hooks/useImages";
import { ImageDetailPreview } from "./ImageDetailPreview";
import { ImageDetailContent } from "./ImageDetailContent";
import { SpotDot } from "./SpotDot";
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

  // Floating image sizing state (for spot positioning with object-contain)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // Image source: store (immediate) -> fetched data
  const activeImageSrc =
    imgSrc ||
    (image as { image_url?: string })?.image_url ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (image as any)?.postImages?.[0]?.post?.image_url;

  const { handleClose, handleTouchStart, handleTouchMove, handleTouchEnd, handleMaximize, isClosing } =
    useImageModalAnimation({
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
  }, [imageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug logging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (imageId) console.log("[ImageDetailModal] imageId:", imageId);
      if (image) console.log("[ImageDetailModal] image loaded:", image);
    }
    if (error) console.error("[ImageDetailModal] error:", error);
  }, [imageId, image, error]);

  // Track floating image container size for spot positioning
  useEffect(() => {
    if (!leftImageContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    resizeObserver.observe(leftImageContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeImageSrc]);

  // Forward scroll from floating image to drawer content (desktop)
  const handleImageScroll = useCallback((e: React.WheelEvent) => {
    scrollContainerRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  }, []);

  // Calculate actual displayed image rect for object-contain
  const getContainedImageRect = () => {
    if (!naturalSize || !containerSize) return null;
    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;
    let width, height, left, top;
    if (imageAspect > containerAspect) {
      width = containerSize.width;
      height = width / imageAspect;
      left = 0;
      top = (containerSize.height - height) / 2;
    } else {
      height = containerSize.height;
      width = height * imageAspect;
      top = 0;
      left = (containerSize.width - width) / 2;
    }
    return { width, height, left, top };
  };

  // Render drawer content based on data state
  const renderContent = () => {
    if (!imageId) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-4 text-lg text-destructive">Image ID is missing</p>
            <button onClick={() => handleClose()} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">Close</button>
          </div>
        </div>
      );
    }
    if (isLoading) {
      return <div className="flex h-full items-center justify-center"><div className="text-muted-foreground">Loading image data...</div></div>;
    }
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-2 text-lg text-destructive">Failed to load post</p>
            <p className="mb-4 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Unknown error occurred"}</p>
            <p className="mb-4 text-xs text-muted-foreground">Post ID: {imageId}</p>
            <button onClick={() => handleClose()} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">Close</button>
          </div>
        </div>
      );
    }
    if (!image) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center px-6">
            <p className="mb-4 text-lg text-destructive">Image not found</p>
            <p className="mb-4 text-xs text-muted-foreground">Image ID: {imageId}</p>
            <button onClick={() => handleClose()} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">Close</button>
          </div>
        </div>
      );
    }

    const publishedMagazineLayout =
      magazineId && magazine?.layout_json && magazine.status === "published" ? magazine.layout_json : null;

    // Magazine posts: use same ImageDetailContent as full page (with isModal to skip GSAP)
    if (publishedMagazineLayout) {
      return (
        <ImageDetailContent
          image={image}
          magazineLayout={publishedMagazineLayout}
          relatedEditorials={magazine?.related_editorials ?? []}
          isModal
          scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement>}
        />
      );
    }

    // Non-magazine posts: lightweight preview
    return (
      <ImageDetailPreview
        image={image}
        onViewFull={handleMaximize}
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
          <div
            className="absolute inset-0 -z-10"
            style={{ backgroundImage: `url(${activeImageSrc})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(24px)", transform: "scale(1.08)" }}
          />
          <img
            data-testid="image-detail-image"
            ref={floatingImageRef}
            src={activeImageSrc}
            alt="Post image"
            className="w-full h-full object-contain pointer-events-none"
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
          />
          {image?.items && image.items.length > 0 && (() => {
            const imageRect = getContainedImageRect();
            if (!imageRect) return null;
            const accentColor = (magazine?.layout_json as { design_spec?: { accent_color?: string } })?.design_spec?.accent_color;
            return (
              <div className="absolute inset-0 pointer-events-none z-20">
                {image.items.map((item, idx) => {
                  const center = Array.isArray(item.center) ? item.center : null;
                  if (!center || center.length < 2) return null;
                  const fracX = typeof center[0] === "number" ? center[0] : parseFloat(String(center[0])) || 0;
                  const fracY = typeof center[1] === "number" ? center[1] : parseFloat(String(center[1])) || 0;
                  const pixelLeft = imageRect.left + imageRect.width * (fracX > 1 ? fracX / 100 : fracX);
                  const pixelTop = imageRect.top + imageRect.height * (fracY > 1 ? fracY / 100 : fracY);
                  const meta = item.metadata as unknown as Record<string, unknown> | undefined;
                  return (
                    <SpotDot
                      key={item.id ?? idx}
                      mode="pixel"
                      leftPx={pixelLeft}
                      topPx={pixelTop}
                      label={item.product_name ?? ""}
                      brand={meta?.brand as string | undefined}
                      category={meta?.sub_category as string | undefined}
                      accentColor={accentColor}
                      thumbnailUrl={item.cropped_image_path}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className="relative z-[70] flex h-full w-full flex-col bg-background shadow-2xl md:w-[50vw] lg:w-[600px] xl:w-[700px] translate-y-full md:translate-x-full md:translate-y-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-lenis-prevent
      >
        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {renderContent()}
        </div>
        <div className="absolute top-4 right-4 md:top-auto md:right-auto md:bottom-6 md:left-6 z-20 flex gap-3">
          <ReportErrorButton postId={image?.id} size="md" />
          <button
            onClick={handleMaximize}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white backdrop-blur-sm transition-transform hover:scale-105 hover:bg-black active:scale-95 dark:bg-white/80 dark:text-black dark:hover:bg-white"
            aria-label="View Full Page"
            title="Open in full page"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <button
            data-testid="image-detail-close"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-transform hover:scale-105 hover:bg-accent active:scale-95"
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
