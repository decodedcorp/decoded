"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Maximize2 } from "lucide-react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { usePostDetailForImage, usePostMagazine } from "@/lib/hooks/useImages";
import { ImageDetailPreview } from "./ImageDetailPreview";
import { SpotDot } from "./SpotDot";
import { useTransitionStore } from "@/lib/stores/transitionStore";
import { ReportErrorButton } from "./ReportErrorButton";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import type { ImageDetailWithPostOwner } from "@/lib/api/adapters/postDetailToImageDetail";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

type Props = {
  imageId: string;
};

/**
 * Side Drawer version of image detail page
 * Used when navigating from grid (intercepting route)
 * Now renders post data instead of old image data
 */
export function ImageDetailModal({ imageId }: Props) {
  const router = useRouter();
  const { data: image, isLoading, error } = usePostDetailForImage(imageId);
  const magazineId = (image as ImageDetailWithPostOwner)?.post_magazine_id;
  const { data: magazine } = usePostMagazine(magazineId);
  const { originRect, reset, imgSrc } = useTransitionStore();
  const track = useTrackEvent();

  // Track post_view on modal open (once per post)
  useEffect(() => {
    if (!imageId) return;
    track({ event_type: "post_view", entity_id: imageId });
  }, [imageId]);

  // Debug: Log imageId and data state (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (imageId) {
        console.log("[ImageDetailModal] imageId:", imageId);
      }
      if (image) {
        console.log("[ImageDetailModal] image loaded:", image);
      }
    }
    if (error) {
      console.error("[ImageDetailModal] error:", error);
    }
  }, [imageId, image, error]);

  // Scroll Forwarding: Image -> Content
  // This enables scrolling the drawer content by scrolling over the fixed image
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop || !floatingImageRef.current || !scrollContainerRef.current)
      return;

    // Use a wrapper or the floating image ref itself if it's the ImageCanvas container
    // Since we're rendering ImageCanvas in the "floating" area, we need to target its container
    // However, floatingImageRef currently points to an <img> tag.
    // We'll update the render logic to use a container for the Left Side Image.
  }, []);

  const handleImageScroll = useCallback((e: React.WheelEvent) => {
    const target = scrollContainerRef.current;
    if (target) {
      target.scrollBy({
        top: e.deltaY,
        behavior: "auto",
      });
    }
  }, []);

  // Refs for animation targets
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const floatingImageRef = useRef<HTMLImageElement>(null);
  const leftImageContainerRef = useRef<HTMLDivElement>(null); // New container for interactive image

  // Ref for scroll container to checking scroll position for swipe gesture
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State to track if we are currently closing to prevent multiple triggers
  const [isClosing, setIsClosing] = useState(false);

  // Floating image sizing state (for spot positioning with object-contain)
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Swipe gesture state
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);

  // GSAP Context for cleanup
  const ctxRef = useRef<gsap.Context>(null);

  // Image Source Resolution: Priority -> Store (Immediate) -> Fetched Data
  const activeImageSrc =
    imgSrc ||
    (image as { image_url?: string })?.image_url ||
    (image as unknown as { postImages?: { post?: { image_url?: string } }[] })
      ?.postImages?.[0]?.post?.image_url;

  const handleClose = useCallback(() => {
    if (isClosing || !ctxRef.current) return;
    setIsClosing(true);

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    ctxRef.current.add(() => {
      // Exit Animation
      const tl = gsap.timeline({
        onComplete: () => {
          // Small delay to ensure floating image is completely hidden
          // before resetting state and showing grid image
          setTimeout(() => {
            reset();
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }, 50); // 50ms delay to ensure smooth transition
        },
      });

      // Ensure floating image is visible for exit animation (desktop only)
      // On mobile, floating image is not rendered, so skip this
      if (isDesktop && leftImageContainerRef.current) {
        tl.set(leftImageContainerRef.current, { opacity: 1 }, 0);
      }

      // 1. Fade out UI
      tl.to(
        [backdropRef.current, drawerRef.current],
        {
          opacity: 0,
          duration: 0.3,
          ease: "power3.in",
        },
        0
      );

      // 2. Fly image back to grid (if we have origin info)
      // Only animate floating image on desktop (it's hidden on mobile)
      if (isDesktop && originRect && leftImageContainerRef.current) {
        // FLIP animation back to grid
        tl.to(
          leftImageContainerRef.current,
          {
            top: originRect.top,
            left: originRect.left,
            width: originRect.width,
            height: originRect.height,
            borderRadius: "0.75rem", // Match grid card radius
            boxShadow: "none", // Remove shadow
            scale: 1, // Reset scale
            duration: 0.5,
            ease: "power3.inOut",
          },
          0
        )
          // Scale pulse for return trip
          .to(
            leftImageContainerRef.current,
            {
              scale: 0.98,
              duration: 0.25,
              ease: "sine.inOut",
              yoyo: true,
              repeat: 1,
            },
            0
          )
          // After image reaches grid position, fade it out
          .to(
            leftImageContainerRef.current,
            {
              opacity: 0,
              duration: 0.1,
              ease: "power2.in",
              yoyo: true,
              repeat: 1,
            },
            "-=0.05" // Start fading slightly before position animation completes
          );
      } else if (isDesktop && leftImageContainerRef.current) {
        // Fallback: fade out floating image (desktop only)
        tl.to(
          leftImageContainerRef.current,
          {
            opacity: 0,
            duration: 0.3,
          },
          0
        );
      }
    });
  }, [isClosing, router, originRect, reset]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    // Only allow swipe if we are at the top of the scroll container
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop > 0
    ) {
      touchStartY.current = -1; // Invalid start
      return;
    }

    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;

    // Only allow dragging down
    if (diff > 0 && drawerRef.current) {
      // Provide visual feedback - transform the drawer down
      // Use GSAP set for performance
      gsap.set(drawerRef.current, { y: diff });
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === -1) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) return;

    const diff = touchCurrentY.current - touchStartY.current;

    if (diff > 100) {
      // Threshold passed, close
      handleClose();
    } else if (diff > 0 && drawerRef.current) {
      // Reset position if not passed threshold
      gsap.to(drawerRef.current, {
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    // Reset trackers
    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  const handleMaximize = useCallback(() => {
    // Hard navigation to force full page reload and break out of interception
    window.location.href = `/posts/${imageId}`;
  }, [imageId]);

  // Mount/Enter Animation
  useEffect(() => {
    // Lock body scroll
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Initialize GSAP context
    ctxRef.current = gsap.context(() => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;

      // Initial States
      gsap.set(backdropRef.current, { opacity: 0 });

      if (isDesktop) {
        gsap.set(drawerRef.current, { x: "100%", y: 0 }); // Slide in from right
      } else {
        gsap.set(drawerRef.current, { x: 0, y: "100%" }); // Slide in from bottom
      }

      // Animate Drawer & Backdrop
      const tl = gsap.timeline();

      tl.to(
        backdropRef.current,
        {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        },
        0
      ).to(
        drawerRef.current,
        {
          x: "0%",
          y: "0%",
          duration: 0.5,
          ease: "power3.out",
        },
        0.1
      ); // Slight delay for drawer
    }, containerRef);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      ctxRef.current?.revert();
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Track floating image container size with ResizeObserver
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

  // Calculate the actual displayed image rect when using object-contain
  const getContainedImageRect = () => {
    if (!naturalSize || !containerSize) return null;
    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;

    let width, height, left, top;
    if (imageAspect > containerAspect) {
      // Image is wider - fits width, letterboxed top/bottom
      width = containerSize.width;
      height = width / imageAspect;
      left = 0;
      top = (containerSize.height - height) / 2;
    } else {
      // Image is taller - fits height, letterboxed left/right
      height = containerSize.height;
      width = height * imageAspect;
      top = 0;
      left = (containerSize.width - width) / 2;
    }
    return { width, height, left, top };
  };

  // Content Rendering Logic
  const renderContent = () => {
    // Check if imageId is missing
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

    const magazineTitle = publishedMagazineLayout?.title ?? null;

    const brands =
      publishedMagazineLayout?.items
        ?.map((item) => item.brand)
        .filter((b): b is string => !!b && b.trim() !== "") ?? [];
    const uniqueBrands = [...new Set(brands)];

    const styleTags =
      (publishedMagazineLayout?.design_spec as { style_tags?: string[] })
        ?.style_tags ?? [];

    const img = image as ImageDetailWithPostOwner;
    const artistTags = [img?.artist_name, img?.group_name]
      .filter((v): v is string => !!v && v.trim() !== "")
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

    return (
      <ImageDetailPreview
        image={image}
        magazineTitle={magazineTitle}
        artistTags={artistTags}
        brands={uniqueBrands}
        styleTags={styleTags}
        onViewFull={handleMaximize}
      />
    );
  };

  // Floating Image Animation (runs when image source becomes available)
  // Skip on mobile - Floating Image is not rendered on mobile
  useEffect(() => {
    if (!activeImageSrc || !leftImageContainerRef.current) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    // Skip animation on mobile - Floating Image is hidden on mobile
    if (!isDesktop) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (originRect) {
      // Start at grid position (FLIP animation)
      gsap.set(leftImageContainerRef.current, {
        position: "fixed",
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        borderRadius: "0.75rem",
        zIndex: 60,
        opacity: 1,
      });

      // Calculate Target Position

      // Desktop: Center of Left Area
      // Drawer Width Logic (must match CSS classes):
      // - xl (1280px+): 700px
      // - lg (1024px+): 600px
      // - md (768px+): 50vw
      let drawerWidth;
      if (viewportWidth >= 1280) {
        drawerWidth = 700;
      } else if (viewportWidth >= 1024) {
        drawerWidth = 600;
      } else {
        drawerWidth = viewportWidth * 0.5;
      }

      const leftSpace = viewportWidth - drawerWidth;

      const targetWidth = Math.min(leftSpace * 0.7, 500);
      const targetHeight = viewportHeight * 0.75;

      const targetProps = {
        top: (viewportHeight - targetHeight) / 2,
        left: (leftSpace - targetWidth) / 2,
        width: targetWidth,
        height: targetHeight,
        borderRadius: "0.5rem",
      };

      // Animate Image from grid to target position
      const tl = gsap.timeline();

      // Main flight animation with 3D depth effects
      tl.to(leftImageContainerRef.current, {
        ...targetProps,
        duration: 0.6,
        ease: "power3.inOut",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", // Lift effect shadow
      });

      // Add scale pulse for 3D "lift" feel
      // This creates a subtle parabolic motion on the Z-axis
      tl.to(
        leftImageContainerRef.current,
        {
          scale: 1.02,
          duration: 0.3,
          ease: "power1.out",
          yoyo: true,
          repeat: 1,
        },
        0
      );
    } else {
      // No originRect: Show image directly at target position (fallback, desktop only)
      let drawerWidth;
      if (viewportWidth >= 1280) {
        drawerWidth = 700;
      } else if (viewportWidth >= 1024) {
        drawerWidth = 600;
      } else {
        drawerWidth = viewportWidth * 0.5;
      }

      const leftSpace = viewportWidth - drawerWidth;
      const targetWidth = Math.min(leftSpace * 0.7, 500);
      const targetHeight = viewportHeight * 0.75;

      const targetProps = {
        position: "fixed",
        top: (viewportHeight - targetHeight) / 2,
        left: (leftSpace - targetWidth) / 2,
        width: targetWidth,
        height: targetHeight,
        borderRadius: "0.5rem",
        zIndex: 60,
        opacity: 1,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      };

      gsap.set(leftImageContainerRef.current, targetProps);
    }
  }, [activeImageSrc, originRect]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex items-end md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      style={{ perspective: "1200px" }} // Enable 3D perspective
    >
      {/* Backdrop (z-40) */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40"
        aria-hidden="true"
      />

      {/* Floating Image / Left Side Image (z-60) - Desktop Only */}
      {/* On mobile, this is hidden - Drawer fills the screen instead */}
      {activeImageSrc && (
        <div
          ref={leftImageContainerRef}
          className="hidden md:block fixed z-60 shadow-2xl rounded-lg overflow-hidden"
          style={{
            opacity: 0, // Initially hidden, set by GSAP
            // Initial positioning will be handled by GSAP based on originRect
          }}
          onWheel={handleImageScroll} // Forward scroll events
        >
          {/* Blurred post image as background (letterbox fill) */}
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
          <img
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

          {/* Spot Markers on Floating Image - with hover tooltip (brand, label, category) */}
          {image?.items &&
            image.items.length > 0 &&
            (() => {
              const imageRect = getContainedImageRect();
              if (!imageRect) return null;
              const accentColor = (
                magazine?.layout_json as {
                  design_spec?: { accent_color?: string };
                }
              )?.design_spec?.accent_color;

              return (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {image.items.map((item, idx) => {
                    const center = Array.isArray(item.center)
                      ? item.center
                      : null;
                    if (!center || center.length < 2) return null;
                    const fracX =
                      typeof center[0] === "number"
                        ? center[0]
                        : parseFloat(String(center[0])) || 0;
                    const fracY =
                      typeof center[1] === "number"
                        ? center[1]
                        : parseFloat(String(center[1])) || 0;
                    const pixelLeft =
                      imageRect.left +
                      imageRect.width * (fracX > 1 ? fracX / 100 : fracX);
                    const pixelTop =
                      imageRect.top +
                      imageRect.height * (fracY > 1 ? fracY / 100 : fracY);
                    const meta = item.metadata as unknown as
                      | Record<string, unknown>
                      | undefined;
                    const brand = meta?.brand as string | undefined;
                    const category = meta?.sub_category as string | undefined;

                    return (
                      <SpotDot
                        key={item.id ?? idx}
                        mode="pixel"
                        leftPx={pixelLeft}
                        topPx={pixelTop}
                        label={item.product_name ?? ""}
                        brand={brand}
                        category={category}
                        accentColor={accentColor}
                      />
                    );
                  })}
                </div>
              );
            })()}
        </div>
      )}

      {/* Drawer (z-70) - 이미지가 z-60이므로 그 위로 올라와야 숫자가 겹쳐 보임 */}
      <aside
        ref={drawerRef}
        className="relative z-[70] flex h-full w-full flex-col bg-background shadow-2xl md:w-[50vw] lg:w-[600px] xl:w-[700px] translate-y-full md:translate-x-full md:translate-y-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-lenis-prevent
      >
        {/* Scrollable Content Area */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          {renderContent()}
        </div>

        {/* Floating Controls */}
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
