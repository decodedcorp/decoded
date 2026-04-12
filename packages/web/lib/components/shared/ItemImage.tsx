"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Generate a tiny thumbnail URL via Next.js image optimizer for blur background */
function getBlurSrc(src: string): string {
  const target =
    src.startsWith("http://") || src.startsWith("https://")
      ? `/api/v1/image-proxy?url=${encodeURIComponent(src)}`
      : src;
  return `/_next/image?url=${encodeURIComponent(target)}&w=32&q=1`;
}

const SIZE_CONFIG = {
  thumbnail: {
    aspectRatio: "1/1",
    sizes: "56px",
    blur: false,
  },
  card: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 50vw, 25vw",
    blur: true,
  },
  detail: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 14rem, 15rem",
    blur: true,
  },
  hero: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 100vw, 50vw",
    blur: true,
  },
} as const;

type ItemImageSize = keyof typeof SIZE_CONFIG;

interface ItemImageProps {
  src: string;
  alt: string;
  size: ItemImageSize;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function ItemImage({
  src,
  alt,
  size,
  className,
  imgClassName,
  priority = false,
  onLoad,
  onError,
}: ItemImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const config = SIZE_CONFIG[size];

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
        className={cn(
          "w-full overflow-hidden border border-border/20 bg-muted",
          className
        )}
        style={{ aspectRatio: config.aspectRatio }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-border/20",
        config.blur ? "bg-black" : "bg-muted",
        className
      )}
      style={{ aspectRatio: config.aspectRatio }}
    >
      {/* Blur background — loads tiny 32px thumbnail instead of full image */}
      {config.blur && (
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
      )}

      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "z-10 object-contain transition-opacity duration-200 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        sizes={config.sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
