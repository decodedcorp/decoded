"use client";

import { type UploadedImage } from "@/lib/stores/requestStore";
import { UPLOAD_CONFIG } from "@/lib/utils/validation";
import { ImagePreview } from "./ImagePreview";
import { DropZone } from "./DropZone";

interface ImagePreviewGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onAddMore: (files: File[]) => void;
}

export function ImagePreviewGrid({
  images,
  onRemove,
  onRetry,
  onAddMore,
}: ImagePreviewGridProps) {
  const isMaxImages = images.length >= UPLOAD_CONFIG.maxImages;
  const hasImages = images.length > 0;

  if (!hasImages) {
    return null;
  }

  // Single image layout - centered, large preview
  const isSingleImage = images.length === 1 && UPLOAD_CONFIG.maxImages === 1;

  if (isSingleImage) {
    const image = images[0];
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="relative w-full max-w-md aspect-[3/4]">
          <ImagePreview
            image={image}
            onRemove={onRemove}
            onRetry={onRetry}
            large
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {image.file.name} · {(image.file.size / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }

  // Multi-image grid layout
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground/80">
          Selected Images ({images.length}/{UPLOAD_CONFIG.maxImages})
        </h2>
        {isMaxImages && (
          <span className="text-xs text-foreground/50">Maximum reached</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <ImagePreview
            key={image.id}
            image={image}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}

        {!isMaxImages && (
          <DropZone
            onFilesSelected={onAddMore}
            compact
            className="aspect-square"
          />
        )}
      </div>
    </div>
  );
}
