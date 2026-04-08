"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

/** Generate a tiny thumbnail URL via Next.js image optimizer for blur background */
function getBlurSrc(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=32&q=1`;
}

interface PostImageProps {
  src: string;
  alt: string;
  /** Max height CSS value, e.g. "80vh", "300px", "60vh" */
  maxHeight?: string;
  /** Additional className on the container */
  className?: string;
  /** Additional className on the img element */
  imgClassName?: string;
  /** Loading priority */
  priority?: boolean;
  /** Feature flag key — which component is using this */
  flagKey?: keyof typeof FEATURE_FLAGS.dynamicImageRatio;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image errors */
  onError?: () => void;
}

/**
 * PostImage — shared post image display with blur background.
 *
 * Reddit-style object-contain + blurred background fills letterbox.
 * When feature flag is off, falls back to object-cover (original behavior).
 */
export function PostImage({
  src,
  alt,
  maxHeight = "80vh",
  className,
  imgClassName,
  priority = false,
  flagKey = "FeedCard",
  onLoad,
  onError,
}: PostImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const useDynamic = FEATURE_FLAGS.dynamicImageRatio[flagKey];

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError || !src) {
    return (
      <div
        className={cn("w-full bg-neutral-900", className)}
        style={{ aspectRatio: "3/4" }}
      />
    );
  }

  if (!useDynamic) {
    // Fallback: original object-cover behavior
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted min-h-[200px]",
          className
        )}
        style={{ maxHeight }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-opacity duration-200 ease-out",
            isLoaded ? "opacity-100" : "opacity-0",
            imgClassName
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // Dynamic: blur background (tiny thumbnail) + object-contain
  return (
    <div
      className={cn("relative overflow-hidden bg-black", className)}
      style={{ maxHeight }}
    >
      {/* Blurred background — loads tiny 32px thumbnail instead of full image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${getBlurSrc(src)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(24px) brightness(0.7)",
          transform: "scale(1.15)",
        }}
      />
      <Image
        src={src}
        alt={alt}
        fill
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(
          "relative z-10 object-contain transition-opacity duration-200 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
